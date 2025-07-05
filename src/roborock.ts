import * as miio from 'miio';
import { RoboticVacuumCleaner } from 'matterbridge';
import { RvcRunMode, RvcCleanMode, ServiceArea, RvcOperationalState, PowerSource } from 'matterbridge/matter/clusters';

import { runModes, cleanModes, serviceAreas, stateToOperationalStateMap, operationalErrorMap, ErrorCode } from './constants.js';
import { TemplatePlatform } from './platform.js';

/**
 * Discover Roborock devices and register them with Matterbridge.
 *
 * @param {TemplatePlatform} platform - The platform instance.
 */
export async function discoverDevices(platform: TemplatePlatform): Promise<void> {
  const { log, token } = platform;
  log.info('Discovering devices...');

  const browser = miio.browse({ cacheTime: 300 });
  const devices: Record<string, miio.MiioDevice> = {};
  
  // Store browser reference for cleanup
  platform.miioBrowser = browser;

  browser.on('available', async (reg) => {
    // let token_str: string;
    // if (reg.token) {
    //  token_str = typeof reg.token === 'string' ? reg.token : Buffer.from(reg.token.data).toString('hex');
    // } else {
    if (!token) {
      log.error(`Device with ID ${reg.id} does not have a token and no token is provided in the configuration.`);
      return;
    }
    log.info(`Connecting to device with ID ${reg.id} using provided token.`);
    const token_str = token; // Use the provided token
    // }

    const roborock = await miio.device({ address: reg.address, token: token_str });
    
    // Store device reference for cleanup
    platform.miioDevices[reg.id] = roborock;

    /** 
     * https://github.com/l-ross/xiaomi/blob/e80cd5899c723b8dc374de75d421972f677fd9d4/vacuum/WIP.md
     * await device.call('app_get_init_status')
[
  {
    local_info: {
      name: 'custom_A.03.0005_CE',
      bom: 'A.03.0005',
      location: 'de',
      language: 'en',
      wifiplan: '',
      timezone: 'Europe/Berlin',
      logserver: 'awsde0.fds.api.xiaomi.com',
      featureset: 0
    },
    feature_info: [
      102, 103, 104, 105,
      111, 112, 113, 114,
      115, 116, 117, 118,
      119, 122, 123, 125
    ],
    status_info: {
      state: 18,
      battery: 64,
      clean_time: 180,
      clean_area: 3040000,
      error_code: 0,
      in_cleaning: 3,
      in_returning: 0,
      in_fresh_state: 0,
      lab_status: 1,
      water_box_status: 0,
      map_status: 3,
      lock_status: 0
    }
  }
]
     
> await device.call('get_serial_number')
[ { serial_number: 'R0018S91400291' } ]
     */

    devices[reg.id] = roborock;

    const current = roborock.properties;
    const opState = stateToOperationalStateMap[current.state];
    log.info(`Discovered Roborock vacuum: ${roborock.model} with ID ${reg.id} ${JSON.stringify(current)}`);

    /**
     * @param {string} name - The name of the robotic vacuum cleaner.
     * @param {string} serial - The serial number of the robotic vacuum cleaner.
     * @param {number} [currentRunMode] - The current run mode of the robotic vacuum cleaner. Defaults to 1 (Idle).
     * @param {RvcRunMode.ModeOption[]} [supportedRunModes] - The supported run modes for the robotic vacuum cleaner. Defaults to a predefined set of modes.
     * @param {number} [currentCleanMode] - The current clean mode of the robotic vacuum cleaner. Defaults to 1 (Vacuum).
     * @param {RvcCleanMode.ModeOption[]} [supportedCleanModes] - The supported clean modes for the robotic vacuum cleaner. Defaults to a predefined set of modes.
     * @param {number | null} [currentPhase] - The current phase of the robotic vacuum cleaner. Defaults to null.
     * @param {string[] | null} [phaseList] - The list of phases for the robotic vacuum cleaner. Defaults to null.
     * @param {RvcOperationalState.OperationalState} [operationalState] - The current operational state of the robotic vacuum cleaner. Defaults to Docked.
     * @param {RvcOperationalState.OperationalStateStruct[]} [operationalStateList] - The list of operational states for the robotic vacuum cleaner. Defaults to a predefined set of states.
     * @param {ServiceArea.Area[]} [supportedAreas] - The supported areas for the robotic vacuum cleaner. Defaults to a predefined set of areas.
     * @param {number[]} [selectedAreas] - The selected areas for the robotic vacuum cleaner. Defaults to an empty array (all areas allowed).
     * @param {number} [currentArea] - The current area of the robotic vacuum cleaner. Defaults to 1 (Living).
     */

    const vacuum = new RoboticVacuumCleaner(
      roborock.model || 'Roborock S5', // name
      String(reg.id), // serial
      current.in_cleaning, // currentRunMode - Idle
      runModes, // supportedRunModes
      current.fanSpeed, // currentCleanMode
      cleanModes, // supportedCleanModes
      3, // currentPhase
      null, // phaseList
      opState, // operationalState
      undefined, // operationalStateList
      serviceAreas, // supportedAreas
      [], // selectedAreas
      16, // currentArea
    )
      .addCommandHandler('identify', async () => {
        log.info(`Vacuum identify command received for device ID: ${reg.id}`);
        await roborock.find();
      })
      .addCommandHandler('changeToMode', async (data) => {
        const device: miio.MiioDevice = roborock;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mode = (data.request as any).newMode as number | undefined;
        if (typeof mode === 'number') {
          if (mode >= 100) {
            await device.changeFanSpeed(mode);
          }
        }
      })
      .addCommandHandler('resume', async () => {
        log.info('Vacuum resume command received');
        // resume_segment_clean if in segment cleaning mode

        await roborock.call('app_start', [], {
          refresh: ['state'],
          refreshDelay: 1000,
        });
      })
      .addCommandHandler('pause', async () => {
        log.info('Vacuum pause command received');
        await roborock.call('app_pause', [], {
          refresh: ['state'],
          refreshDelay: 1000,
        });
      })
      .addCommandHandler('goHome', async () => {
        log.info('Vacuum goHome command received');
        try {
          await roborock.call('app_charge', [], {
            refresh: ['state'],
            refreshDelay: 1000,
          });
        } catch (err) {
          log.error(`Vacuum goHome failed: ${String(err)}`);
          throw err;
        }
      });

    vacuum.addCommandHandler('selectAreas', async (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const areas: number[] | undefined = (data.request as any).newAreas;
      if (Array.isArray(areas) && areas.length > 0) {
        try {
          log.info(`Vacuum room cleaning request: ${areas.join(', ')}`);
          await roborock.call('app_segment_clean', areas);
          await vacuum.updateAttribute(ServiceArea.Cluster.id, 'selectedAreas', areas, log);
        } catch (err) {
          log.error(`Vacuum selectAreas failed: ${String(err)}`);
          throw err;
        }
      }
    });

    await platform.registerDevice(vacuum);

     const fetchStatus = async () => {
      try {
        const current = roborock.properties;
        log.info(`Status update for ${reg.id}: ${JSON.stringify(current)}`);

        // Get the operational state using the mapping, defaulting to Docked if state is unknown
        const opState = stateToOperationalStateMap[current.state];

        await vacuum.updateAttribute(RvcOperationalState.Cluster.id, 'operationalState', opState, log);

        if (current.error?.code) {
          const errorCode: ErrorCode = current.error.code as ErrorCode;
          const errorState: RvcOperationalState.ErrorState = operationalErrorMap[errorCode] || RvcOperationalState.ErrorState.UnableToCompleteOperation;

          const errorStateStruct: RvcOperationalState.ErrorStateStruct = {
            errorStateId: errorState,
            errorStateLabel: errorCode.toString(),
            errorStateDetails: current.error.message || 'Unknown error',
          };

          await vacuum.triggerEvent(
            RvcOperationalState.Cluster.id,
            'operationalError',
            {
              errorState: errorStateStruct,
            },
            platform.log,
          );

          vacuum.updateAttribute(RvcOperationalState.Cluster.id, 'operationalError', errorState, platform.log);
        } else {
          // vacuum.updateAttribute(RvcOperationalState.Cluster.id, 'operationalError', RvcOperationalState.ErrorState.NoError, platform.log);
        }

        if (current.state === 'spot-cleaning') {
          await vacuum.updateAttribute(RvcRunMode.Cluster.id, 'currentMode', 4, log);
        } else {
          await vacuum.updateAttribute(RvcRunMode.Cluster.id, 'currentMode', current.in_cleaning, log);
        }

        await vacuum.updateAttribute(RvcCleanMode.Cluster.id, 'currentMode', current.fanSpeed, log);
        await vacuum.updateAttribute(PowerSource.Cluster.id, 'batPercentRemaining', Math.min(Math.max(current.batteryLevel * 2, 0), 200), log);
        await vacuum.updateAttribute(
          PowerSource.Cluster.id,
          'batChargeState',
          current.state === 'charging'
            ? PowerSource.BatChargeState.IsCharging
            : current.batteryLevel === 100
              ? PowerSource.BatChargeState.IsAtFullCharge
              : PowerSource.BatChargeState.IsNotCharging,
          log,
        );

        if (current.state === 'charging-error') {
          log.warn(`Vacuum ${reg.id} is in charging error state`);
          await vacuum.updateAttribute(PowerSource.Cluster.id, 'batChargeFault', PowerSource.BatChargeFault.Unspecified, log);
        }
      } catch (error) {
        log.error(`Failed to fetch status for ${reg.id}: ${String(error)}`);
      }
     };

    platform.statusFetchers[reg.id] = fetchStatus;
    platform.statusIntervals[reg.id] = setInterval(fetchStatus, platform.refreshInterval);
  });
}
