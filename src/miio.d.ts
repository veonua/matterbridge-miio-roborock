/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'miio' {
  interface DeviceOptions {
    address: string;
    token: string;
  }

  export interface Error {
    // {"id":"charger-offline","description":"Charger is offline"}
    id: string;
    description: string;
  }

  export interface VacuumState {
    batteryLevel: number;
    charging: boolean;
    cleaning: boolean;
    fanSpeed: number;
    error?: Error;
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

  interface Browser extends NodeJS.EventEmitter {
    on(event: 'available' | 'unavailable', listener: (reg: DeviceRegistration) => void): this;
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
     * Start cleaning
     */
    start(): Promise<void>;

    /**
     * Stop cleaning
     */
    stop(): Promise<void>;

    /**
     * Return to charging dock
     */
    charge(): Promise<void>;

    /**
     * Get battery level
     *
     * @returns Promise that resolves to battery percentage
     */
    batteryLevel(): Promise<number>;

    /**
     * Get/Set fan speed
     *
     * @param speed - Optional speed to set
     * @returns Promise that resolves to current fan speed
     */
    fanSpeed(speed?: number): Promise<number>;

    /**
     * Find/locate the device (plays sound or flashes light)
     *
     * @returns Promise that resolves to null
     */
    find(): Promise<null>;

    /**
     * Pause the current cleaning session
     */
    pause(): Promise<null>;

    /**
     * Activate cleaning (start cleaning)
     */
    activateCleaning(): Promise<null>;

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
    changeFanSpeed(speed: number): Promise<any>;

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
