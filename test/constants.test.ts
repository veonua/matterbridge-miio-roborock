import { RvcOperationalState, ServiceArea } from 'matterbridge/matter/clusters';
import { generateServiceAreas, stateToOperationalStateMap, operationalErrorMap, ErrorCode } from '../src/constants.js';

describe('constants helpers', () => {
  test('generateServiceAreas filters and maps areas correctly', () => {
    const config = {
      'Area-16': 'Kitchen',
      'Area-17': '',
      'Area-18': 'Living Room',
      'Area-19': undefined,
      'Area-20': '   ',
    } as unknown as Record<string, string>;

    const areas = generateServiceAreas(config);
    expect(areas).toHaveLength(2);
    expect(areas[0]).toMatchObject({
      areaId: 16,
      mapId: null,
      areaInfo: {
        locationInfo: {
          locationName: 'Kitchen',
          floorNumber: 1,
          areaType: null,
        },
        landmarkInfo: null,
      },
    } as ServiceArea.Area);
    expect(areas[1].areaId).toBe(18);
    expect(areas[1].areaInfo.locationInfo.locationName).toBe('Living Room');
  });

  test('generateServiceAreas returns empty array for undefined config', () => {
    expect(generateServiceAreas(undefined as unknown as Record<string, string>)).toEqual([]);
  });

  test('state to operational state mapping', () => {
    expect(stateToOperationalStateMap['cleaning']).toBe(RvcOperationalState.OperationalState.Running);
    expect(stateToOperationalStateMap['paused']).toBe(RvcOperationalState.OperationalState.Paused);
  });

  test('operational error mapping', () => {
    expect(operationalErrorMap[ErrorCode.LowBattery]).toBe(RvcOperationalState.ErrorState.UnableToStartOrResume);
  });
});
