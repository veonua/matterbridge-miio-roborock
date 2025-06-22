import {
  Matterbridge,
  MatterbridgeDynamicPlatform,
  MatterbridgeEndpoint,
  onOffOutlet,
  PlatformConfig,
  RoboticVacuumCleaner,
} from 'matterbridge';
import { RvcRunMode, RvcCleanMode, ServiceArea, RvcOperationalState } from 'matterbridge/matter/clusters';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';

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
  constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
    // Always call super(matterbridge, log, config)
    super(matterbridge, log, config);

    // Verify that Matterbridge is the correct version
    if (
      this.verifyMatterbridgeVersion === undefined ||
      typeof this.verifyMatterbridgeVersion !== 'function' ||
      !this.verifyMatterbridgeVersion('3.0.7')
    ) {
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
    // Implement device discovery logic here.
    // For example, you might fetch devices from an API.
    // and register them with the Matterbridge instance.

    // Example: Create and register an outlet device
    // If you want to create an Accessory platform plugin and your platform extends MatterbridgeAccessoryPlatform,
    // instead of createDefaultBridgedDeviceBasicInformationClusterServer, call createDefaultBasicInformationClusterServer().
    const outlet = new MatterbridgeEndpoint(onOffOutlet, { uniqueStorageKey: 'outlet1' })
      .createDefaultBridgedDeviceBasicInformationClusterServer(
        'Outlet',
        'SN123456',
        this.matterbridge.aggregatorVendorId,
        'Matterbridge',
        'Matterbridge Outlet',
        10000,
        '1.0.0',
      )
      .createDefaultPowerSourceWiredClusterServer()
      .addRequiredClusterServers()
      .addCommandHandler('on', (data) => {
        this.log.info(`Command on called on cluster ${data.cluster}`);
      })
      .addCommandHandler('off', (data) => {
        this.log.info(`Command off called on cluster ${data.cluster}`);
      });

    // await this.registerDevice(outlet);

    // Example: Create and register a robotic vacuum cleaner device
    const runModes: RvcRunMode.ModeOption[] = [
      { label: 'Idle', mode: 1, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
      { label: 'Cleaning', mode: 2, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
    ];

    const cleanModes: RvcCleanMode.ModeOption[] = [
      { label: 'Gentle', mode: 1, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Mop }] },
      { label: 'Silent', mode: 2, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Quiet }] },
      { label: 'Balanced', mode: 3, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Day }] },
      { label: 'Turbo', mode: 4, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }] },
      { label: 'Max', mode: 5, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }] },
    ];

    const serviceAreas: ServiceArea.Area[] = [
      {
        areaId: 1,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Kitchen', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 2,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Living Room', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 3,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Master Bedroom', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 4,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Second Bedroom', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 5,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Dressing', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
      {
        areaId: 6,
        mapId: null,
        areaInfo: { locationInfo: { locationName: 'Entryway', floorNumber: 1, areaType: null }, landmarkInfo: null },
      },
    ];

    const operationalState = RvcOperationalState.OperationalState.Charging;

    const vacuum = new RoboticVacuumCleaner(
      'Roborock S5',
      'SN123456',
      1,
      runModes,
      1,
      cleanModes,
      3, // balanced
      null,
      operationalState,
      undefined,
      serviceAreas,
    )
      .addCommandHandler('changeToMode', (data) => {
        this.log.info(`Vacuum changeToMode called with: ${JSON.stringify(data.request)}`);
      })
      .addCommandHandler('pause', () => {
        this.log.info('Vacuum pause command received');
      })
      .addCommandHandler('resume', () => {
        this.log.info('Vacuum resume command received');
      })
      .addCommandHandler('goHome', () => {
        this.log.info('Vacuum goHome command received');
      });

    await this.registerDevice(vacuum);
  }
}
