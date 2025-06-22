import { jest } from '@jest/globals';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';
import { Matterbridge, MatterbridgeEndpoint, PlatformConfig } from 'matterbridge';


jest.unstable_mockModule('../src/roborock.ts', () => ({
  RoborockClient: jest.fn().mockImplementation(() => ({
    handshake: jest.fn(),
    startCleaning: jest.fn(),
    stopCleaning: jest.fn(),
    pauseCleaning: jest.fn(),
    resumeCleaning: jest.fn(),
    dock: jest.fn(),
    locate: jest.fn(),
    setMode: jest.fn(),
  })),
}));

const mockLog = {
  fatal: jest.fn((message: string, ...parameters: any[]) => {}),
  error: jest.fn((message: string, ...parameters: any[]) => {}),
  warn: jest.fn((message: string, ...parameters: any[]) => {}),
  notice: jest.fn((message: string, ...parameters: any[]) => {}),
  info: jest.fn((message: string, ...parameters: any[]) => {}),
  debug: jest.fn((message: string, ...parameters: any[]) => {}),
} as unknown as AnsiLogger;

const mockMatterbridge = {
  matterbridgeDirectory: './jest/matterbridge',
  matterbridgePluginDirectory: './jest/plugins',
  systemInformation: { ipv4Address: undefined, ipv6Address: undefined, osRelease: 'xx.xx.xx.xx.xx.xx', nodeVersion: '22.1.10' },
  matterbridgeVersion: '3.0.0',
  log: mockLog,
  getDevices: jest.fn(() => {
    return [];
  }),
  getPlugins: jest.fn(() => {
    return [];
  }),
  addBridgedEndpoint: jest.fn(async (pluginName: string, device: MatterbridgeEndpoint) => {}),
  removeBridgedEndpoint: jest.fn(async (pluginName: string, device: MatterbridgeEndpoint) => {}),
  removeAllBridgedEndpoints: jest.fn(async (pluginName: string) => {}),
} as unknown as Matterbridge;

const mockConfig = {
  name: 'matterbridge-plugin-template',
  type: 'DynamicPlatform',
  version: '1.0.0',
  debug: false,
  unregisterOnShutdown: false,
} as PlatformConfig;

const loggerLogSpy = jest
  .spyOn(AnsiLogger.prototype, 'log')
  .mockImplementation((level: string, message: string, ...parameters: any[]) => {});

describe('Matterbridge Plugin Template', () => {
  let TemplatePlatform: any;
  let instance: any;

  beforeAll(async () => {
    const mod = await import('../src/module.ts');
    TemplatePlatform = mod.TemplatePlatform;
    await import('../src/roborock.ts');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should throw an error if matterbridge is not the required version', async () => {
    mockMatterbridge.matterbridgeVersion = '2.0.0'; // Simulate an older version
    expect(() => new TemplatePlatform(mockMatterbridge, mockLog, mockConfig)).toThrow(
      'This plugin requires Matterbridge version >= "3.0.7". Please update Matterbridge from 2.0.0 to the latest version in the frontend.',
    );
    mockMatterbridge.matterbridgeVersion = '3.0.7';
  });

  it('should create an instance of the platform', async () => {
    const mod = await import('../src/module.ts');
    instance = mod.default(mockMatterbridge, mockLog, mockConfig);
    expect(instance).toBeInstanceOf(mod.TemplatePlatform);
    expect(instance.matterbridge).toBe(mockMatterbridge);
    expect(instance.log).toBe(mockLog);
    expect(instance.config).toBe(mockConfig);
    expect(instance.matterbridge.matterbridgeVersion).toBe('3.0.7');
    expect(mockLog.info).toHaveBeenCalledWith('Initializing Platform...');
  });

  it('should start', async () => {
    await instance.onStart('Jest');
    expect(mockLog.info).toHaveBeenCalledWith('onStart called with reason: Jest');
    await instance.onStart();
    expect(mockLog.info).toHaveBeenCalledWith('onStart called with reason: none');
  });

  it('should call the command handlers', async () => {
    for (const device of instance.getDevices()) {
      await device.executeCommandHandler('pause');
      await device.executeCommandHandler('resume');
      await device.executeCommandHandler('goHome');
      await device.executeCommandHandler('locate');
    }
    expect(mockLog.info).toHaveBeenCalledWith('Vacuum pause command received');
    expect(mockLog.info).toHaveBeenCalledWith('Vacuum resume command received');
    expect(mockLog.info).toHaveBeenCalledWith('Vacuum goHome command received');
    expect(mockLog.info).toHaveBeenCalledWith('Vacuum locate command received');
  });

  it('should configure', async () => {
    await instance.onConfigure();
    expect(mockLog.info).toHaveBeenCalledWith('onConfigure called');
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Configuring device:'));
  });

  it('should change logger level', async () => {
    await instance.onChangeLoggerLevel(LogLevel.DEBUG);
    expect(mockLog.info).toHaveBeenCalledWith('onChangeLoggerLevel called with: debug');
  });

  it('should shutdown', async () => {
    await instance.onShutdown('Jest');
    expect(mockLog.info).toHaveBeenCalledWith('onShutdown called with reason: Jest');

    // Mock the unregisterOnShutdown behavior
    mockConfig.unregisterOnShutdown = true;
    await instance.onShutdown();
    expect(mockLog.info).toHaveBeenCalledWith('onShutdown called with reason: none');
    expect(mockMatterbridge.removeAllBridgedEndpoints).toHaveBeenCalled();
    mockConfig.unregisterOnShutdown = false;
  });
});
