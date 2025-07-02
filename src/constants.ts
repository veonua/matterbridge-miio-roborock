import { RvcOperationalState, RvcRunMode, RvcCleanMode, ServiceArea } from 'matterbridge/matter/clusters';

export enum State {
  Unknown = -1,
  Initiating = 1,
  Sleeping = 2,
  Idle = 3,
  RemoteControl = 4,
  Cleaning = 5,
  ReturningDock = 6,
  ManualMode = 7,
  Charging = 8,
  ChargingError = 9,
  Paused = 10,
  SpotCleaning = 11,
  InError = 12,
  ShuttingDown = 13,
  Updating = 14,
  Docking = 15,
  GoToTarget = 16,
  ZoneCleaning = 17,
  SegmentCleaning = 18,
  FullyCharged = 100,
}

export enum FanPower {
  Silent = 101,
  Balanced = 102,
  Turbo = 103,
  Max = 104,
  Gentle = 105,
}

export enum ErrorCode {
  Unknown = -1,
  NoError = 0,
  LaserSensorFault = 1,
  CollisionSensorFault = 2,
  WheelFloating = 3,
  CliffSensorFault = 4,
  MainBrushBlocked = 5,
  SideBrushBlocked = 6,
  WheelBlocked = 7,
  DeviceStuck = 8,
  DustBinMissing = 9,
  FilterBlocked = 10,
  MagneticFieldDetected = 11,
  LowBattery = 12,
  ChargingProblem = 13,
  BatteryFailure = 14,
  WallSensorFault = 15,
  UnevenSurface = 16,
  SideBrushFailure = 17,
  SuctionFanFailure = 18,
  UnpoweredChargingStation = 19,
  LaserPressureSensorProblem = 21,
  ChargeSensorProblem = 22,
  DockProblem = 23,
  InvisibleWallDetected = 24,
  BinFull = 254,
  InternalError = 255, // General internal error
}

export const stateToOperationalStateMap: Record<string, RvcOperationalState.OperationalState> = {
  'charging': RvcOperationalState.OperationalState.Charging,
  'cleaning': RvcOperationalState.OperationalState.Running,
  'spot-cleaning': RvcOperationalState.OperationalState.Running,
  'zone-cleaning': RvcOperationalState.OperationalState.Running,
  'unknown-18': RvcOperationalState.OperationalState.Running, // segment-cleaning
  'unknown-16': RvcOperationalState.OperationalState.SeekingCharger, // going-to-target

  'returning': RvcOperationalState.OperationalState.SeekingCharger,
  'paused': RvcOperationalState.OperationalState.Paused,
  'waiting': RvcOperationalState.OperationalState.Stopped,
  'charger-offline': RvcOperationalState.OperationalState.Stopped,
  'docked': RvcOperationalState.OperationalState.Docked,
  'full': RvcOperationalState.OperationalState.Docked,
  'charging-error': RvcOperationalState.OperationalState.Error,
  'error': RvcOperationalState.OperationalState.Error,
  'idle': RvcOperationalState.OperationalState.Stopped,
};

export const operationalErrorMap: Record<ErrorCode, RvcOperationalState.ErrorState> = {
  [ErrorCode.Unknown]: RvcOperationalState.ErrorState.UnableToCompleteOperation,
  [ErrorCode.NoError]: RvcOperationalState.ErrorState.NoError,
  [ErrorCode.LaserSensorFault]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.CollisionSensorFault]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.WheelFloating]: RvcOperationalState.ErrorState.Stuck,
  [ErrorCode.CliffSensorFault]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.MainBrushBlocked]: RvcOperationalState.ErrorState.Stuck,
  [ErrorCode.SideBrushBlocked]: RvcOperationalState.ErrorState.Stuck,
  [ErrorCode.WheelBlocked]: RvcOperationalState.ErrorState.Stuck,
  [ErrorCode.DeviceStuck]: RvcOperationalState.ErrorState.Stuck,
  [ErrorCode.DustBinMissing]: RvcOperationalState.ErrorState.DustBinMissing,
  [ErrorCode.FilterBlocked]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.MagneticFieldDetected]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.LowBattery]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.ChargingProblem]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.BatteryFailure]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.WallSensorFault]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.UnevenSurface]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.SideBrushFailure]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.SuctionFanFailure]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.UnpoweredChargingStation]: RvcOperationalState.ErrorState.FailedToFindChargingDock,
  [ErrorCode.LaserPressureSensorProblem]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.ChargeSensorProblem]: RvcOperationalState.ErrorState.FailedToFindChargingDock,
  [ErrorCode.DockProblem]: RvcOperationalState.ErrorState.FailedToFindChargingDock,
  [ErrorCode.InvisibleWallDetected]: RvcOperationalState.ErrorState.UnableToStartOrResume,
  [ErrorCode.BinFull]: RvcOperationalState.ErrorState.DustBinFull,
  [ErrorCode.InternalError]: RvcOperationalState.ErrorState.UnableToCompleteOperation,
};

export const runModes: RvcRunMode.ModeOption[] = [
  { label: 'Idle', mode: 0, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] }, // or 'Spot Cleaning =('
  { label: 'All', mode: 1, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
  { label: 'Zone', mode: 2, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
  { label: 'Room', mode: 3, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
  { label: 'Spot Cleaning', mode: 4, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
];

export const cleanModes: RvcCleanMode.ModeOption[] = [
  {
    label: 'Gentle',
    mode: FanPower.Gentle,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Mop }],
  },
  {
    label: 'Silent',
    mode: FanPower.Silent,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Quiet }],
  },
  {
    label: 'Balanced',
    mode: FanPower.Balanced,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Day }],
  },
  {
    label: 'Turbo',
    mode: FanPower.Turbo,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.DeepClean }],
  },
  {
    label: 'Max',
    mode: FanPower.Max,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Max }],
  },
];

export const serviceAreas: ServiceArea.Area[] = [
  {
    areaId: 19,
    mapId: null,
    areaInfo: {
      locationInfo: { locationName: 'Kitchen', floorNumber: 1, areaType: null },
      landmarkInfo: null,
    },
  },
  {
    areaId: 21,
    mapId: null,
    areaInfo: {
      locationInfo: { locationName: 'Living Room', floorNumber: 1, areaType: null },
      landmarkInfo: null,
    },
  },
  {
    areaId: 18,
    mapId: null,
    areaInfo: {
      locationInfo: { locationName: 'Master Bedroom', floorNumber: 1, areaType: null },
      landmarkInfo: null,
    },
  },
  {
    areaId: 16,
    mapId: null,
    areaInfo: {
      locationInfo: { locationName: 'Second Bedroom', floorNumber: 1, areaType: null },
      landmarkInfo: null,
    },
  },
  {
    areaId: 17,
    mapId: null,
    areaInfo: {
      locationInfo: { locationName: 'Dressing room', floorNumber: 1, areaType: null },
      landmarkInfo: null,
    },
  },
  {
    areaId: 20,
    mapId: null,
    areaInfo: {
      locationInfo: { locationName: 'Entryway', floorNumber: 1, areaType: null },
      landmarkInfo: null,
    },
  },
];
