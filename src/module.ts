import { Matterbridge, MatterbridgeDynamicPlatform, PlatformConfig, RoboticVacuumCleaner } from 'matterbridge';
import { RvcRunMode, RvcCleanMode, ServiceArea, RvcOperationalState } from 'matterbridge/matter/clusters';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';

import { RoborockClient } from './roborock.js';

/**
 MDNS discovery example for Roborock S5 vacuum cleaner.
 {
    "mdnsScanData": {
        "serviceName": "roborock-vacuum-s5_miio260426251._miio._udp.local",
        "name": "roborock-vacuum-s5_miio260426251",
        "type": "miio",
        "protocol": "udp",
        "data": [
            "path=/mydevice"
        ],
        "txt": {
            "path": "/mydevice"
        }
    }
}

 ***

 {
    "fan_power": 102,
    "reddit": "veonua",
    "segments": {
        "bedroom": {
            "aliases": [
                "master bedroom",
                "left room"
            ],
            "segments": [
                18
            ]
        },
        "corridor": {
            "aliases": [
                "dressing room"
            ],
            "segments": [
                17
            ]
        },
        "entryway": {
            "aliases": [
                "entrance",
                "hall",
                "hallway"
            ],
            "fan_power": 103,
            "segments": [
                20
            ]
        },
        "kitchen": {
            "aliases": [
                "cookery"
            ],
            "fan_power": 103,
            "segments": [
                19
            ]
        },
        "living room": {
            "aliases": [
                "lounge"
            ],
            "segments": [
                21
            ]
        },
        "second bedroom": {
            "aliases": [
                "guest bedroom",
                "right room"
            ],
            "segments": [
                16
            ]
        }
    },
    "token": "7934776451524e4839584f77617a4566"
}
 */

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
  private roborock?: RoborockClient;
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

    this.roborock = new RoborockClient('192.168.1.100', 1234567890, '00000000000000000000000000000000');
    await this.roborock.handshake();

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
      .addCommandHandler('changeToMode', async (data) => {
        const mode = (data.request as any).newMode;
        if (typeof mode === 'number') {
          await this.roborock?.setMode(mode);
        }
        this.log.info(`Vacuum changeToMode called with: ${JSON.stringify(data.request)}`);
      })
      .addCommandHandler('pause', async () => {
        await this.roborock?.pauseCleaning();
        this.log.info('Vacuum pause command received');
      })
      .addCommandHandler('resume', async () => {
        await this.roborock?.resumeCleaning();
        this.log.info('Vacuum resume command received');
      })
      .addCommandHandler('goHome', async () => {
        await this.roborock?.dock();
        this.log.info('Vacuum goHome command received');
      });
      
      // .addCommandHandler('locate', async () => {
      //   await this.roborock?.locate();
      //   this.log.info('Vacuum locate command received');
      // });

    await this.registerDevice(vacuum);
  }
}
