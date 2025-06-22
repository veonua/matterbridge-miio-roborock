import dgram from 'node:dgram';
import { resolve4 } from 'node:dns/promises';

import mdns from 'multicast-dns';
import { AnsiLogger } from 'node-ansi-logger';

import { Packet } from './packet.js';
import { IFanPower } from './types.js';

export class RoborockClient {
  private socket = dgram.createSocket('udp4');
  private packet: Packet;
  static async discover(log: AnsiLogger, timeout = 3000): Promise<
    | {
        model: string;
        serialNumber: string;
        host: string;
      }
    | undefined
  > {
    const m = mdns();
    return new Promise((resolve) => {
      const devices = new Map<string, { model: string; serialNumber: string; host: string }>();
      const pending: Promise<void>[] = [];
      const finish = () => {
        Promise.all(pending).then(() => {
          m.destroy();
          resolve(devices.values().next().value);
        });
      };
      const timer = setTimeout(finish, timeout);
      m.on('response', (resp: { answers: Array<{ type: string; name: string; data: unknown }> }) => {
        log.debug(`mDNS response: ${JSON.stringify(resp)}`);
        for (const answer of resp.answers) {
          if (answer.type === 'PTR' && answer.name === '_miio._udp.local') {
            const serviceName = String(answer.data);
            if (!devices.has(serviceName)) {
              log.info(`Discovered service: ${serviceName}`);
              const match = serviceName.match(/^(.*)_miio(\d+)\._miio\._udp\.local$/);
              if (match) {
                const [, model, serialNumber] = match;
                const p = resolve4(serviceName)
                  .then((addresses: string[]) => {
                    log.info(`Resolved ${serviceName} to addresses: ${addresses.join(', ')}`);
                    if (addresses && addresses[0]) {
                      devices.set(serviceName, { model, serialNumber, host: addresses[0] });
                    }
                  })
                  .catch(() => {
                    log.warn(`Failed to resolve ${serviceName}`);
                  });
                pending.push(p);
              }
            }
          }
        }
      });
      m.query([{ name: '_miio._udp.local', type: 'PTR' }]);
    });
  }
  constructor(
    private log: AnsiLogger,
    private host: string,
    private deviceId: number,
    token: string,
  ) {
    this.log = log;
    this.packet = new Packet(deviceId, token);
  }

  private async ensureHandshake() {
    if (this.packet.needsHandshake) {
      await this.handshake();
    }
  }

  async handshake() {
    this.log.info(`Sending handshake to ${this.host}`);
    const msg = Buffer.from(this.packet.handshake, 'hex');
    await new Promise<void>((resolve, reject) => {
      this.socket.send(msg, 0, msg.length, 54321, this.host, (err) => {
        if (err) {
          this.log.error(`Handshake failed: ${err.message}`);
          reject(err);
        } else {
          this.log.info(`Handshake successful with ${this.host}`);
          resolve();
        }
      });
    });
  }

  async sendCommand(method: string, params?: any[]) {
    await this.ensureHandshake();
    const buf = this.packet.encode({ method, params });
    await new Promise<void>((resolve, reject) => {
      this.socket.send(buf, 0, buf.length, 54321, this.host, (err) => {
        if (err) {
          this.log.error(`Failed to send command ${method} to ${this.host}: ${err.message}`);
          reject(err);
        } else {
          this.log.info(`Command ${method} sent to ${this.host}`);
          resolve();
        }
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

  async setMode(mode: IFanPower) {
    await this.sendCommand('set_custom_mode', [mode]);
  }

  /**
   * response example:
   * {"result":[{"msg_ver":3,"msg_seq":10,"state":8,"battery":100,"clean_time":3493,"clean_area":43817500,"error_code":0,"map_present":1,"in_cleaning":0,"in_returning":0,"in_fresh_state":1,"lab_status":1,"water_box_status":0,"fan_power":102,"dnd_enabled":0,"map_status":3,"lock_status":0}],"id":2}
   */
}
