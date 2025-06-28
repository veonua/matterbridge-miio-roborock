import { Matterbridge, PlatformConfig } from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';
import { TemplatePlatform } from './platform';

export default function initializePlugin(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig): TemplatePlatform {
  return new TemplatePlatform(matterbridge, log, config);
}
