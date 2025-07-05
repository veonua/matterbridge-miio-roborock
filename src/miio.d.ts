/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'miio' {
  interface DeviceOptions {
    address: string;
    token: string;
  }

  export interface ErrorProperties {
    code: number; // Error code
    message: string; // Error message
  }

  export interface InitStatusLocalInfo {
    name: string;
    bom: string;
    location: string;
    language: string;
    wifiplan: string;
    timezone: string;
    logserver: string;
    featureset: number;
  }

  export interface InitStatusStatusInfo {
    state: number;
    battery: number;
    clean_time: number;
    clean_area: number;
    error_code: number;
    in_cleaning: number;
    in_returning: number;
    in_fresh_state: number;
    lab_status: number;
    water_box_status: number;
    map_status: number;
    lock_status: number;
  }

  export interface InitStatusResponse {
    local_info: InitStatusLocalInfo;
    feature_info: number[];
    status_info: InitStatusStatusInfo;
  }

  export interface VacuumProperties {
    state:
      | 'initiating'
      | 'charger-offline'
      | 'waiting'
      | 'cleaning'
      | 'returning'
      | 'charging'
      | 'charging-error'
      | 'paused'
      | 'spot-cleaning'
      | 'error'
      | 'shutting-down'
      | 'updating'
      | 'docking'
      | 'unknown-16' // 'going-to-target'
      | 'zone-cleaning'
      | 'unknown-18' // 'segment-cleaning'
      | 'full';
    batteryLevel: number; // 0-100
    cleanTime: number; // in minutes
    cleanArea: number;
    fanSpeed: number; // Fan speed values
    in_cleaning: 0 | 1 | 2 | 3; // 0: not cleaning, 1: unk, 2: zone cleaning, 3: segment cleaning
    mainBrushWorkTime: number;
    sideBrushWorkTime: number;
    filterWorkTime: number;
    sensorDirtyTime: number;
    error?: ErrorProperties;
  }

  export interface ErrorState {
    // {"id":"charger-offline","description":"Charger is offline"}
    id: string;
    description: string;
  }

  export interface VacuumState {
    batteryLevel: number;
    charging: boolean;
    cleaning: boolean;
    fanSpeed: number;
    error?: ErrorState;
  }

  export interface CleaningHistory {
    count: number;
    days: Date[];
  }

  export interface DayHistory {
    day: Date;
    history: Array<{
      start: Date;
      end: Date;
      duration: number;
      area: number;
      complete: boolean;
    }>;
  }

  export interface DeviceRegistration {
    id: number;
    address: string;
    port: number;
    token: string | { type: 'Buffer'; data: number[] };
    autoToken: boolean;

    connect(): Promise<MiioDevice>;
  }

  export interface Browser extends NodeJS.EventEmitter {
    on(event: 'available' | 'unavailable', listener: (reg: DeviceRegistration) => void): this;
  }

  export interface IStatus {
    battery: number; // 0-100
    clean_area: number;
    clean_time: number;
    dnd_enabled: 0 | 1;
    error_code: ErrorCode;
    fan_power: FanPower;
    in_cleaning: 0 | 1 | 2 | 3;
    in_returning: 0 | 1;
    in_fresh_state: 0 | 1;
    lab_status: 0 | 1;
    lock_status: 0 | 1;
    water_box_status: 0 | 1;
    map_present: 0 | 1;
    map_status: 0 | 1 | 2 | 3; // version of map
    msg_seq: number;
    msg_ver: number; // 3
    state: State;
  }

  export interface MiioDevice {
    id: number;
    model: string;
    address: string;
    port: number;
    token: string;
    /**
     * Destroy the device connection
     */
    destroy(): void;

    /**
     * Get current cleaning status
     *
     * @returns Promise that resolves to boolean indicating if cleaning is active
     */
    cleaning(): Promise<boolean>;

    /**
     * Get current device state
     *
     * @returns Promise that resolves to device state object
     */
    state(): Promise<VacuumState>;

    /**
     * Call a device-specific method
     *
     * @param method - The method name to call
     * @param args - Arguments to pass to the method
     * @param options - Additional options for the call
     * @param options.refresh - Properties to refresh after the call
     * @param options.refreshDelay - Delay in milliseconds before refreshing
     * @returns Promise that resolves to the method result
     */
    call(method: string, args?: unknown[], options?: { refresh?: string[]; refreshDelay?: number }): Promise<unknown>;

    /**
     * Properties available on the device
     */
    properties: VacuumProperties;

    /**
     * Activate cleaning (start cleaning)
     */
    activateCleaning(): Promise<null>;

    /**
     * Pause cleaning (stop cleaning temporarily)
     */
    pause(): Promise<null>;

    /**
     * Deactivate cleaning (stop cleaning)
     */
    deactivateCleaning(): Promise<null>;

    /**
     * Activate charging (return to dock and charge)
     */
    activateCharging(): Promise<null>;

    /**
     * Start spot cleaning
     */
    activateSpotClean(): Promise<null>;

    /**
     * Change fan speed
     *
     * @param speed - Fan speed value (usually 38, 60, or 77)
     */
    changeFanSpeed(speed: number): Promise<null>;

    /**
     * Activate the find function, will make the device give off a sound.
     */
    find(): Promise<null>;

    /**
     * Get cleaning history
     *
     * @returns Promise that resolves to cleaning history data
     */
    getHistory(): Promise<CleaningHistory>;

    /**
     * Get history for a specific day
     *
     * @param day - Date or timestamp for the day
     * @returns Promise that resolves to day history data
     */
    getHistoryForDay(day: Date | number): Promise<DayHistory>;

    /**
     * Load multiple properties from the device
     *
     * @param props - Array of property names to load
     * @returns Promise that resolves to property values
     */
    loadProperties(props: string[]): Promise<Record<string, any>>;
  }

  export interface MiioDevices {
    [key: string]: any;
  }

  /**
   * Connect to a miio device
   *
   * @param {DeviceOptions} options - Connection options including address and token
   * @returns {Promise<MiioDevice>} Promise that resolves to a Device instance
   */
  export function device(options: DeviceOptions): Promise<MiioDevice>;

  /**
   * Get multiple devices
   *
   * @param {{ cacheTime: number }} options - Options for getting devices, e.g., cache time
   * @param {number} options.cacheTime - Cache time in seconds
   * @returns {Promise<MiioDevices>} Promise that resolves to an object containing multiple devices
   */
  export function devices(options: { cacheTime: number }): Promise<MiioDevices>;

  /**
   * Browse for miio devices on the local network
   *
   * @param {{ cacheTime?: number }} options - Browse options including cacheTime
   * @param {number} [options.cacheTime] - Cache time in seconds
   * @returns {Browser} Browser instance for listening to device availability events
   */
  export function browse(options: { cacheTime?: number }): Browser;

  export default {
    device,
    devices,
    browse,
  };
}
