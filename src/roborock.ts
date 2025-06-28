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
    let roborock: miio.MiioDevice;
    if (!reg.token) {
      if (!token) {
        log.error(`Device with ID ${reg.id} does not have a token and no token is provided in the configuration.`);
        return;
      }
      log.info(`Connecting to device with ID ${reg.id} using provided token.`);
      roborock = await miio.device({ address: reg.address, token });
    } else {
      roborock = await reg.connect();
    }

    devices[reg.id] = roborock;

    const status = await roborock.state();
    log.info(`Discovered Roborock vacuum: ${roborock.model} with ID ${reg.id} ${JSON.stringify(status)}`);

    const vacuum = new RoboticVacuumCleaner(
      roborock.model || 'Roborock S5',
      String(reg.id),
      1,
      runModes,
      status.fanSpeed,
      cleanModes,
      3,
      null,
      status.charging
        ? RvcOperationalState.OperationalState.Charging
        : status.cleaning
          ? RvcOperationalState.OperationalState.Running
          : RvcOperationalState.OperationalState.Paused,
      undefined,
      serviceAreas,
      [],
      16,
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
