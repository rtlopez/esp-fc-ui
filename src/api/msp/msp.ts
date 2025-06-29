
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
}

const E = { variant: 'E' } as const
const M = { variant: 'M' } as const

export const MspCommand: Record<string, MspCommandEntry> = {
  // ESP status commands
  ESP_CMD_VERSION: { value: 0x01, label: 'ESP_CMD_VERSION', ...E },
  ESP_CMD_STATUS: { value: 0x02, label: 'ESP_CMD_STATUS', ...E },
  ESP_CMD_STATISTICS: { value: 0x03, label: 'ESP_CMD_STATISTICS', ...E },
  ESP_CMD_ATTITUDE: { value: 0x04, label: 'ESP_CMD_ATTITUDE', ...E },
  ESP_CMD_SENSORS: { value: 0x05, label: 'ESP_CMD_SENSORS', ...E },
  ESP_CMD_INPUT: { value: 0x06, label: 'ESP_CMD_INPUT', ...E },
  ESP_CMD_OUTPUT: { value: 0x07, label: 'ESP_CMD_OUTPUT', ...E },
  ESP_CMD_VOLTAGE: { value: 0x08, label: 'ESP_CMD_VOLTAGE', ...E },
  ESP_CMD_CURRENT: { value: 0x09, label: 'ESP_CMD_CURRENT', ...E },
  ESP_CMD_GPS: { value: 0x0a, label: 'ESP_CMD_GPS', ...E },
  ESP_CMD_GPS_INFO: { value: 0x0b, label: 'ESP_CMD_GPS_INFO', ...E },
  ESP_CMD_RPM_TLM: { value: 0x0c, label: 'ESP_CMD_RPM_TLM', ...E },
  ESP_CMD_DEBUG: { value: 0x0f, label: 'ESP_CMD_DEBUG', ...E },

  // ESP feature names commands
  ESP_CMD_MODE_NAMES: { value: 0x10, label: 'ESP_CMD_MODE_NAMES', ...E },
  ESP_CMD_FEATURE_NAMES: { value: 0x11, label: 'ESP_CMD_FEATURE_NAMES', ...E },
  ESP_CMD_DEBUG_NAMES: { value: 0x12, label: 'ESP_CMD_DEBUG_NAMES', ...E },
  ESP_CMD_SERIAL_NAMES: { value: 0x13, label: 'ESP_CMD_SERIAL_NAMES', ...E },
  ESP_CMD_PID_NAMES: { value: 0x14, label: 'ESP_CMD_PID_NAMES', ...E },

  // ESP configuration commands
  ESP_CMD_INPUT_CONFIG: { value: 0x20, label: 'ESP_CMD_INPUT_CONFIG', ...E },
  ESP_CMD_INPUT_CHANNEL_CONFIG: { value: 0x21, label: 'ESP_CMD_INPUT_CHANNEL_CONFIG', ...E },
  ESP_CMD_OUTPUT_CONFIG: { value: 0x22, label: 'ESP_CMD_OUTPUT_CONFIG', ...E },
  ESP_CMD_OUTPUT_CHANNEL_CONFIG: { value: 0x23, label: 'ESP_CMD_OUTPUT_CHANNEL_CONFIG', ...E },
  ESP_CMD_GYRO_CONFIG: { value: 0x24, label: 'ESP_CMD_GYRO_CONFIG', ...E },
  ESP_CMD_ACCEL_CONFIG: { value: 0x25, label: 'ESP_CMD_ACCEL_CONFIG', ...E },
  ESP_CMD_SERIAL_CONFIG: { value: 0x26, label: 'ESP_CMD_SERIAL_CONFIG', ...E },
  ESP_CMD_VOLTAGE_CONFIG: { value: 0x27, label: 'ESP_CMD_VOLTAGE_CONFIG', ...E },
  ESP_CMD_CURRENT_CONFIG: { value: 0x28, label: 'ESP_CMD_CURRENT_CONFIG', ...E },
  ESP_CMD_PID_CONFIG: { value: 0x29, label: 'ESP_CMD_PID_CONFIG', ...E },
  ESP_CMD_PID_COMMON_CONFIG: { value: 0x2a, label: 'ESP_CMD_PID_COMMON_CONFIG', ...E },
  ESP_CMD_MODES_CONFIG: { value: 0x2b, label: 'ESP_CMD_MODES_CONFIG', ...E },
  ESP_CMD_FAILSAFE_CONFIG: { value: 0x2c, label: 'ESP_CMD_FAILSAFE_CONFIG', ...E },
  ESP_CMD_BLACKBOX_CONFIG: { value: 0x2d, label: 'ESP_CMD_BLACKBOX_CONFIG', ...E },
  ESP_CMD_MIXER_CONFIG: { value: 0x2e, label: 'ESP_CMD_MIXER_CONFIG', ...E },
  ESP_CMD_RPM_FILTER_CONFIG: { value: 0x2f, label: 'ESP_CMD_RPM_FILTER_CONFIG', ...E },
  ESP_CMD_DYN_NOTCH_CONFIG: { value: 0x30, label: 'ESP_CMD_DYN_NOTCH_CONFIG', ...E },
  ESP_CMD_VTX_CONFIG: { value: 0x31, label: 'ESP_CMD_VTX_CONFIG', ...E },
  ESP_CMD_GPS_CONFIG: { value: 0x32, label: 'ESP_CMD_GPS_CONFIG', ...E },
  ESP_CMD_BARO_CONFIG: { value: 0x33, label: 'ESP_CMD_BARO_CONFIG', ...E },
  ESP_CMD_MAG_CONFIG: { value: 0x34, label: 'ESP_CMD_MAG_CONFIG', ...E },
  ESP_CMD_FEATURE_CONFIG: { value: 0x35, label: 'ESP_CMD_FEATURE_CONFIG', ...E },
  ESP_CMD_MODEL_CONFIG: { value: 0x36, label: 'ESP_CMD_MODEL_CONFIG', ...E },
  ESP_CMD_CALIBRATE: { value: 0x37, label: 'ESP_CMD_CALIBRATE', ...E },
  ESP_CMD_ESC_PASSTHROUGH: { value: 0x38, label: 'ESP_CMD_ESC_PASSTHROUGH', ...E },
  ESP_CMD_ALIGNMENT_CONFIG: { value: 0x39, label: 'ESP_CMD_ALIGNMENT_CONFIG', ...E },

  // ESP flash commands
  ESP_CMD_FLASH_STATUS: { value: 0x40, label: 'ESP_CMD_FLASH_STATUS', ...E },
  ESP_CMD_FLASH_READ: { value: 0x41, label: 'ESP_CMD_FLASH_READ', ...E },
  ESP_CMD_FLASH_ERASE: { value: 0x42, label: 'ESP_CMD_FLASH_ERASE', ...E },

  // ESP system commands
  ESP_CMD_DISABLE_ARM: { value: 0xf0, label: 'ESP_CMD_DISABLE_ARM', ...E },
  ESP_CMD_DEFAULTS: { value: 0xf1, label: 'ESP_CMD_DEFAULTS', ...E },
  ESP_CMD_SAVE: { value: 0xf2, label: 'ESP_CMD_SAVE', ...E },
  ESP_CMD_REBOOT: { value: 0xf3, label: 'ESP_CMD_REBOOT', ...E },

  // MSP commands
  MSP_API_VERSION: { value: 1, label: 'MSP_API_VERSION', ...M },
  MSP_FC_VARIANT: { value: 2, label: 'MSP_FC_VARIANT', ...M },
  MSP_FC_VERSION: { value: 3, label: 'MSP_FC_VERSION', ...M },
  MSP_BOARD_INFO: { value: 4, label: 'MSP_BOARD_INFO', ...M },
  MSP_BUILD_INFO: { value: 5, label: 'MSP_BUILD_INFO', ...M },
  MSP_NAME: { value: 10, label: 'MSP_NAME', ...M },
  MSP_RX_MAP: { value: 64, label: 'MSP_RX_MAP', ...M },
  MSP_STATUS: { value: 101, label: 'MSP_STATUS', ...M },
  MSP_STATUS_EX: { value: 150, label: 'MSP_STATUS_EX', ...M },
  MSP_RAW_IMU: { value: 102, label: 'MSP_RAW_IMU', ...M },
  MSP_SERVO: { value: 103, label: 'MSP_SERVO', ...M },
  MSP_MOTOR: { value: 104, label: 'MSP_MOTOR', ...M },
  MSP_RC: { value: 105, label: 'MSP_RC', ...M },
  MSP_ATTITUDE: { value: 108, label: 'MSP_ATTITUDE', ...M },
  MSP_DEBUG: { value: 254, label: 'MSP_DEBUG', ...M },
}

export const mspCommandFromValue = (value: number, variant: string) => {
  return Object.values(MspCommand).find((v) => v.value === value && v.variant === variant)?.label
}

export class MspMessage {

  cmd = 0
  variant = 'E'
  state = MspState.IDLE
  dir = MspDirection.REQUEST
  size = 0
  received = 0
  read = 0
  checksum = 0
  onReceive = null
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

  isA(cmd: MspCommandEntry): boolean {
    return this.cmd === cmd.value && this.variant === cmd.variant
  }

  remain(): number {
    return this.size - this.read
  }

  advance(size: number) {
    this.read += size
  }

  readU8(): number {
    return this.view.getUint8(this.read++)
  }
  readU16(): number {
    const v = this.view.getUint16(this.read, true)
    this.read += 2
    return v
  }
  readU32(): number {
    const v = this.view.getUint32(this.read, true)
    this.read += 4
    return v
  }
  read8(): number {
    return this.view.getInt8(this.read++)
  }
  read16(): number {
    const v = this.view.getInt16(this.read, true)
    this.read += 2
    return v
  }
  read32(): number {
    const v = this.view.getInt32(this.read, true)
    this.read += 4
    return v
  }

  writeU8(num: number) {
    this.view.setUint8(this.read++, num)
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
    const size = this.read + 3 + 2 + 1 // data size + 3 bytes of header + 2 bytes for size and cmd + 1 byte for checksum
    const view = new Uint8Array(new ArrayBuffer(size));
    let i = 0
    view[i++] = '$'.charCodeAt(0)
    view[i++] = this.variant.charCodeAt(0)
    view[i++] = '<'.charCodeAt(0)
    view[i++] = this.read
    let checksum = this.read
    view[i++] = this.cmd
    checksum ^= this.cmd
    for (let k = 0; k < this.read; k++) {
      view[i++] = this.view.getUint8(k)
      checksum ^= view[k]
    }
    view[i++] = checksum
    return view
  }

  toString(): string {
    const view = new Uint8Array(this.data);
    let str = mspCommandFromValue(this.cmd, this.variant) || 'MSP_UNKNOWN'
    str += '(' + this.variant + ':' + this.cmd + ') '
    str += '['
    str += view.map(i => i).slice(0, this.size).join(', ')
    str += ']'
    return str
  }
}

const isCharCode = (code: number, c: string): boolean => code === c.charCodeAt(0)

export const mspParse = (c: number, msg: MspMessage): boolean => {
  switch (msg.state) {
    case MspState.IDLE:
      if (isCharCode(c, '$')) msg.state = MspState.START
      break

    case MspState.START:
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
      if (c <= 192) {
        msg.size = c
        msg.received = 0
        msg.read = 0
        msg.checksum = c
        msg.state = MspState.SIZE
      } else {
        msg.state = MspState.IDLE
      }
      break

    case MspState.SIZE:
      msg.cmd = c
      msg.checksum ^= c
      msg.state = MspState.CMD
      break;

    case MspState.CMD:
      if (msg.received < msg.size) {
        msg.writeU8(c)
        msg.checksum ^= c
        msg.received++
      } else if (msg.received >= msg.size) {
        msg.state = msg.checksum === c ? MspState.RECEIVED : MspState.IDLE
        msg.read = 0
      }
      break;

    default:
      break
  }

  return msg.state !== MspState.IDLE
}
