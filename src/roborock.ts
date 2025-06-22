import dgram from 'dgram';
import { resolve4 } from 'node:dns/promises';
import mdns from 'multicast-dns';
import { Packet } from './packet.js';

export class RoborockClient {
  private socket = dgram.createSocket('udp4');
  private packet: Packet;
  static async discover(timeout = 1000): Promise<{
    model: string;
    serialNumber: string;
    host: string;
  } | undefined> {
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
      m.on('response', (resp) => {
        for (const answer of resp.answers) {
          if (answer.type === 'PTR' && answer.name === '_miio._udp.local') {
            const serviceName = String(answer.data);
            if (!devices.has(serviceName)) {
              const match = serviceName.match(/^(.*)_miio(\d+)\._miio\._udp\.local$/);
              if (match) {
                const [, model, serialNumber] = match;
                const p = resolve4(serviceName)
                  .then((addresses) => {
                    if (addresses && addresses[0]) {
                      devices.set(serviceName, { model, serialNumber, host: addresses[0] });
                    }
                  })
                  .catch(() => {});
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
    private host: string,
    private deviceId: number,
    token: string,
  ) {
    this.packet = new Packet(deviceId, token);
  }

  private async ensureHandshake() {
    if (this.packet.needsHandshake) {
      await this.handshake();
    }
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
    await this.ensureHandshake();
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