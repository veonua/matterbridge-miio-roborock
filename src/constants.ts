import { RvcRunMode, RvcCleanMode, ServiceArea } from 'matterbridge/matter/clusters';

export const runModes: RvcRunMode.ModeOption[] = [
  { label: 'Charge', mode: 1, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
  { label: 'Start', mode: 2, modeTags: [{ value: RvcRunMode.ModeTag.Cleaning }] },
  { label: 'Pause', mode: 3, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
  { label: 'Stop', mode: 4, modeTags: [{ value: RvcRunMode.ModeTag.Idle }] },
];

export const cleanModes: RvcCleanMode.ModeOption[] = [
  {
    label: 'Gentle',
    mode: 101,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Mop }],
  },
  {
    label: 'Silent',
    mode: 102,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Quiet }],
  },
  {
    label: 'Balanced',
    mode: 103,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.Day }],
  },
  {
    label: 'Turbo',
    mode: 104,
    modeTags: [{ value: RvcCleanMode.ModeTag.Vacuum }, { value: RvcCleanMode.ModeTag.DeepClean }],
  },
  {
    label: 'Max',
    mode: 105,
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
