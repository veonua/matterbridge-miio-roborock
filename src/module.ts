import { Matterbridge, MatterbridgeDynamicPlatform, MatterbridgeEndpoint, onOffOutlet, PlatformConfig, RoboticVacuumCleaner } from 'matterbridge';
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

  /**
       * Creates a default RvcRunMode Cluster Server.
       *
       * @param {number} [currentMode] - The current mode of the RvcRunMode cluster. Defaults to 1 (Idle).
       * @param {RvcRunMode.ModeOption[]} [supportedModes] - The supported modes for the RvcRunMode cluster. Defaults to a predefined set of modes.
       *
       * @returns {this} The current MatterbridgeEndpoint instance for chaining.
       *
      createDefaultRvcRunModeClusterServer(currentMode, supportedModes) {
          this.behaviors.require(MatterbridgeRvcRunModeServer, {
              supportedModes: supportedModes ?? [
                  { label: 'Idle', mode: 1, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
                  { label: 'Cleaning', mode: 2, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
                  { label: 'Mapping', mode: 3, modeTags: [{ value: RvcRunMode.ModeTag.Mapping }] },
                  { label: 'SpotCleaning', mode: 4, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }, { value: RvcRunMode.ModeTag.Max }] },
              ],
              currentMode: currentMode ?? 1,
          });
          return this;
      }
      **
       * Creates a default RvcCleanMode Cluster Server.
       *
       * @param {number} [currentMode] - The current mode of the RvcCleanMode cluster. Defaults to 1 (Vacuum).
       * @param {RvcCleanMode.ModeOption[]} [supportedModes] - The supported modes for the RvcCleanMode cluster. Defaults to a predefined set of modes.
       *
       * @returns {this} The current MatterbridgeEndpoint instance for chaining.
       *
      createDefaultRvcCleanModeClusterServer(currentMode, supportedModes) {
          this.behaviors.require(MatterbridgeRvcCleanModeServer, {
              supportedModes: supportedModes ?? [
                  { label: 'Vacuum', mode: 1, modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }] },
                  { label: 'Mop', mode: 2, modeTags: [{ value: RvcCleanMode.ModeTag.Mop }] },
                  { label: 'Clean', mode: 3, modeTags: [{ value: RvcCleanMode.ModeTag.DeepClean }] },
              ],
              currentMode: currentMode ?? 1,
          });
          return this;
      }
      **
       * Creates a default ServiceArea Cluster Server.
       *
       * @param {ServiceArea.Area[]} [supportedAreas] - The supported areas for the ServiceArea cluster. Defaults to a predefined set of areas.
       * @param {number[]} [selectedAreas] - The selected areas for the ServiceArea cluster. Defaults to an empty array (all areas allowed).
       * @returns {this} The current MatterbridgeEndpoint instance for chaining.
       *
      createDefaultServiceAreaClusterServer(supportedAreas, selectedAreas, currentArea) {
          this.behaviors.require(MatterbridgeServiceAreaServer, {
              supportedAreas: supportedAreas ?? [
                  {
                      areaId: 1,
                      mapId: null,
                      areaInfo: { locationInfo: { locationName: 'Living', floorNumber: null, areaType: null }, landmarkInfo: null },
                  },
                  {
                      areaId: 2,
                      mapId: null,
                      areaInfo: { locationInfo: { locationName: 'Kitchen', floorNumber: null, areaType: null }, landmarkInfo: null },
                  },
                  {
                      areaId: 3,
                      mapId: null,
                      areaInfo: { locationInfo: { locationName: 'Bedroom', floorNumber: null, areaType: null }, landmarkInfo: null },
                  },
                  {
                      areaId: 4,
                      mapId: null,
                      areaInfo: { locationInfo: { locationName: 'Bathroom', floorNumber: null, areaType: null }, landmarkInfo: null },
                  },
              ],
              selectedAreas: selectedAreas ?? [],
              currentArea: currentArea ?? 1,
              estimatedEndTime: null,
          });
          return this;
      }
      **
       * Creates a default RvcOperationalState Cluster Server.
       *
       * @param {string[] | null} [phaseList] - The list of phases for the RvcOperationalState cluster. Defaults to null.
       * @param {number | null} [currentPhase] - The current phase of the RvcOperationalState cluster. Defaults to null.
       * @param {RvcOperationalState.OperationalStateStruct[]} [operationalStateList] - The list of operational states for the RvcOperationalState cluster. Defaults to a predefined set of states.
       * @param {RvcOperationalState.OperationalState} [operationalState] - The current operational state of the RvcOperationalState cluster. Defaults to Docked.
       * @param {RvcOperationalState.ErrorStateStruct} [operationalError] - The current operational error of the RvcOperationalState cluster. Defaults to NoError.
       * @returns {this} The current MatterbridgeEndpoint instance for chaining.
       *
      createDefaultRvcOperationalStateClusterServer(phaseList = null, currentPhase = null, operationalStateList, operationalState, operationalError) {
          this.behaviors.require(MatterbridgeRvcOperationalStateServer, {
              phaseList,
              currentPhase,
              operationalStateList: operationalStateList ?? [
                  { operationalStateId: RvcOperationalState.OperationalState.Stopped, operationalStateLabel: 'Stopped' },
                  { operationalStateId: RvcOperationalState.OperationalState.Running, operationalStateLabel: 'Running' },
                  { operationalStateId: RvcOperationalState.OperationalState.Paused, operationalStateLabel: 'Paused' },
                  { operationalStateId: RvcOperationalState.OperationalState.Error, operationalStateLabel: 'Error' },
                  { operationalStateId: RvcOperationalState.OperationalState.SeekingCharger, operationalStateLabel: 'SeekingCharger' }, // Y RVC Pause Compatibility N RVC Resume Compatibility
                  { operationalStateId: RvcOperationalState.OperationalState.Charging, operationalStateLabel: 'Charging' }, // N RVC Pause Compatibility Y RVC Resume Compatibility
                  { operationalStateId: RvcOperationalState.OperationalState.Docked, operationalStateLabel: 'Docked' }, // N RVC Pause Compatibility Y RVC Resume Compatibility
              ],
              operationalState: operationalState ?? RvcOperationalState.OperationalState.Docked,
              operationalError: operationalError ?? { errorStateId: RvcOperationalState.ErrorState.NoError, errorStateLabel: 'No Error', errorStateDetails: 'Fully operational' },
          });
          return this;
      }
  */

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



    

    let supportedModes = [
                    { label: 'Idle', mode: 1, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
                    { label: 'Cleaning', mode: 2, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
                    //{ label: 'Mapping', mode: 3, modeTags: [{ value: RvcRunMode.ModeTag.Mapping }] },
                    { label: 'SpotCleaning', mode: 4, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }, { value: RvcRunMode.ModeTag.Max }] },
                ];
    let currentMode = 1;

    let supportedAreas = [
                {
                    areaId: 1,
                    mapId: null,
                    areaInfo: { locationInfo: { locationName: 'Living', floorNumber: null, areaType: null }, landmarkInfo: null },
                },
                {
                    areaId: 2,
                    mapId: null,
                    areaInfo: { locationInfo: { locationName: 'Kitchen', floorNumber: null, areaType: null }, landmarkInfo: null },
                },
                {
                    areaId: 3,
                    mapId: null,
                    areaInfo: { locationInfo: { locationName: 'Bedroom', floorNumber: null, areaType: null }, landmarkInfo: null },
                },
                {
                    areaId: 4,
                    mapId: null,
                    areaInfo: { locationInfo: { locationName: 'Bathroom', floorNumber: null, areaType: null }, landmarkInfo: null },
                },
            ];


    const vacuum = new RoboticVacuumCleaner(
      "Demo Vacuum", // name
      "VAC123456",   // serial
      currentMode, // currentRunMode
      supportedModes //supportedModes 
    ).addCommandHandler('changeToMode', (data) => {
        //  {"newMode":3} 
        this.log.info(`Vacuum changeToMode called with: ${JSON.stringify(data.request)}`);
      });

    await this.registerDevice(vacuum);
  }
}
