import {
  parseStatusResponse, parseVersionResponse, parseAttitudeResponse,
  parseSensorsResponse, parseStatisticsResponse, parseInputResponse,
  parseOutputResponse, parseVoltageResponse, parseCurrentResponse,
  parseDebugResponse, parseInputConfigResponse, parseInputChannelConfigResponse,
  parseOutputConfigResponse, parseOutputChannelConfigResponse,
  parsePinConfigResponse, parseSerialConfigResponse, parseSerialNamesResponse,
  parseFeaturesNamesResponse, parseModeNamesResponse, parseFeaturesConfigResponse,
  parseSensorConfigResponse, parsePidTuningResponse, parseMixerConfigResponse,
  parseMixerNamesResponse, parseAccelConfigResponse, parseGyroConfigResponse,
  parseBaroConfigResponse, parseMagConfigResponse, parseModesConfigResponse,
  parseDebugNamesResponse, parseBlackboxNamesResponse, parseBlackboxConfigResponse,
  parseFlashEraseResponse, parseFlashReadResponse, parseFlashLogsResponse,
  parseOutputOverrideResponse, parseCalibrateResponse, parseMspVersionResponse
} from "../esp"

export const MspState = {
  IDLE: 'IDLE',
  START: 'START',
  M: 'M',
  ARROW: 'ARROW',
  SIZE: 'SIZE',
  CMD: 'CMD',
  RECEIVED: 'RECEIVED',
}

export const MspDirection = {
  REQUEST: '<',
  REPLY: '>',
}

export type MspVariant = 'M' | 'E'

export type MspCommandEntry = {
  value: number
  label: string
  variant: MspVariant
  parse?: (msg: MspMessage) => object | Array<object>
  group: 'info' | 'names' | 'config' | 'flash' | 'system'
}

const E = { variant: 'E' } as const
const M = { variant: 'M' } as const

export const MspCommand: Record<string, MspCommandEntry> = {
  // ESP status commands
  ESP_CMD_VERSION: { value: 0x01, label: 'ESP_CMD_VERSION', ...E, parse: parseVersionResponse, group: 'info' },
  ESP_CMD_STATUS: { value: 0x02, label: 'ESP_CMD_STATUS', ...E, parse: parseStatusResponse, group: 'info' },
  ESP_CMD_STATISTICS: { value: 0x03, label: 'ESP_CMD_STATISTICS', ...E, parse: parseStatisticsResponse, group: 'info' },
  ESP_CMD_ATTITUDE: { value: 0x04, label: 'ESP_CMD_ATTITUDE', ...E, parse: parseAttitudeResponse, group: 'info' },
  ESP_CMD_SENSORS: { value: 0x05, label: 'ESP_CMD_SENSORS', ...E, parse: parseSensorsResponse, group: 'info' },
  ESP_CMD_INPUT: { value: 0x06, label: 'ESP_CMD_INPUT', ...E, parse: parseInputResponse, group: 'info' },
  ESP_CMD_OUTPUT: { value: 0x07, label: 'ESP_CMD_OUTPUT', ...E, parse: parseOutputResponse, group: 'info' },
  ESP_CMD_VOLTAGE: { value: 0x08, label: 'ESP_CMD_VOLTAGE', ...E, parse: parseVoltageResponse, group: 'info' },
  ESP_CMD_CURRENT: { value: 0x09, label: 'ESP_CMD_CURRENT', ...E, parse: parseCurrentResponse, group: 'info' },
  ESP_CMD_GPS: { value: 0x0a, label: 'ESP_CMD_GPS', ...E, group: 'info' },
  ESP_CMD_GPS_INFO: { value: 0x0b, label: 'ESP_CMD_GPS_INFO', ...E, group: 'info' },
  ESP_CMD_RPM_TLM: { value: 0x0c, label: 'ESP_CMD_RPM_TLM', ...E, group: 'info' },
  ESP_CMD_DEBUG: { value: 0x0f, label: 'ESP_CMD_DEBUG', ...E, parse: parseDebugResponse, group: 'info' },

  // ESP feature names commands
  ESP_CMD_MODE_NAMES: { value: 0x10, label: 'ESP_CMD_MODE_NAMES', ...E, parse: parseModeNamesResponse, group: 'names' },
  ESP_CMD_FEATURE_NAMES: { value: 0x11, label: 'ESP_CMD_FEATURE_NAMES', ...E, parse: parseFeaturesNamesResponse, group: 'names' },
  ESP_CMD_DEBUG_NAMES: { value: 0x12, label: 'ESP_CMD_DEBUG_NAMES', ...E, parse: parseDebugNamesResponse, group: 'names' },
  ESP_CMD_SERIAL_NAMES: { value: 0x13, label: 'ESP_CMD_SERIAL_NAMES', ...E, parse: parseSerialNamesResponse, group: 'names' },
  ESP_CMD_PID_NAMES: { value: 0x14, label: 'ESP_CMD_PID_NAMES', ...E, group: 'names' },
  ESP_CMD_MIXER_NAMES: { value: 0x15, label: 'ESP_CMD_MIXER_NAMES', ...E, parse: parseMixerNamesResponse, group: 'names' },
  ESP_CMD_BLACKBOX_NAMES: { value: 0x16, label: 'ESP_CMD_BLACKBOX_NAMES', ...E, parse: parseBlackboxNamesResponse, group: 'names' },

  // ESP configuration commands
  ESP_CMD_INPUT_CONFIG: { value: 0x20, label: 'ESP_CMD_INPUT_CONFIG', ...E, parse: parseInputConfigResponse, group: 'config' },
  ESP_CMD_INPUT_CHANNEL_CONFIG: { value: 0x21, label: 'ESP_CMD_INPUT_CHANNEL_CONFIG', ...E, parse: parseInputChannelConfigResponse, group: 'config' },
  ESP_CMD_OUTPUT_CONFIG: { value: 0x22, label: 'ESP_CMD_OUTPUT_CONFIG', ...E, parse: parseOutputConfigResponse, group: 'config' },
  ESP_CMD_OUTPUT_CHANNEL_CONFIG: { value: 0x23, label: 'ESP_CMD_OUTPUT_CHANNEL_CONFIG', ...E, parse: parseOutputChannelConfigResponse, group: 'config' },
  ESP_CMD_GYRO_CONFIG: { value: 0x24, label: 'ESP_CMD_GYRO_CONFIG', ...E, parse: parseGyroConfigResponse, group: 'config' },
  ESP_CMD_ACCEL_CONFIG: { value: 0x25, label: 'ESP_CMD_ACCEL_CONFIG', ...E, parse: parseAccelConfigResponse, group: 'config' },
  ESP_CMD_SERIAL_CONFIG: { value: 0x26, label: 'ESP_CMD_SERIAL_CONFIG', ...E, parse: parseSerialConfigResponse, group: 'config' },
  ESP_CMD_VOLTAGE_CONFIG: { value: 0x27, label: 'ESP_CMD_VOLTAGE_CONFIG', ...E, group: 'config' },
  ESP_CMD_CURRENT_CONFIG: { value: 0x28, label: 'ESP_CMD_CURRENT_CONFIG', ...E, group: 'config' },
  ESP_CMD_PID_CONFIG: { value: 0x29, label: 'ESP_CMD_PID_CONFIG', ...E, group: 'config' },
  ESP_CMD_PID_COMMON_CONFIG: { value: 0x2a, label: 'ESP_CMD_PID_COMMON_CONFIG', ...E, group: 'config' },
  ESP_CMD_MODES_CONFIG: { value: 0x2b, label: 'ESP_CMD_MODES_CONFIG', ...E, parse: parseModesConfigResponse, group: 'config' },
  ESP_CMD_FAILSAFE_CONFIG: { value: 0x2c, label: 'ESP_CMD_FAILSAFE_CONFIG', ...E, group: 'config' },
  ESP_CMD_BLACKBOX_CONFIG: { value: 0x2d, label: 'ESP_CMD_BLACKBOX_CONFIG', ...E, parse: parseBlackboxConfigResponse, group: 'config' },
  ESP_CMD_MIXER_CONFIG: { value: 0x2e, label: 'ESP_CMD_MIXER_CONFIG', ...E, parse: parseMixerConfigResponse, group: 'config' },
  ESP_CMD_RPM_FILTER_CONFIG: { value: 0x2f, label: 'ESP_CMD_RPM_FILTER_CONFIG', ...E, group: 'config' },
  ESP_CMD_DYN_NOTCH_CONFIG: { value: 0x30, label: 'ESP_CMD_DYN_NOTCH_CONFIG', ...E, group: 'config' },
  ESP_CMD_VTX_CONFIG: { value: 0x31, label: 'ESP_CMD_VTX_CONFIG', ...E, group: 'config' },
  ESP_CMD_GPS_CONFIG: { value: 0x32, label: 'ESP_CMD_GPS_CONFIG', ...E, group: 'config' },
  ESP_CMD_BARO_CONFIG: { value: 0x33, label: 'ESP_CMD_BARO_CONFIG', ...E, parse: parseBaroConfigResponse, group: 'config' },
  ESP_CMD_MAG_CONFIG: { value: 0x34, label: 'ESP_CMD_MAG_CONFIG', ...E, parse: parseMagConfigResponse, group: 'config' },
  ESP_CMD_FEATURE_CONFIG: { value: 0x35, label: 'ESP_CMD_FEATURE_CONFIG', ...E, parse: parseFeaturesConfigResponse, group: 'config' },
  ESP_CMD_MODEL_CONFIG: { value: 0x36, label: 'ESP_CMD_MODEL_CONFIG', ...E, group: 'config' },
  ESP_CMD_CALIBRATE: { value: 0x37, label: 'ESP_CMD_CALIBRATE', ...E, parse: parseCalibrateResponse, group: 'config' },
  ESP_CMD_ESC_PASSTHROUGH: { value: 0x38, label: 'ESP_CMD_ESC_PASSTHROUGH', ...E, group: 'config' },
  ESP_CMD_ALIGNMENT_CONFIG: { value: 0x39, label: 'ESP_CMD_ALIGNMENT_CONFIG', ...E, group: 'config' },
  ESP_CMD_PIN_CONFIG: { value: 0x3a, label: 'ESP_CMD_PIN_CONFIG', ...E, parse: parsePinConfigResponse, group: 'config' },
  ESP_CMD_SENSOR_CONFIG: { value: 0x3b, label: 'ESP_CMD_SENSOR_CONFIG', ...E, parse: parseSensorConfigResponse, group: 'config' },
  ESP_CMD_PID_TUNING: { value: 0x3c, label: 'ESP_CMD_PID_TUNING', ...E, parse: parsePidTuningResponse, group: 'config' },

  // ESP flash commands
  ESP_CMD_FLASH_LOGS: { value: 0x40, label: 'ESP_CMD_FLASH_LOGS', ...E, parse: parseFlashLogsResponse, group: 'flash' },
  ESP_CMD_FLASH_READ: { value: 0x41, label: 'ESP_CMD_FLASH_READ', ...E, parse: parseFlashReadResponse, group: 'flash' },
  ESP_CMD_FLASH_ERASE: { value: 0x42, label: 'ESP_CMD_FLASH_ERASE', ...E, parse: parseFlashEraseResponse, group: 'flash' },

  ESP_CMD_OUTPUT_OVERRIDE: { value: 0x4a, label: 'ESP_CMD_OUTPUT_OVERRIDE', ...E, parse: parseOutputOverrideResponse, group: 'system' },

  // ESP system commands
  ESP_CMD_DISABLE_ARM: { value: 0xf0, label: 'ESP_CMD_DISABLE_ARM', ...E, group: 'system' },
  ESP_CMD_DEFAULTS: { value: 0xf1, label: 'ESP_CMD_DEFAULTS', ...E, group: 'system' },
  ESP_CMD_SAVE: { value: 0xf2, label: 'ESP_CMD_SAVE', ...E, group: 'system' },
  ESP_CMD_REBOOT: { value: 0xf3, label: 'ESP_CMD_REBOOT', ...E, group: 'system' },

  // MSP commands
  MSP_API_VERSION: { value: 1, label: 'MSP_API_VERSION', ...M, parse: parseMspVersionResponse, group: 'info' },
  MSP_FC_VARIANT: { value: 2, label: 'MSP_FC_VARIANT', ...M, group: 'info' },
  MSP_FC_VERSION: { value: 3, label: 'MSP_FC_VERSION', ...M, group: 'info' },
  MSP_BOARD_INFO: { value: 4, label: 'MSP_BOARD_INFO', ...M, group: 'info' },
  MSP_BUILD_INFO: { value: 5, label: 'MSP_BUILD_INFO', ...M, group: 'info' },
  MSP_NAME: { value: 10, label: 'MSP_NAME', ...M, group: 'info' },
  MSP_RX_MAP: { value: 64, label: 'MSP_RX_MAP', ...M, group: 'info' },
  MSP_STATUS: { value: 101, label: 'MSP_STATUS', ...M, group: 'info' },
  MSP_STATUS_EX: { value: 150, label: 'MSP_STATUS_EX', ...M, group: 'info' },
  MSP_RAW_IMU: { value: 102, label: 'MSP_RAW_IMU', ...M, group: 'info' },
  MSP_SERVO: { value: 103, label: 'MSP_SERVO', ...M, group: 'info' },
  MSP_MOTOR: { value: 104, label: 'MSP_MOTOR', ...M, group: 'info' },
  MSP_RC: { value: 105, label: 'MSP_RC', ...M, group: 'info' },
  MSP_ATTITUDE: { value: 108, label: 'MSP_ATTITUDE', ...M, group: 'info' },
  MSP_DEBUG: { value: 254, label: 'MSP_DEBUG', ...M, group: 'info' },
}

export const mspCommandFromValue = (value: number, variant: string): MspCommandEntry | undefined => {
  return Object.values(MspCommand).find((v) => v.value === value && v.variant === variant)
}

export class MspReader {
  view: DataView
  index: number = 0
  size: number = 0

  constructor(view: DataView, size: number) {
    this.view = view
    this.size = size
  }

  remain(): number {
    return this.size - this.index
  }

  advance(size: number) {
    this.index += size
  }

  readU8(): number {
    return this.view.getUint8(this.index++)
  }
  readU16(): number {
    const v = this.view.getUint16(this.index, true)
    this.index += 2
    return v
  }
  readU32(): number {
    const v = this.view.getUint32(this.index, true)
    this.index += 4
    return v
  }
  read8(): number {
    return this.view.getInt8(this.index++)
  }
  read16(): number {
    const v = this.view.getInt16(this.index, true)
    this.index += 2
    return v
  }
  read32(): number {
    const v = this.view.getInt32(this.index, true)
    this.index += 4
    return v
  }
}

export class MspMessage {

  cmd: number = 0
  variant: MspVariant = 'E'
  state: string = MspState.IDLE
  dir: string = MspDirection.REQUEST
  size: number = 0
  received: number = 0
  written: number = 0
  checksum: number = 0
  data: ArrayBuffer
  view: DataView

  constructor(cmd: number | MspCommandEntry = 0, variant: MspVariant = 'E') {
    if (typeof cmd === 'object') {
      this.cmd = cmd.value
      this.variant = cmd.variant
    } else if (typeof cmd === 'number') {
      this.cmd = cmd
      this.variant = variant
    } else {
      throw new Error('Invalid command type')
    }
    this.data = new ArrayBuffer(256)
    this.view = new DataView(this.data);
  }

  getReader(): MspReader {
    return new MspReader(this.view, this.size)
  }

  isCmd(cmd: MspCommandEntry): boolean {
    return this.cmd === cmd.value && this.variant === cmd.variant
  }

  isReplyReceived(): boolean {
    return this.state === MspState.RECEIVED && this.dir === MspDirection.REPLY
  }

  writeU8(num: number) {
    this.view.setUint8(this.written++, num)
  }
  writeU16(num: number) {
    this.writeU8(num & 0xff)
    this.writeU8((num >> 8) & 0xff)
  }
  writeU32(num: number) {
    this.writeU16(num & 0xffff)
    this.writeU16((num >> 16) & 0xffff)
  }

  toDataBuffer(): Uint8Array {
    const size = this.written + 3 + 2 + 1 // data size + 3 bytes of header + 2 bytes for size and cmd + 1 byte for checksum
    const view = new Uint8Array(new ArrayBuffer(size));
    let i = 0
    view[i++] = '$'.charCodeAt(0)
    view[i++] = this.variant.charCodeAt(0)
    view[i++] = '<'.charCodeAt(0)
    view[i++] = this.written
    let checksum = this.written
    view[i++] = this.cmd
    checksum ^= this.cmd
    for (let k = 0; k < this.written; k++) {
      const v = this.view.getUint8(k)
      view[i++] = v
      checksum ^= v
    }
    view[i++] = checksum
    return view
  }

  toArray(): number[] {
    return Array.from(new Uint8Array(this.data)).slice(0, this.received || this.written)
  }

  toString(): string {
    const view = new Uint8Array(this.data);
    let str = mspCommandFromValue(this.cmd, this.variant)?.label || 'MSP_UNKNOWN'
    str += '(' + this.variant + ':' + this.cmd + ') '
    str += '['
    str += view.map(i => i).slice(0, this.size).join(', ')
    str += ']'
    return str
  }

  toId(): string {
    return `${this.variant}:${this.cmd.toString(16).toUpperCase().padStart(2, '0')}`
  }
}

const isCharCode = (code: number, c: string): boolean => code === c.charCodeAt(0)

export const mspParse = (c: number, msg: MspMessage): boolean => {
  switch (msg.state) {
    case MspState.IDLE:
      // idle, expect $ start
      if (isCharCode(c, '$')) {
        msg.state = MspState.START
      }
      break

    case MspState.START:
      // got start, expect protocol variant {E,M,X}
      if (isCharCode(c, 'M')) {
        msg.state = MspState.M
        msg.variant = 'M'
      }
      else if (isCharCode(c, 'E')) {
        msg.state = MspState.M
        msg.variant = 'E'
      }
      else msg.state = MspState.IDLE
      break

    case MspState.M:
      // got protocol variant, expect direction
      if (isCharCode(c, '>')) {
        msg.state = MspState.ARROW
        msg.dir = MspDirection.REPLY
      } else if (isCharCode(c, '<')) {
        msg.state = MspState.ARROW
        msg.dir = MspDirection.REQUEST
      } else {
        msg.state = MspState.IDLE
      }
      break

    case MspState.ARROW:
      // got direction, expect size
      if (c <= 192) {
        msg.size = c
        msg.received = 0
        msg.written = 0
        msg.checksum = c
        msg.state = MspState.SIZE
      } else {
        msg.state = MspState.IDLE
      }
      break

    case MspState.SIZE:
      // got size, expect command
      msg.cmd = c
      msg.checksum ^= c
      msg.state = MspState.CMD
      break;

    case MspState.CMD:
      // got command, expect data
      if (msg.received < msg.size) {
        msg.writeU8(c)
        msg.checksum ^= c
        msg.received++
      } else if (msg.received >= msg.size) {
        // got data, check crc, return received or back to idle
        msg.state = msg.checksum === c ? MspState.RECEIVED : MspState.IDLE
      }
      break;

    default:
      break
  }

  return msg.state !== MspState.IDLE
}
