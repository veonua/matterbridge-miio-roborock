import { IDeviceState, IErrorState, IMiCommand, IMiResponse, ISuccessState,  } from "./types"
import { Packet } from "./packet";

const portNumber: number = 54321;

export class MiError extends Error {
    google_error: string
    code: number
    constructor(mi:IMiResponse, error_codes: { [id: number]: string; } ) {
        super(mi.error!.message)
        this.code = mi.error!.code
        this.google_error = error_codes[this.code]
    }
}

function _sleep(ms: number) : Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


export abstract class IMiDevice<Command, State extends ISuccessState> {
    error_codes: { [id: number]: string; } = {};
    get needsHandshake() { return this.packet.needsHandshake };
	packet: Packet;
    //type: string;
    //deviceId: number;
    deviceIdString: string;
    lastQueryResponse: number = 0;
    cachedQueryResponse: State|null = null;

    get cachedQuery() { 
        if (( Date.now() - this.lastQueryResponse ) > 10*1000) { return null;}
        return this.cachedQueryResponse 
    }

    get initialized() {
        return this.lastQueryResponse>0
    }

	abstract convertImpl(command: string, params: Command|undefined) : IMiCommand
    abstract onQueryResponse(resp_result: any): State
	onResponseImpl(requestId:string, command: string, resp_result: any[]): any {
        return {
			status: 'SUCCESS',
			online: true,
		};
    }
    async afterExecuteImpl(deviceManager:smarthome.DeviceManager, requestId:string, command:string, params:Command|undefined) {}
    

	constructor(public type:string,public deviceId:number, token:string) {
        //this.type = type
        //this.deviceId = deviceId
        this.deviceIdString = deviceId.toString()
		this.packet = new Packet(deviceId, token)
	}

    async sendQuery(deviceManager: smarthome.DeviceManager, requestId: string): Promise<IDeviceState> {
        try {
            let resp = await this.sendMi(deviceManager, requestId, this.convertImpl(smarthome.Intents.QUERY, undefined))    
            const res = this.onQueryResponse(resp.result)
            if (res.status == "SUCCESS") {
                this.lastQueryResponse = Date.now();
                this.cachedQueryResponse = res
            }
            console.log("QUERY response " + requestId, res);
            return res
        } catch (e) {
            if (this.cachedQueryResponse) {
                return this.cachedQueryResponse
            }
            console.error("decode UPD", e)
            return {
                errorCode: "networkJammingDetected"
            } as IErrorState
        }
    }

    async sendMi(deviceManager: smarthome.DeviceManager, requestId: string, command: IMiCommand): Promise<IMiResponse> {
        const result = (await deviceManager.send(this.makeCommandRequest(requestId, command))) as smarthome.DataFlow.UdpResponseData
        try {
            //console.log("QUERY response " + requestId, result);
            return this.packet.decode(result.udpResponse.responsePackets)
        } catch (e) {
            console.error("decode UPD", e)
            throw e
            // return {
            //     id: 0,
            //     result: [''],
            //     error: {
            //         code: -1,
            //         message: "networkJammingDetected"
            //     }
            // }
        }
    }

	onResponse(requestId:string, command: string, result: smarthome.DataFlow.UdpResponseData) : IDeviceState {
        var resp = this.packet.decode(result.udpResponse.responsePackets)
        
        if (resp.error) {
            throw new MiError(resp, this.error_codes)
        }
        this.cachedQueryResponse = null
        return this.onResponseImpl(requestId, command, resp.result)
	}

    async sendHandshake(deviceManager: smarthome.DeviceManager, requestId: string) {
        if (!this.needsHandshake) return Promise.resolve()
        const result = await deviceManager.send(this.makeHandshakeCommand(requestId));
        const udpResult = result as smarthome.DataFlow.UdpResponseData;
        if (!udpResult.udpResponse.responsePackets) {
            throw Error("empty handshake result");
        }
        //console.log("handshake result", udpResult);
        this.packet.decode(udpResult.udpResponse.responsePackets)
        // 21310020000000000 F85CA0 B5F183C88FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
        // 21310020000000000 37439E 600013E6A00000000000000000000000000000000
        //const device_hex = ("00000000" + this.deviceId.toString(16)).substr(-8);
        //let resp = response.substring(0, response.length-this.token.length) + this.token
        //this.packet.raw = Buffer.from(resp, "hex");
    }

    async afterExecute(deviceManager:smarthome.DeviceManager, requestId:string, command:string, params:Command|undefined) {
        this.lastQueryResponse = 0
        return await this.afterExecuteImpl(deviceManager, requestId, command, params)    
    }

    makeHandshakeCommand(requestId: string): smarthome.DataFlow.CommandRequest {
        console.debug("sending hanshake to " + this.deviceIdString);
        const handshakeCommand = new smarthome.DataFlow.UdpRequestData();
        handshakeCommand.requestId = requestId;
        handshakeCommand.deviceId = this.deviceIdString;
        handshakeCommand.port = portNumber;
        handshakeCommand.data = this.packet.handshake
        handshakeCommand.expectedResponsePackets = 1;
        return handshakeCommand
    }

    makeRequest(
        requestId:string, 
        command: string, params: Command|undefined) : smarthome.DataFlow.UdpRequestData {
        return this.makeCommandRequest(requestId, this.convertImpl(command, params))
    }

    makeCommandRequest(
        requestId:string, 
        command: IMiCommand) : smarthome.DataFlow.UdpRequestData {
    
        const req = new smarthome.DataFlow.UdpRequestData() 
        req.requestId = requestId;
        req.deviceId = this.deviceIdString
        req.port = portNumber;
        let buf = this.packet.encode(command)
        req.data = buf.toString('hex');
        console.log(" data "+req.data)
        req.expectedResponsePackets = 1;
        return req
    }

}