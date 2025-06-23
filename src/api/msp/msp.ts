
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

export const MspCommand: Record<string, MspCommandEntry> = {
  ESP_CMD_VERSION: {value:   0, label: 'ESP_CMD_VERSION', variant: 'E'},
  ESP_CMD_STATUS:  {value:   1, label: 'ESP_CMD_STATUS', variant: 'E'},
  ESP_CMD_STATISTICS: {value: 2, label: 'ESP_CMD_STATISTICS', variant: 'E'},

  MSP_API_VERSION: {value:   1, label: 'MSP_API_VERSION', variant: 'M'},
  MSP_FC_VARIANT:  {value:   2, label: 'MSP_FC_VARIANT',  variant: 'M'},
  MSP_FC_VERSION:  {value:   3, label: 'MSP_FC_VERSION',  variant: 'M'},
  MSP_BOARD_INFO:  {value:   4, label: 'MSP_BOARD_INFO',  variant: 'M'},
  MSP_BUILD_INFO:  {value:   5, label: 'MSP_BUILD_INFO',  variant: 'M'},
  MSP_NAME:        {value:  10, label: 'MSP_NAME',        variant: 'M'},
  MSP_RX_MAP:      {value:  64, label: 'MSP_RX_MAP',      variant: 'M'},
  MSP_STATUS:      {value: 101, label: 'MSP_STATUS',      variant: 'M'},
  MSP_STATUS_EX:   {value: 150, label: 'MSP_STATUS_EX',   variant: 'M'},
  MSP_RAW_IMU:     {value: 102, label: 'MSP_RAW_IMU',     variant: 'M'},
  MSP_SERVO:       {value: 103, label: 'MSP_SERVO',       variant: 'M'},
  MSP_MOTOR:       {value: 104, label: 'MSP_MOTOR',       variant: 'M'},
  MSP_RC:          {value: 105, label: 'MSP_RC',          variant: 'M'},
  MSP_ATTITUDE:    {value: 108, label: 'MSP_ATTITUDE',    variant: 'M'},
  MSP_DEBUG:       {value: 254, label: 'MSP_DEBUG',       variant: 'M'},
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

  constructor(cmd: number = 0, variant: MspVariant = 'E') {
    this.cmd = cmd
    this.variant = variant
    this.data = new ArrayBuffer(256)
    this.view = new DataView(this.data);
  }

  remain(): number {
    return this.size - this.read
  }

  advance(size: number) {
    this.read += size
  }

  readU8(): number {
    //return this.view[this.read++]
    return this.view.getUint8(this.read++)
  }
  readU16(): number {
    return this.readU8() | (this.readU8() << 8)
  }
  readU32(): number {
    return this.readU16() | (this.readU16() << 16)
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
    for(let k = 0; k < this.read; k++) {
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
  switch(msg.state) {
    case MspState.IDLE:
      if(isCharCode(c, '$')) msg.state = MspState.START
      break

    case MspState.START:
      if(isCharCode(c, 'M')) {
        msg.state = MspState.M
        msg.variant = 'M'
      }
      else if(isCharCode(c, 'E')) {
        msg.state = MspState.M
        msg.variant = 'E'
      }
      else msg.state = MspState.IDLE
      break

    case MspState.M:
      if(isCharCode(c, '>')) {
        msg.state = MspState.ARROW
        msg.dir = MspDirection.REPLY
      } else if(isCharCode(c, '<')) {
        msg.state = MspState.ARROW
        msg.dir = MspDirection.REQUEST
      } else {
        msg.state = MspState.IDLE
      }
      break

    case MspState.ARROW:
      if(c <= 192) {
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
      if(msg.received < msg.size) {
        msg.writeU8(c)
        msg.checksum ^= c
        msg.received++
      } else if(msg.received >= msg.size) {
        msg.state = msg.checksum === c ? MspState.RECEIVED : MspState.IDLE
        msg.read = 0
      }
      break;

    default:
      break
  }

  return msg.state !== MspState.IDLE
}
