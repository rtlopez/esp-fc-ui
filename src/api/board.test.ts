import { describe, it, expect } from 'vitest'
import { parseArmingDisableFlags, sensorPresent, SensorType } from './board'

describe('board', () => {

  describe('parseArmingDisableFlags()', () => {
    it('no flags set', () => {
      expect(parseArmingDisableFlags(0)).toEqual([])
    })

    it('single bit set', () => {
      expect(parseArmingDisableFlags(1 << 0)).toEqual(['NO_GYRO'])
      expect(parseArmingDisableFlags(1 << 7)).toEqual(['THROTTLE'])
      expect(parseArmingDisableFlags(1 << 25)).toEqual(['ARM_SWITCH'])
    })

    it('multipple bits set', () => {
      // bits: 0 (NO_GYRO), 1 (FAILSAFE), 3 (BAD_RX_RECOVERY)
      const flags = (1 << 0) | (1 << 1) | (1 << 3)
      const result = parseArmingDisableFlags(flags)
      expect(result).toEqual(['NO_GYRO', 'FAILSAFE', 'BAD_RX_RECOVERY'])
    })

    it('ignore bits out of range', () => {
      // 30. bit nie istnieje w mapie
      const flags = (1 << 0) | (1 << 30)
      const result = parseArmingDisableFlags(flags)
      expect(result).toEqual(['NO_GYRO'])
    })

    it('check ARM_SWITCH flag', () => {
      const flags = 1 << 25
      const result = parseArmingDisableFlags(flags)
      expect(result).toContain('ARM_SWITCH')
    })
  })

  describe('sensorPresent()', () => {
    it('sensors is undefined', () => {
      expect(sensorPresent(undefined, SensorType.GYRO)).toBe(false)
    })

    it('the specific sensor bit is set', () => {
      const sensors = SensorType.GYRO | SensorType.ACC
      expect(sensorPresent(sensors, SensorType.GYRO)).toBe(true)
      expect(sensorPresent(sensors, SensorType.ACC)).toBe(true)
    })

    it('the specific sensor bit is not set', () => {
      const sensors = SensorType.GYRO | SensorType.ACC
      expect(sensorPresent(sensors, SensorType.BARO)).toBe(false)
      expect(sensorPresent(sensors, SensorType.MAG)).toBe(false)
    })

    it('matching bits in complex combinations', () => {
      const sensors = SensorType.GYRO | SensorType.BARO | SensorType.GPS
      expect(sensorPresent(sensors, SensorType.GYRO)).toBe(true)
      expect(sensorPresent(sensors, SensorType.ACC)).toBe(false)
      expect(sensorPresent(sensors, SensorType.BARO)).toBe(true)
      expect(sensorPresent(sensors, SensorType.GPS)).toBe(true)
    })

    it('invalid bit values', () => {
      const sensors = SensorType.GYRO
      // e.g. 1 << 10 is not defined in the enum
      expect(sensorPresent(sensors, 1 << 10 as SensorType)).toBe(false)
    })
  })

})