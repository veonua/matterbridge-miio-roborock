import { Matterbridge, MatterbridgeDynamicPlatform, PlatformConfig, RoboticVacuumCleaner } from 'matterbridge';
import { RvcRunMode, RvcCleanMode, ServiceArea, RvcOperationalState } from 'matterbridge/matter/clusters';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';
import * as miio from 'miio';

/**
 * This is the standard interface for Matterbridge plugins.
 * Each plugin should export a default function that follows this signature.
 *
 * @param {Matterbridge} matterbridge - An instance of MatterBridge.
 * @param {AnsiLogger} log - An instance of AnsiLogger. This is used for logging messages in a format that can be displayed with ANSI color codes and in the frontend.
 * @param {PlatformConfig} config - The platform configuration.
 * @returns {TemplatePlatform} - An instance of the MatterbridgeAccessory or MatterbridgeDynamicPlatform class. This is the main interface for interacting with the Matterbridge system.
 */
export default function initializePlugin(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig): TemplatePlatform {
  return new TemplatePlatform(matterbridge, log, config);
}

// Here we define the TemplatePlatform class, which extends the MatterbridgeDynamicPlatform.
// If you want to create an Accessory platform plugin, you should extend the MatterbridgeAccessoryPlatform class instead.
export class TemplatePlatform extends MatterbridgeDynamicPlatform {
  private token: string;

  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    // Always call super(matterbridge, log, config)
    super(matterbridge, log, config);

    this.token = '7934776451524e4839584f77617a4566'; // config.token ??
    // Verify that Matterbridge is the correct version
    if (this.verifyMatterbridgeVersion === undefined || typeof this.verifyMatterbridgeVersion !== 'function' || !this.verifyMatterbridgeVersion('3.0.7')) {
      throw new Error(
        `This plugin requires Matterbridge version >= "3.0.7". Please update Matterbridge from ${this.matterbridge.matterbridgeVersion} to the latest version in the frontend."`,
      );
    }

    this.log.info(`Initializing Platform...`);
    // You can initialize your platform here, like setting up initial state or loading configurations.
  }

  override async onStart(reason?: string) {
    this.log.info(`onStart called with reason: ${reason ?? 'none'}`);

    // Wait for the platform to fully load the select
    await this.ready;

    // Clean the selectDevice and selectEntity maps, if you want to reset the select.
    await this.clearSelect();

    // Implements your own logic there
    await this.discoverDevices();
  }

  override async onConfigure() {
    // Always call super.onConfigure()
    await super.onConfigure();

    this.log.info('onConfigure called');

    // Configure all your devices. The persisted attributes need to be updated.
    for (const device of this.getDevices()) {
      this.log.info(`Configuring device: ${device.uniqueId}`);
      // You can update the device configuration here, for example:
      // device.updateConfiguration({ key: 'value' });
    }
  }

  override async onChangeLoggerLevel(logLevel: LogLevel) {
    this.log.info(`onChangeLoggerLevel called with: ${logLevel}`);
    // Change here the logger level of the api you use or of your devices
  }

  override async onShutdown(reason?: string) {
    // Always call super.onShutdown(reason)
    await super.onShutdown(reason);

    this.log.info(`onShutdown called with reason: ${reason ?? 'none'}`);
    if (this.config.unregisterOnShutdown === true) await this.unregisterAllDevices();
  }

  private async discoverDevices() {
    this.log.info('Discovering devices...');

    const browser = miio.browse({
      cacheTime: 300, // 5 minutes. Default is 1800 seconds (30 minutes)
    });

    const devices: Record<string, miio.MiioDevice> = {};

    const runModes: RvcRunMode.ModeOption[] = [
      { label: 'Charge', mode: 1, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
      { label: 'Start', mode: 2, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
      { label: 'Pause', mode: 3, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
      { label: 'Stop', mode: 4, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
    ];

    const cleanModes: RvcCleanMode.ModeOption[] = [
      { label: 'Gentle', mode: 101, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Mop }] },
      { label: 'Silent', mode: 102, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Quiet }] },
      { label: 'Balanced', mode: 103, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Day }] },
      { label: 'Turbo', mode: 104, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.DeepClean }] },
      { label: 'Max', mode: 105, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Max }] },
    ];

    const serviceAreas: ServiceArea.Area[] = [
      {
        areaId: 19,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Kitchen', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 21,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Living Room', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 18,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Master Bedroom', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 16,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Second Bedroom', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 17,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Dressing room', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 20,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Entryway', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
    ];

    browser.on('available', async (reg) => {
      // let roborock: miio.MiioDevice;
      // if (!reg.token) {
      const roborock = await miio.device({
        address: reg.address,
        token: this.token, // id 260426251
      });
      // } else {
      //  roborock = await reg.connect();
      // }

      devices[reg.id] = roborock;

      const status = await roborock.state();

      this.log.info(`Discovered Roborock vacuum: ${roborock.model} with ID ${reg.id} ${JSON.stringify(status)}`);

      const vacuum = new RoboticVacuumCleaner(
        roborock.model || 'Roborock S5',
        String(reg.id), // Convert number to string
        1,
        runModes,
        status.fanSpeed,
        cleanModes,
        3, // balanced
        null,
        status.charging
          ? RvcOperationalState.OperationalState.Charging
          : status.cleaning
            ? RvcOperationalState.OperationalState.Running
            : RvcOperationalState.OperationalState.Paused,
        undefined, // default operational states
        serviceAreas, // service areas
        [], // selected areas
        16, // current area ID
      )
        .addCommandHandler('identify', async () => {
          this.log.info(`Vacuum identify command received for device ID: ${reg.id}`);
          await roborock.find();
        })
        .addCommandHandler('changeToMode', async (data) => {
          const device: miio.MiioDevice = roborock;

          const mode = (data.request as any).newMode;
          if (typeof mode === 'number') {
            switch (mode) {
              case 1:
                await device.activateCharging();
                break;
              case 2:
                await device.activateCleaning();
                break;
              case 3:
                await device.pause();
                break;
              case 4:
                await device.deactivateCleaning();
                break;
              default:
                await device.changeFanSpeed(mode);
                break;
            }
          }
          // this.log.info(`Vacuum changeToMode called with: ${JSON.stringify(data.request)}`);
        })
        .addCommandHandler('pause', async () => {
          await roborock.pause();
          this.log.info('Vacuum pause command received');
        })
        .addCommandHandler('goHome', async () => {
          await roborock.activateCharging();
          this.log.info('Vacuum goHome command received');
        });

      await this.registerDevice(vacuum);
    });
  }
}
