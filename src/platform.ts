import { Matterbridge, MatterbridgeDynamicPlatform, PlatformConfig } from 'matterbridge';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';

import { discoverDevices } from './roborock.js';

export class TemplatePlatform extends MatterbridgeDynamicPlatform {
  public token: string | undefined;
  public statusIntervals: Record<string, NodeJS.Timeout> = {};

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    super(matterbridge, log, config);

    this.token = (config.token as string) ?? process.env.ROBOROCK_TOKEN;

    if (!this.token) {
      this.log.error('Missing Miio token!');
      this.log.error(' - Platform Config Props: token');
      this.log.error(' - Environment Variables: ROBOROCK_TOKEN');
    }

    if (this.verifyMatterbridgeVersion === undefined || typeof this.verifyMatterbridgeVersion !== 'function' || !this.verifyMatterbridgeVersion('3.1.0')) {
      throw new Error(
        `This plugin requires Matterbridge version >= "3.1.0". Please update Matterbridge from ${this.matterbridge.matterbridgeVersion} to the latest version in the frontend.`,
      );
    }

    this.log.info(`Initializing Platform...`);
  }

  override async onStart(reason?: string) {
    this.log.info(`onStart called with reason: ${reason ?? 'none'}`);
    await this.ready;
    await this.clearSelect();
    await discoverDevices(this);
  }

  override async onConfigure() {
    await super.onConfigure();
    this.log.info('onConfigure called');
    for (const device of this.getDevices()) {
      this.log.info(`Configuring device: ${device.uniqueId}`);
    }
  }

  override async onChangeLoggerLevel(logLevel: LogLevel) {
    this.log.info(`onChangeLoggerLevel called with: ${logLevel}`);
  }

  override async onShutdown(reason?: string) {
    await super.onShutdown(reason);
    this.log.info(`onShutdown called with reason: ${reason ?? 'none'}`);
    Object.values(this.statusIntervals).forEach(clearInterval);
    this.statusIntervals = {};
    if (this.config.unregisterOnShutdown === true) await this.unregisterAllDevices();
  }
}
