import * as miio from 'miio';
import { RoboticVacuumCleaner } from 'matterbridge';
import { RvcRunMode, RvcCleanMode, ServiceArea, RvcOperationalState, PowerSource } from 'matterbridge/matter/clusters';

import { runModes, cleanModes, serviceAreas } from './constants.js';
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

  browser.on('available', async (reg) => {
    let token_str: string;
    if (reg.token) {
      token_str = typeof reg.token === 'string' ? reg.token : Buffer.from(reg.token.data).toString('hex');
    } else {
      if (!token) {
        log.error(`Device with ID ${reg.id} does not have a token and no token is provided in the configuration.`);
        return;
      }
      log.info(`Connecting to device with ID ${reg.id} using provided token.`);
      token_str = token; // Use the provided token
    }

    const roborock = await miio.device({ address: reg.address, token: token_str });

    devices[reg.id] = roborock;

    const status = await roborock.state();
    log.info(`Discovered Roborock vacuum: ${roborock.model} with ID ${reg.id} ${JSON.stringify(status)}`);

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
      1, // currentRunMode
      runModes, // supportedRunModes
      status.fanSpeed, // currentCleanMode
      cleanModes, // supportedCleanModes
      3, // currentPhase
      null, // phaseList
      status.charging // operationalState
        ? RvcOperationalState.OperationalState.Charging
        : status.cleaning
          ? RvcOperationalState.OperationalState.Running
          : RvcOperationalState.OperationalState.Paused,
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
      })
      .addCommandHandler('pause', async () => {
        await roborock.pause();
        log.info('Vacuum pause command received');
      })
      .addCommandHandler('goHome', async () => {
        log.info('Vacuum goHome command received');
        try {
          await roborock.activateCharging();
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

    platform.statusIntervals[reg.id] = setInterval(async () => {
      try {
        const current = await roborock.state();
        log.info(`Status update for ${reg.id}: ${JSON.stringify(current)}`);

        const opState = current.charging
          ? RvcOperationalState.OperationalState.Charging
          : current.cleaning
            ? RvcOperationalState.OperationalState.Running
            : RvcOperationalState.OperationalState.Docked;

        await vacuum.updateAttribute(RvcOperationalState.Cluster.id, 'operationalState', opState, log);
        await vacuum.updateAttribute(RvcRunMode.Cluster.id, 'currentMode', current.cleaning ? 2 : 1, log);
        await vacuum.updateAttribute(RvcCleanMode.Cluster.id, 'currentMode', current.fanSpeed, log);
        await vacuum.updateAttribute(PowerSource.Cluster.id, 'batPercentRemaining', Math.min(Math.max(current.batteryLevel * 2, 0), 200), log);
        await vacuum.updateAttribute(
          PowerSource.Cluster.id,
          'batChargeState',
          current.charging
            ? PowerSource.BatChargeState.IsCharging
            : current.batteryLevel === 100
              ? PowerSource.BatChargeState.IsAtFullCharge
              : PowerSource.BatChargeState.IsNotCharging,
          log,
        );
      } catch (error) {
        log.error(`Failed to fetch status for ${reg.id}: ${String(error)}`);
      }
    }, 60000);
  });
}
