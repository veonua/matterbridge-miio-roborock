import dgram from 'dgram';
import { Packet } from './packet.js';

export class RoborockClient {
  private socket = dgram.createSocket('udp4');
  private packet: Packet;
  constructor(
    private host: string,
    private deviceId: number,
    token: string,
  ) {
    this.packet = new Packet(deviceId, token);
  }

  async handshake() {
    const msg = Buffer.from(this.packet.handshake, 'hex');
    await new Promise<void>((resolve, reject) => {
      this.socket.send(msg, 0, msg.length, 54321, this.host, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async sendCommand(method: string, params?: any[]) {
    const buf = this.packet.encode({ method, params });
    await new Promise<void>((resolve, reject) => {
      this.socket.send(buf, 0, buf.length, 54321, this.host, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async startCleaning() {
    await this.sendCommand('app_start');
  }

  async stopCleaning() {
    await this.sendCommand('app_stop');
  }

  async pauseCleaning() {
    await this.sendCommand('app_pause');
  }

  async resumeCleaning() {
    await this.sendCommand('app_start');
  }

  async dock() {
    await this.sendCommand('app_charge');
  }

  async locate() {
    await this.sendCommand('find_me');
  }

  async setMode(mode: number) {
    await this.sendCommand('set_custom_mode', [mode]);
  }
}