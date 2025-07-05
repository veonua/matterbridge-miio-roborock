import { Matterbridge, MatterbridgeDynamicPlatform, PlatformConfig } from 'matterbridge';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';
import type * as miio from 'miio';

import { discoverDevices } from './roborock.js';

export class TemplatePlatform extends MatterbridgeDynamicPlatform {
  public token: string | undefined;
  public refreshInterval: number;
  public statusIntervals: Record<string, NodeJS.Timeout> = {};
  public statusFetchers: Record<string, () => Promise<void>> = {};
  public miioDevices: Record<string, { destroy(): void }> = {};
  public miioBrowser: miio.Browser | null = null;

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    super(matterbridge, log, config);

    this.token = (config.token as string) ?? process.env.ROBOROCK_TOKEN;
    this.refreshInterval = typeof config.refreshInterval === 'number' ? config.refreshInterval * 1000 : 120000;

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

  override async onConfigChanged(config: PlatformConfig) {
    await super.onConfigChanged(config);
    if (typeof config.refreshInterval === 'number') {
      this.refreshInterval = config.refreshInterval * 1000;
      this.log.info(`Refresh interval updated to ${this.refreshInterval}ms`);
      for (const id of Object.keys(this.statusIntervals)) {
        clearInterval(this.statusIntervals[id]);
        const fetcher = this.statusFetchers[id];
        if (fetcher) {
          this.statusIntervals[id] = setInterval(fetcher, this.refreshInterval);
        }
      }
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

    // Destroy miio devices
    for (const [id, device] of Object.entries(this.miioDevices)) {
      try {
        if (device && typeof device.destroy === 'function') {
          device.destroy();
          this.log.debug(`Destroyed miio device ${id}`);
        }
      } catch (error) {
        this.log.error(`Error destroying miio device ${id}: ${String(error)}`);
      }
    }
    this.miioDevices = {};

    // Destroy miio browser
    if (this.miioBrowser) {
      try {
        // Try to destroy if it has a destroy method
        const browserWithDestroy = this.miioBrowser as { destroy?(): void };
        if (typeof browserWithDestroy.destroy === 'function') {
          browserWithDestroy.destroy();
          this.log.debug('Destroyed miio browser');
        } else {
          // For EventEmitter-based browsers, remove all listeners
          this.miioBrowser.removeAllListeners();
          this.log.debug('Cleaned up miio browser listeners');
        }
      } catch (error) {
        this.log.error(`Error destroying miio browser: ${String(error)}`);
      }
      this.miioBrowser = null;
    }

    if (this.config.unregisterOnShutdown === true) await this.unregisterAllDevices();
  }
}
