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
  loopTimeUs: number
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
    loopTimeUs: reader.readU16(),
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
    for (let i = 0; i < 16; i++) {
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
  for (let i = 0; i < 16; i++) {
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
    msg.writeU16(data.digitalIdle * 100)
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
    digitalIdle: reader.readU16() * 0.01,
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
    for (let i = 0; i < data.count; i++) {
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
  for (let i = 0; i < v.count; i++) {
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
    for (let i = 0; i < data.count; i++) {
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
  for (let i = 0; i < v.count; i++) {
    v.configs.push({
      baud: reader.readU32(),
      func: reader.readU32(),
    })
  }
  return v
}

export interface EspNameElement {
  id: number
  name: string
}

const parseNames = (msg: MspMessage): EspNameElement[] => {
  const reader = msg.getReader()
  const names: EspNameElement[] = []
  let name = ''
  let id = -1
  while (reader.remain() > 0) {
    const c = reader.readU8()
    if (id == -1 && name.length == 0) {
      id = c
    } else if (c != 0) {
      name += String.fromCharCode(c)
    } else {
      names.push({ id, name })
      name = ''
      id = -1
    }
  }
  return names
}

export interface EspSerialNames {
  names: EspNameElement[]
}

export const createSerialNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_SERIAL_NAMES)
}

export const parseSerialNamesResponse = (msg: MspMessage): EspSerialNames => {
  return { names: parseNames(msg) }
}

export interface EspFeaturesNames {
  names: EspNameElement[]
}

export const createFeaturesNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_FEATURE_NAMES)
}

export const parseFeaturesNamesResponse = (msg: MspMessage): EspFeaturesNames => {
  return { names: parseNames(msg) }
}

export interface EspFeaturesConfig {
  features: number
}

export const createFeaturesConfigRequest = (data?: EspFeaturesConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_FEATURE_CONFIG)
  if (data) {
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
  names: EspNameElement[]
}

export const createModeNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_MODE_NAMES)
}

export const parseModeNamesResponse = (msg: MspMessage): EspModeNames => {
  return { names: parseNames(msg) }
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
  for (let i = 0; i < count; i++) {
    const id = reader.readU8()
    const pin = reader.read8()
    const type = id >> 4
    const index = id & 0x0f
    v.pins.push({ type, index, pin })
  }
  return v
}

export interface EspSensorConfigResponse {
  loopSync: number
  accelDev: number
  baroDev: number
  magDev: number
}

export const createSensorConfigRequest = (data?: EspSensorConfigResponse): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_SENSOR_CONFIG)
  if (data) {
    msg.writeU8(data.loopSync)
    msg.writeU8(data.accelDev)
    msg.writeU8(data.baroDev)
    msg.writeU8(data.magDev)
  }
  return msg
}

export const parseSensorConfigResponse = (msg: MspMessage): EspSensorConfigResponse => {
  const reader = msg.getReader()
  return {
    loopSync: reader.readU8(),
    accelDev: reader.readU8(),
    baroDev: reader.readU8(),
    magDev: reader.readU8(),
  }
}

export interface EspLpfConfig {
  type: number
  freq: number
}

export interface EspAccelConfig {
  lpf: EspLpfConfig
}

export const createAccelConfigRequest = (data?: EspAccelConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_ACCEL_CONFIG)
  if (data) {
    msg.writeU8(data.lpf.type)
    msg.writeU16(data.lpf.freq)
  }
  return msg
}

export const parseAccelConfigResponse = (msg: MspMessage): EspAccelConfig => {
  const reader = msg.getReader()
  return {
    lpf: {
      type: reader.readU8(),
      freq: reader.readU16(),
    }
  }
}

export interface EspDynNotchConfig {
  count: number
  q: number
  minFreq: number
  maxFreq: number
}

export interface EspRpmNotchConfig {
  harmonics: number
  q: number
  minFreq: number
}

export interface EspGyroConfig {
  align: number,
  lpf: EspLpfConfig[],
  dynNotch: EspDynNotchConfig,
  rpmNotch: EspRpmNotchConfig,
}

export const createGyroConfigRequest = (data?: EspGyroConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_GYRO_CONFIG)
  if (data) {
    msg.writeU8(data.align)
    msg.writeU8(data.lpf[0].type)
    msg.writeU16(data.lpf[0].freq)
    msg.writeU8(data.lpf[1].type)
    msg.writeU16(data.lpf[1].freq)
    msg.writeU8(data.lpf[2].type)
    msg.writeU16(data.lpf[2].freq)
    msg.writeU8(data.dynNotch.count)
    msg.writeU8(Math.round(data.dynNotch.q * 10))
    msg.writeU16(data.dynNotch.minFreq)
    msg.writeU16(data.dynNotch.maxFreq)
    msg.writeU8(data.rpmNotch.harmonics)
    msg.writeU8(Math.round(data.rpmNotch.q * 10))
    msg.writeU16(data.rpmNotch.minFreq)
  }
  return msg
}

export const parseGyroConfigResponse = (msg: MspMessage): EspGyroConfig => {
  const reader = msg.getReader()
  return {
    align: reader.readU8(),
    lpf: [0, 1, 2].map(() => {
      return {
        type: reader.readU8(),
        freq: reader.readU16(),
      }
    }),
    dynNotch: {
      count: reader.readU8(),
      q: reader.readU8() * 0.1,
      minFreq: reader.readU16(),
      maxFreq: reader.readU16(),
    },
    rpmNotch: {
      harmonics: reader.readU8(),
      q: reader.readU8() * 0.1,
      minFreq: reader.readU16(),
    }
  }
}

export interface EspPidConfig {
  p: number
  i: number
  d: number
  f: number
}

export interface EspPidTuning {
  mode: number
  rpGain: number
  rpStability: number
  rpAgility: number
  rpBalance: number
  yawGain: number
  yawStability: number
  pids: EspPidConfig[]
}

export const createPidTuningRequest = (data?: EspPidTuning): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_PID_TUNING)
  if (data) {
    msg.writeU8(data.mode)
    msg.writeU8(data.rpGain)
    msg.writeU8(data.rpStability)
    msg.writeU8(data.rpAgility)
    msg.writeU8(data.rpBalance)
    msg.writeU8(data.yawGain)
    msg.writeU8(data.yawStability)
    data.pids.map(p => {
      msg.writeU8(p.p)
      msg.writeU8(p.i)
      msg.writeU8(p.d)
      msg.writeU16(p.f)
    })
  }
  return msg
}

export const parsePidTuningResponse = (msg: MspMessage): EspPidTuning => {
  const reader = msg.getReader()
  return {
    mode: reader.readU8(),
    rpGain: reader.readU8(),
    rpStability: reader.readU8(),
    rpAgility: reader.readU8(),
    rpBalance: reader.readU8(),
    yawGain: reader.readU8(),
    yawStability: reader.readU8(),
    pids: [
      { p: reader.readU8(), i: reader.readU8(), d: reader.readU8(), f: reader.readU16() },
      { p: reader.readU8(), i: reader.readU8(), d: reader.readU8(), f: reader.readU16() },
      { p: reader.readU8(), i: reader.readU8(), d: reader.readU8(), f: reader.readU16() },
    ]
  }
}

export interface EspMixerNames {
  names: EspNameElement[]
}

export const createMixerNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_MIXER_NAMES)
}

export const parseMixerNamesResponse = (msg: MspMessage): EspMixerNames => {
  return { names: parseNames(msg) }
}

export interface EspMixerConfig {
  mixerType: number
  yawReverse: boolean
  sync: number
}

export const createMixerConfigRequest = (data?: EspMixerConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_MIXER_CONFIG)
  if (data) {
    msg.writeU8(data.mixerType)
    msg.writeU8(+data.yawReverse)
    msg.writeU8(+data.sync)
  }
  return msg
}

export const parseMixerConfigResponse = (msg: MspMessage): EspMixerConfig => {
  const reader = msg.getReader()
  return {
    mixerType: reader.readU8(),
    yawReverse: !!reader.readU8(),
    sync: reader.readU8(),
  }
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
