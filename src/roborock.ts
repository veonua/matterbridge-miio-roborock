import * as miio from 'miio';
import { RoboticVacuumCleaner } from 'matterbridge/devices';
import { RvcRunMode, RvcCleanMode, ServiceArea, RvcOperationalState, PowerSource } from 'matterbridge/matter/clusters';

import { runModes, cleanModes, generateServiceAreas, stateToOperationalStateMap, operationalErrorMap, ErrorCode } from './constants.js';
import { TemplatePlatform } from './platform.js';

/**
 * Discover Roborock devices and register them with Matterbridge.
 *
 * @param {TemplatePlatform} platform - The platform instance.
 */
export async function discoverDevices(platform: TemplatePlatform): Promise<void> {
  const { log, token } = platform;
  log.info('Discovering devices...');

  // Generate service areas from configuration
  const areaConfig = (platform.config.areas as Record<string, string>) || {};
  const serviceAreas = generateServiceAreas(areaConfig);

  log.info(`Generated ${JSON.stringify(serviceAreas)} service areas from configuration`);

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

    devices[reg.id] = roborock;

    // Retrieve serial number from device
    let serial = String(reg.id);
    try {
      const serialResult = (await roborock.call('get_serial_number')) as miio.SerialNumberResult[];
      if (Array.isArray(serialResult) && serialResult.length > 0 && serialResult[0].serial_number) {
        serial = serialResult[0].serial_number;
        log.info(`Retrieved serial number for ${reg.id}: ${serial}`);
      }
    } catch (error) {
      log.warn(`Failed to get serial number for ${reg.id}, falling back to ID: ${String(error)}`);
    }

    // Get initial device status using app_get_init_status
    let initStatus: miio.InitStatusResponse | null = null;
    try {
      const initResult = (await roborock.call('app_get_init_status')) as miio.InitStatusResponse[];
      if (initResult && Array.isArray(initResult) && initResult.length > 0) {
        initStatus = initResult[0];
        log.info(`Retrieved init status for ${reg.id}: ${JSON.stringify(initStatus)}`);
      }
    } catch (error) {
      log.warn(`Failed to get init status for ${reg.id}, falling back to properties: ${String(error)}`);
    }

    // Use init status if available, otherwise fall back to current properties
    const current = roborock.properties;
    const deviceState = initStatus?.status_info?.state
      ? Object.values(stateToOperationalStateMap)[initStatus.status_info.state] || stateToOperationalStateMap[current.state]
      : stateToOperationalStateMap[current.state];

    log.info(`Discovered Roborock vacuum: ${roborock.model} with ID ${reg.id}, state: ${current.state} ${JSON.stringify(current)}`);

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
      serial, // serial
      'server', // expose as server endpoint for Matterbridge 3.1.2+
      initStatus?.status_info?.in_cleaning ?? current.in_cleaning, // currentRunMode - use init status if available
      runModes, // supportedRunModes
      current.fanSpeed, // currentCleanMode
      cleanModes, // supportedCleanModes
      3, // currentPhase
      null, // phaseList
      deviceState, // operationalState - use calculated state
      undefined, // operationalStateList
      serviceAreas, // supportedAreas
      [], // selectedAreas
      serviceAreas[0].areaId, // currentArea
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
