
export enum SensorType {
  GYRO = 1 << 0,
  ACC = 1 << 1,
  BARO = 1 << 2,
  MAG = 1 << 3,
  GPS = 1 << 4,
}

export const sensorPresent = (sensors: number | undefined, sensor: SensorType): boolean => {
  if (sensors === undefined) return false
  return (sensors & sensor) !== 0
}

const armingDisableFlags: Record<number, string> = {
  0: 'NO_GYRO',
  1: 'FAILSAFE',
  2: 'RX_FAILSAFE',
  3: 'BAD_RX_RECOVERY',
  4: 'BOXFAILSAFE',
  5: 'RUNAWAY_TAKEOFF',
  6: 'CRASH_DETECTED',
  7: 'THROTTLE',
  8: 'ANGLE',
  9: 'BOOT_GRACE_TIME',
  10: 'NOPREARM',
  11: 'LOAD',
  12: 'CALIBRATING',
  13: 'CLI',
  14: 'CMS_MENU',
  15: 'BST',
  16: 'MSP',
  17: 'PARALYZE',
  18: 'GPS',
  19: 'RESC',
  20: 'RPMFILTER',
  21: 'REBOOT_REQUIRED',
  22: 'DSHOT_BITBANG',
  23: 'ACC_CALIBRATION',
  24: 'MOTOR_PROTOCOL',
  25: 'ARM_SWITCH', // Needs to be the last element, since it's always activated if one of the others is active when arming
};

export const parseArmingDisableFlags = (flags: number): string[] => {
  const result = []
  for (let i = 0; i < 25; i++) {
    if (flags & (1 << i)) result.push(armingDisableFlags[i])
  }
  return result
}
