import { Matterbridge, PlatformConfig } from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';

import { TemplatePlatform } from './platform.js';

/**
 * Initialize the Roborock plugin.
 
 * @param {Matterbridge} matterbridge - The Matterbridge instance.
 * @param {AnsiLogger} log - Logger instance.
 * @param {PlatformConfig} config - Platform configuration.
 * @returns {TemplatePlatform} The initialized platform.
 */
export default function initializePlugin(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig): TemplatePlatform {
  return new TemplatePlatform(matterbridge, log, config);
}
