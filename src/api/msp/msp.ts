
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

export const MspCommand = {
  MSP_API_VERSION: {value:   1, label: 'MSP_API_VERSION'},
  MSP_FC_VARIANT:  {value:   2, label: 'MSP_FC_VARIANT'},
  MSP_FC_VERSION:  {value:   3, label: 'MSP_FC_VERSION'},
  MSP_BOARD_INFO:  {value:   4, label: 'MSP_BOARD_INFO'},
  MSP_BUILD_INFO:  {value:   5, label: 'MSP_BUILD_INFO'},
  MSP_NAME:        {value:  10, label: 'MSP_NAME'},
  MSP_RX_MAP:      {value:  64, label: 'MSP_RX_MAP'},
  MSP_STATUS:      {value: 101, label: 'MSP_STATUS'},
  MSP_STATUS_EX:   {value: 150, label: 'MSP_STATUS_EX'},
  MSP_RAW_IMU:     {value: 102, label: 'MSP_RAW_IMU'},
  MSP_SERVO:       {value: 103, label: 'MSP_SERVO'},
  MSP_MOTOR:       {value: 104, label: 'MSP_MOTOR'},
  MSP_RC:          {value: 105, label: 'MSP_RC'},
  MSP_ATTITUDE:    {value: 108, label: 'MSP_ATTITUDE'},
  MSP_DEBUG:       {value: 254, label: 'MSP_DEBUG'},
}

export const mspCommandFromValue = (value: number) => {
  return Object.values(MspCommand).find((v) => v.value === value)?.label
}

export class MspMessage {

  cmd = 0
  state = MspState.IDLE
  dir = MspDirection.REQUEST
  size = 0
  received = 0
  read = 0
  checksum = 0
  onReceive = null
  data: ArrayBuffer
  view: Uint8Array

  constructor(cmd: number = 0) {
    this.cmd = cmd || 0
    this.data = new ArrayBuffer(192)
    this.view = new Uint8Array(this.data);
  }

  remain() {
    return this.size - this.read
  }

  advance(size: number) {
    this.read += size
  }

  readU8() {
    return this.view[this.read++]
  }
  readU16() {
    return this.readU8() | (this.readU8() << 8)
  }
  readU32() {
    return this.readU16() | (this.readU16() << 16)
  }

  writeU8(num: number) {
    this.view[this.read++] = num
  }
  writeU16(num: number) {
    this.writeU8(num & 0xff)
    this.writeU8((num >> 8) & 0xff)
  }
  writeU32(num: number) {
    this.writeU16(num & 0xffff)
    this.writeU16((num >> 16) & 0xffff)
  }

  toDataBuffer() {
    const size = this.read + 3 + 2 + 1 // data size + 3 bytes of header + 2 bytes for size and cmd + 1 byte for checksum
    const data = new ArrayBuffer(size)
    const view = new Uint8Array(data);
    let i = 0
    view[i++] = '$'.charCodeAt(0)
    view[i++] = 'M'.charCodeAt(0)
    view[i++] = '<'.charCodeAt(0)
    view[i++] = this.read
    let checksum = this.read
    view[i++] = this.cmd
    checksum ^= this.cmd
    for(let k = 0; k < this.read; k++) {
      view[i++] = this.view[k]
      checksum ^= this.view[k]
    }
    view[i++] = checksum
    return view
  }

  toString() {
    let str = mspCommandFromValue(this.cmd) || 'MSP_UNKNOWN'
    str += '(' + this.cmd + ') '
    str += '['
    str += this.view.map(i => i).slice(0, this.size).join(', ')
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
      if(isCharCode(c, 'M')) msg.state = MspState.M
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
