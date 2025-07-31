import { MspCommand, MspMessage } from "@/api/msp/msp"
import { createQuaternion, Euler, Quaternion, quaternionToEuler } from "@/api/spatial"

export interface EspVersionResponse {
  apiMajor: number
  apiMinor: number
  hwType: number
  capabilities: number
  fwVersion: string
  fwRevision: string
}

export const createVersionRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_VERSION)
export const parseVersionResponse = (msg: MspMessage): EspVersionResponse => {
  const reader = msg.getReader()
  const v = {
    apiMajor: reader.readU8(),
    apiMinor: reader.readU8(),
    hwType: reader.readU8(),
    capabilities: reader.readU32(),
    fwVersion: '',
    fwRevision: '',
  }
  let c = 0
  for (let i = 0; i < 16; i++) {
    c = reader.readU8()
    if (c > 0) v.fwVersion += String.fromCharCode(c)
  }
  for (let i = 0; i < 16; i++) {
    c = reader.readU8()
    if (c > 0) v.fwRevision += String.fromCharCode(c)
  }
  return v
}

export interface EspStatusResponse {
  sensors: number
  gyroTimeUs: number
  modeSwitchMask: number
  modeActiveMask: number
  armingDisableFlags: number
}

export const createStatusRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_STATUS)
export const parseStatusResponse = (msg: MspMessage): EspStatusResponse => {
  const reader = msg.getReader()
  const v = {
    sensors: reader.readU16(),
    gyroTimeUs: reader.readU16(),
    modeSwitchMask: reader.readU32(),
    modeActiveMask: reader.readU32(),
    armingDisableFlags: reader.readU32(),
  }
  return v
}

export interface EspStatisticsResponse {
  uptimeMs: number
  cpuLoad: number
  cpu0Load: number
  cpu1Load: number
  heapTotal: number
  heapFree: number
  flashTotal: number
  flashUsed: number
}

export const createStatisticsRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_STATISTICS)
export const parseStatisticsResponse = (msg: MspMessage): EspStatisticsResponse => {
  const reader = msg.getReader()
  const v = {
    uptimeMs: reader.readU32(),
    cpuLoad: reader.readU8(),
    cpu0Load: reader.readU8(),
    cpu1Load: reader.readU8(),
    heapTotal: reader.readU32(),
    heapFree: reader.readU32(),
    flashTotal: reader.readU32(),
    flashUsed: reader.readU32(),
  }
  return v
}

export const createAttitudeRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_ATTITUDE)
export const parseAttitudeResponse = (msg: MspMessage): [Quaternion, Euler] => {
  const reader = msg.getReader()
  const q = createQuaternion(reader.read16() * 0.001, reader.read16() * 0.001, reader.read16() * 0.001, reader.read16() * 0.001)
  const e = quaternionToEuler(q)
  return [q, e]
}

export interface EspSensorsResponse {
  gyro: { x: number, y: number, z: number }
  accel: { x: number, y: number, z: number }
  mag: { x: number, y: number, z: number }
  baroAlt: number
}

export const createSensorsRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_SENSORS)
export const parseSensorsResponse = (msg: MspMessage): EspSensorsResponse => {
  const reader = msg.getReader()
  const v = {
    gyro: { x: reader.read16() * 0.01, y: reader.read16() * 0.01, z: reader.read16() * 0.01 },
    accel: { x: reader.read16() * 0.01, y: reader.read16() * 0.01, z: reader.read16() * 0.01 },
    mag: { x: reader.read16() * 0.01, y: reader.read16() * 0.01, z: reader.read16() * 0.01 },
    baroAlt: reader.read16() * 0.01,
  }
  return v
}

export interface EspInputResponse {
  count: number
  channels: number[]
}

export const createInputRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_INPUT)
export const parseInputResponse = (msg: MspMessage): EspInputResponse => {
  const reader = msg.getReader()
  const v = {
    count: reader.readU8(),
    channels: [] as number[]
  }
  for (let i = 0; i < v.count; i++) {
    v.channels.push(reader.readU16())
  }
  return v
}

export interface EspOutputResponse {
  count: number
  channels: number[]
}

export const createOutputRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_OUTPUT)
export const parseOutputResponse = (msg: MspMessage): EspOutputResponse => {
  const reader = msg.getReader()
  const v = {
    count: reader.readU8(),
    channels: [] as number[]
  }
  for (let i = 0; i < v.count; i++) {
    v.channels.push(reader.readU16())
  }
  return v
}

export interface EspVoltageResponse {
  voltage: number
  cells: number
}

export const createVoltageRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_VOLTAGE)
export const parseVoltageResponse = (msg: MspMessage): EspVoltageResponse => {
  const reader = msg.getReader()
  const v = {
    voltage: reader.readU16() * 0.01,
    cells: reader.readU8(),
  }
  return v
}

export interface EspCurrentResponse {
  current: number
  consumption: number
}

export const createCurrentRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_VOLTAGE)
export const parseCurrentResponse = (msg: MspMessage): EspCurrentResponse => {
  const reader = msg.getReader()
  const v = {
    current: reader.readU16() * 0.01,
    consumption: reader.readU32(),
  }
  return v
}

export interface EspDebugResponse {
  debug: number[]
}

export const createDebugRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_DEBUG)
export const parseDebugResponse = (msg: MspMessage): EspDebugResponse => {
  const reader = msg.getReader()
  const v = {
    debug: [] as number[]
  }
  for (let i = 0; i < 8; i++) {
    v.debug.push(reader.read16())
  }
  return v
}

export interface EspInputConfigResponse {
  type: number
  deadband: number
  smoothing: number
  mid: number
  min: number
  max: number
}

export const createInputConfigRequest = (data?: EspInputConfigResponse): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_INPUT_CONFIG)
  if (data) {
    msg.writeU8(data.type)
    msg.writeU8(data.deadband)
    msg.writeU8(data.smoothing)
    msg.writeU16(data.mid)
    msg.writeU16(data.min)
    msg.writeU16(data.max)
  }
  return msg
}
export const parseInputConfigResponse = (msg: MspMessage): EspInputConfigResponse => {
  const reader = msg.getReader()
  const v = {
    type: reader.readU8(),
    deadband: reader.readU8(),
    smoothing: reader.readU8(),
    mid: reader.readU16(),
    min: reader.readU16(),
    max: reader.readU16(),
  }
  return v
}

export interface EspInputChannelConfig {
  map: number
  min: number
  max: number
  fsMode: number
  fsValue: number
}

export interface EspInputChannelConfigRequest {
  count: number
  channels: EspInputChannelConfig[]
}

export interface EspInputChannelConfigResponse {
  count: number
  channels: EspInputChannelConfig[]
}

export const createInputChannelConfigRequest = (data?: EspInputChannelConfigRequest): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_INPUT_CHANNEL_CONFIG)
  if (data) {
    msg.writeU8(data.count)
    for(let i = 0; i < 16; i++) {
      msg.writeU8(data.channels[i].map - 1)
      msg.writeU16(data.channels[i].min)
      msg.writeU16(data.channels[i].max)
      msg.writeU8(data.channels[i].fsMode)
      msg.writeU16(data.channels[i].fsValue)
    }
  }
  return msg
}

export const parseInputChannelConfigResponse = (msg: MspMessage): EspInputChannelConfigResponse => {
  const reader = msg.getReader()
  const v: EspInputChannelConfigResponse = {
    count: reader.readU8(),
    channels: [],
  }
  for(let i = 0; i < 16; i++) {
    const c = {
      map: reader.readU8() + 1,
      min: reader.readU16(),
      max: reader.readU16(),
      fsMode: reader.readU8(),
      fsValue: reader.readU16(),
    }
    v.channels.push(c)
  }
  return v
}

export interface EspOutputConfigResponse {
  protocol: number
  async: boolean
  rate: number
  servoRate: number
  minCommand: number
  minThrottle: number
  maxThrottle: number
  digitalIdle: number
  digitalTlm: boolean
  motorPoles: number
  motorLimit: number
  throttleLimitType: number
  throttleLimitPercent: number
}

export const createOutputConfigRequest = (data?: EspOutputConfigResponse): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_OUTPUT_CONFIG)
  if (data) {
    msg.writeU8(data.protocol)
    msg.writeU8(+data.async)
    msg.writeU16(data.rate)
    msg.writeU16(data.servoRate)
    msg.writeU16(data.minCommand)
    msg.writeU16(data.minThrottle)
    msg.writeU16(data.maxThrottle)
    msg.writeU16(data.digitalIdle)
    msg.writeU8(+data.digitalTlm)
    msg.writeU8(data.motorPoles)
    msg.writeU8(data.motorLimit)
    msg.writeU8(data.throttleLimitType)
    msg.writeU8(data.throttleLimitPercent)
  }
  return msg
}

export const parseOutputConfigResponse = (msg: MspMessage): EspOutputConfigResponse => {
  const reader = msg.getReader()
  const v = {
    protocol: reader.readU8(),
    async: !!reader.readU8(),
    rate: reader.readU16(),
    servoRate: reader.readU16(),
    minCommand: reader.readU16(),
    minThrottle: reader.readU16(),
    maxThrottle: reader.readU16(),
    digitalIdle: reader.readU16(),
    digitalTlm: !!reader.readU8(),
    motorPoles: reader.readU8(),
    motorLimit: reader.readU8(),
    throttleLimitType: reader.readU8(),
    throttleLimitPercent: reader.readU8(),
  }
  return v
}

export interface EspOutputChannelConfig {
  min: number
  neutral: number
  max: number
  servo: boolean
  reverse: boolean
}

export interface EspOutputChannelConfigRequest {
  count: number
  channels: EspOutputChannelConfig[]
}

export interface EspOutputChannelConfigResponse {
  count: number
  channels: EspOutputChannelConfig[]
}

export const createOutputChannelConfigRequest = (data?: EspOutputChannelConfigRequest): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_OUTPUT_CHANNEL_CONFIG)
  if (data) {
    msg.writeU8(data.count)
    for(let i = 0; i < data.count; i++) {
      msg.writeU16(data.channels[i].min)
      msg.writeU16(data.channels[i].neutral)
      msg.writeU16(data.channels[i].max)
      msg.writeU8(+data.channels[i].servo)
      msg.writeU8(+data.channels[i].reverse)
    }
  }
  return msg
}

export const parseOutputChannelConfigResponse = (msg: MspMessage): EspOutputChannelConfigResponse => {
  const reader = msg.getReader()
  const v: EspOutputChannelConfigResponse = {
    count: reader.readU8(),
    channels: [],
  }
  for(let i = 0; i < v.count; i++) {
    v.channels.push({
      min: reader.readU16(),
      neutral: reader.readU16(),
      max: reader.readU16(),
      servo: !!reader.readU8(),
      reverse: !!reader.readU8(),
    })
  }
  return v
}

export interface EspSerialConfig {
  baud: number
  func: number
}

export interface EspSerialConfigRequest {
  count: number
  configs: EspSerialConfig[]
}

export interface EspSerialConfigResponse {
  count: number
  configs: EspSerialConfig[]
}

export const createSerialConfigRequest = (data?: EspSerialConfigRequest): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_SERIAL_CONFIG)
  if (data) {
    msg.writeU8(data.count)
    for(let i = 0; i < data.count; i++) {
      msg.writeU32(data.configs[i].baud)
      msg.writeU32(data.configs[i].func)
    }
  }
  return msg
}

export const parseSerialConfigResponse = (msg: MspMessage): EspSerialConfigResponse => {
  const reader = msg.getReader()
  const v: EspSerialConfigResponse = {
    count: reader.readU8(),
    configs: [],
  }
  for(let i = 0; i < v.count; i++) {
    v.configs.push({
      baud: reader.readU32(),
      func: reader.readU32(),
    })
  }
  return v
}

export interface EspSerialNames {
  names: string[]
}

export const createSerialNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_SERIAL_NAMES)
}

export const parseSerialNamesResponse = (msg: MspMessage): EspSerialNames => {
  const reader = msg.getReader()
  let name = ''
  const v: EspSerialNames = { names: [] }
  while (reader.remain() > 0) {
    const c = reader.readU8()
    if (c != 0) {
      name += String.fromCharCode(c)
    } else {
      v.names.push(name)
      name = ''
    }
  }
  return v
}

export interface EspFeaturesNames {
  names: Record<number, string>
}

export const createFeaturesNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_FEATURE_NAMES)
}

export const parseFeaturesNamesResponse = (msg: MspMessage): EspFeaturesNames => {
  const reader = msg.getReader()
  let name = ''
  let id = -1
  const v: EspFeaturesNames = { names: {} }
  while (reader.remain() > 0) {
    const c = reader.readU8()
    if (id == -1 && name.length == 0) {
      id = c
    } else if (c != 0) {
      name += String.fromCharCode(c)
    } else {
      v.names[id] = name
      name = ''
      id = -1
    }
  }
  return v
}

export interface EspFeaturesConfig {
  features: number
}

export const createFeaturesConfigRequest = (data?: EspFeaturesConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_FEATURE_CONFIG)
  if(data) {
    msg.writeU32(data.features)
  }
  return msg
}

export const parseFeaturesConfigResponse = (msg: MspMessage): EspFeaturesConfig => {
  const reader = msg.getReader()
  const v: EspFeaturesConfig = { features: reader.readU32() }
  return v
}

export interface EspModeNames {
  names: Record<number, string>
}

export const createModeNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_MODE_NAMES)
}

export const parseModeNamesResponse = (msg: MspMessage): EspModeNames => {
  const reader = msg.getReader()
  let name = ''
  let id = -1
  const v: EspModeNames = { names: {} }
  while (reader.remain() > 0) {
    const c = reader.readU8()
    if (id == -1 && name.length == 0) {
      id = c
    } else if (c != 0) {
      name += String.fromCharCode(c)
    } else {
      v.names[id] = name
      name = ''
      id = -1
    }
  }
  return v
}

export interface EspPinFunction {
  type: number
  index: number
  pin: number
}

export interface EspPinConfigResponse {
  pins: EspPinFunction[]
}

export const createPinConfigRequest = (data?: EspPinConfigResponse): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_PIN_CONFIG)
  if (data) {
    data.pins.map(f => {
      msg.writeU8(f.type << 4 | f.index)
      msg.writeU8(f.pin)
    })
  }
  return msg
}

export const parsePinConfigResponse = (msg: MspMessage): EspPinConfigResponse => {
  const reader = msg.getReader()
  const count = reader.size / 2
  const v: EspPinConfigResponse = { pins: [] }
  for(let i = 0; i < count; i++) {
    const id = reader.readU8()
    const pin = reader.read8()
    const type = id >> 4
    const index = id & 0x0f
    v.pins.push({type, index, pin})
  }
  return v
}

export const createSaveRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_SAVE)
export const parseSaveResponse = (_msg: MspMessage) => {
  return {}
}

export const createRebootRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_REBOOT)
export const parseRebootResponse = (_msg: MspMessage) => {
  return {}
}

export interface EspInputConfigRquest {
  type: number
}

export const createDisableArmRequest = (data: EspInputConfigRquest): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_DISABLE_ARM)
  msg.writeU8(data.type)
  return msg;
}
export const parseDisableArmResponse = (_msg: MspMessage) => {
  return {}
}

export const createDefaultsRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_SAVE)
export const parseDefaultsResponse = (_msg: MspMessage) => {
  return {}
}
