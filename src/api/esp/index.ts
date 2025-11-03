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

export interface MspVersionResponse {
  proto: number
  major: number
  minor: number
  magic: number
}

export const createMspVersionRequest = (): MspMessage => new MspMessage(MspCommand.MSP_API_VERSION)
export const parseMspVersionResponse = (msg: MspMessage): MspVersionResponse => {
  const reader = msg.getReader()
  const v = {
    proto: reader.readU8(),
    major: reader.readU8(),
    minor: reader.readU8(),
    magic: 0,
  }
  if (reader.remain() > 0) {
    v.magic = reader.readU8()
  }
  return v
}

export interface EspStatusResponse {
  sensors: number
  gyroTimeUs: number
  loopTimeUs: number
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
    loopTimeUs: reader.readU16(),
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
  const v: EspOutputResponse = {
    count: reader.readU8(),
    channels: []
  }
  for (let i = 0; i < v.count; i++) {
    v.channels.push(reader.readU16())
  }
  return v
}

export interface EspVoltageResponse {
  count: number
  items: {
    source: number
    voltage: number
    cells: number
  }[]
}

export const createVoltageRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_VOLTAGE)
export const parseVoltageResponse = (msg: MspMessage): EspVoltageResponse => {
  const reader = msg.getReader()
  const v: EspVoltageResponse = {
    count: reader.readU8(),
    items: [],
  }
  while (reader.remain() >= 4) {
    v.items.push({
      source: reader.readU8(),
      voltage: reader.readU16() * 0.01,
      cells: reader.readU8(),
    })
  }
  return v
}

export interface EspCurrentResponse {
  count: number
  items: {
    source: number
    current: number
    consumption: number
  }[]
}

export const createCurrentRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_VOLTAGE)
export const parseCurrentResponse = (msg: MspMessage): EspCurrentResponse => {
  const reader = msg.getReader()
  const v: EspCurrentResponse = {
    count: reader.readU8(),
    items: [],
  }
  while (reader.remain() >= 7) {
    v.items.push({
      source: reader.readU8(),
      current: reader.readU16() * 0.01,
      consumption: reader.readU32(),
    })
  }
  return v
}

export interface EspGpsResponse {
  time: number
  fixType: number
  sats: number
  latitude: number
  longitude: number
  altitude: number
  speed: number
  course: number
}

export const createGpsRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_GPS)
export const parseGpsResponse = (msg: MspMessage): EspGpsResponse => {
  const reader = msg.getReader()
  const v = {
    time: reader.readU32(),
    fixType: reader.readU8(),
    sats: reader.readU8(),
    latitude: reader.read32(),
    longitude: reader.read32(),
    altitude: reader.read32(),
    speed: reader.read32(),
    course: reader.read32(),
  }
  return v
}

export interface EspGpsInfoResponse {
  count: number
  svs: {
    gnssId: number
    id: number
    quality: number
    cno: number
  }[]
}

export const createGpsInfoRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_GPS_INFO)
export const parseGpsinfoResponse = (msg: MspMessage): EspGpsInfoResponse => {
  const reader = msg.getReader()
  const v: EspGpsInfoResponse = {
    count: reader.readU8(),
    svs: []
  }
  while (reader.remain() >= 4 && v.svs.length < v.count) {
    v.svs.push({
      gnssId: reader.readU8(),
      id: reader.readU8(),
      quality: reader.readU8(),
      cno: reader.readU8(),
    })
  }
  return v
}

export interface EspRpmTlmResponse {
  count: number
  items: {
    rpm: number
    errors: number
    temperature: number
    voltage: number
    current: number
  }[]
}


export const createRpmTlmRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_RPM_TLM)
export const parseRpmTlmResponse = (msg: MspMessage): EspRpmTlmResponse => {
  const reader = msg.getReader()
  const v: EspRpmTlmResponse = {
    count: reader.readU8(),
    items: []
  }
  while (reader.remain() >= 8 && v.items.length < v.count) {
    v.items.push({
      rpm: reader.readU32(),
      errors: reader.readU8() * 0.5,
      temperature: reader.readU8(),
      voltage: reader.readU8(),
      current: reader.readU8(),
    })
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
      msg.writeU8(data.channels[i].map)
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
      map: reader.readU8(),
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

export interface EspSerialConfigResponse {
  count: number
  configs: EspSerialConfig[]
}

export const createSerialConfigRequest = (data?: EspSerialConfigResponse): MspMessage => {
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
  while (reader.remain() >= 8) {
    v.configs.push({
      baud: reader.readU32(),
      func: reader.readU32(),
    })
  }
  return v
}

export interface EspVoltageConfig {
  count: number
  items: {
    source: number
    scale: number
    cellWarning: number
  }[]
}

export const createVoltageConfigRequest = (data?: EspVoltageConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_VOLTAGE_CONFIG)
  if (data) {
    msg.writeU8(data.count)
    for (let i = 0; i < data.count; i++) {
      msg.writeU8(data.items[i].source)
      msg.writeU16(data.items[i].scale)
      msg.writeU16(data.items[i].cellWarning)
    }
  }
  return msg
}

export const parseVoltageConfigResponse = (msg: MspMessage): EspVoltageConfig => {
  const reader = msg.getReader()
  const v: EspVoltageConfig = {
    count: reader.readU8(),
    items: [],
  }
  while (reader.remain() >= 5 && v.items.length < v.count) {
    v.items.push({
      source: reader.readU8(),
      scale: reader.readU16(),
      cellWarning: reader.readU16(),
    })
  }
  return v
}

export interface EspCurrentConfig {
  count: number
  items: {
    source: number
    scale: number
    offset: number
  }[]
}

export const createCurrentConfigRequest = (data?: EspCurrentConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_CURRENT_CONFIG)
  if (data) {
    msg.writeU8(data.count)
    for (let i = 0; i < data.count; i++) {
      msg.writeU8(data.items[i].source)
      msg.writeU16(data.items[i].scale)
      msg.writeU16(data.items[i].offset)
    }
  }
  return msg
}

export const parseCurrentConfigResponse = (msg: MspMessage): EspCurrentConfig => {
  const reader = msg.getReader()
  const v: EspCurrentConfig = {
    count: reader.readU8(),
    items: [],
  }
  while (reader.remain() >= 5 && v.items.length < v.count) {
    v.items.push({
      source: reader.readU8(),
      scale: reader.readU16(),
      offset: reader.read16(),
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

export interface EspModeConfig {
  id: number
  ch: number
  min: number
  max: number
}

export interface EspModesConfig {
  modeCount: number
  modes: EspModeConfig[]
}

export const createModesConfigRequest = (data?: EspModesConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_MODES_CONFIG)
  if (data) {
    msg.writeU8(data.modeCount)
    data.modes.map(m => {
      msg.writeU8(m.id)
      msg.writeU8(m.ch)
      msg.writeU16(m.min)
      msg.writeU16(m.max)
    })
  }
  return msg
}

export const parseModesConfigResponse = (msg: MspMessage): EspModesConfig => {
  const reader = msg.getReader()
  const count = reader.readU8()
  return {
    modeCount: count,
    modes: Array(count).fill(0).map(() => {
      return {
        id: reader.readU8(),
        ch: reader.readU8(),
        min: reader.readU16(),
        max: reader.readU16(),
      }
    })
  }
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
  const v: EspPinConfigResponse = { pins: [] }
  while (reader.remain() >= 2) {
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
  alignment: number[]
}

export const createSensorConfigRequest = (data?: EspSensorConfigResponse): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_SENSOR_CONFIG)
  if (data) {
    msg.writeU8(data.loopSync)
    msg.writeU8(data.accelDev)
    msg.writeU8(data.baroDev)
    msg.writeU8(data.magDev)
    msg.writeU16(data.alignment[0])
    msg.writeU16(data.alignment[1])
    msg.writeU16(data.alignment[2])
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
    alignment: [
      reader.read16(),
      reader.read16(),
      reader.read16(),
    ]
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

export interface EspBaroConfig {
  lpf: EspLpfConfig
}

export const createBaroConfigRequest = (data?: EspBaroConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_BARO_CONFIG)
  if (data) {
    msg.writeU8(data.lpf.type)
    msg.writeU16(data.lpf.freq)
  }
  return msg
}

export const parseBaroConfigResponse = (msg: MspMessage): EspBaroConfig => {
  const reader = msg.getReader()
  return {
    lpf: {
      type: reader.readU8(),
      freq: reader.readU16(),
    }
  }
}

export interface EspMagConfig {
  align: number
  lpf: EspLpfConfig
}

export const createMagConfigRequest = (data?: EspMagConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_BARO_CONFIG)
  if (data) {
    msg.writeU8(data.align)
    msg.writeU8(data.lpf.type)
    msg.writeU16(data.lpf.freq)
  }
  return msg
}

export const parseMagConfigResponse = (msg: MspMessage): EspMagConfig => {
  const reader = msg.getReader()
  return {
    align: reader.readU8(),
    lpf: {
      type: reader.readU8(),
      freq: reader.readU16(),
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

export interface EspDebugNames {
  names: EspNameElement[]
}

export const createDebugNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_DEBUG_NAMES)
}

export const parseDebugNamesResponse = (msg: MspMessage): EspDebugNames => {
  return { names: parseNames(msg) }
}

export interface EspBlackboxNames {
  names: EspNameElement[]
}

export const createBlackboxNamesRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_BLACKBOX_NAMES)
}

export const parseBlackboxNamesResponse = (msg: MspMessage): EspBlackboxNames => {
  return { names: parseNames(msg) }
}

export interface EspBlackboxConfig {
  device: number
  denom: number
  mode: number
  fieldMask: number
  debugMode: number
  debugAxis: number
}

export const createBlackboxConfigRequest = (data?: EspBlackboxConfig): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_BLACKBOX_CONFIG)
  if (data) {
    msg.writeU8(data.device)
    msg.writeU8(data.denom)
    msg.writeU8(data.mode)
    msg.writeU32(data.fieldMask)
    msg.writeU8(data.debugMode)
    msg.writeU8(data.debugAxis)
  }
  return msg
}

export const parseBlackboxConfigResponse = (msg: MspMessage): EspBlackboxConfig => {
  const reader = msg.getReader()
  return {
    device: reader.readU8(),
    denom: reader.readU8(),
    mode: reader.readU8(),
    fieldMask: reader.readU32(),
    debugMode: reader.readU8(),
    debugAxis: reader.readU8(),
  }
}

export type EspCalibrate = {
  mode: number
}

export const parseCalibrateResponse = (msg: MspMessage): EspCalibrate => {
  const reader = msg.getReader()
  return {
    mode: reader.readU8(),
  }
}

export const createCalibrateRequest = (data?: EspCalibrate): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_CALIBRATE)
  if (data) {
    msg.writeU8(data.mode)
  }
  return msg
}


export type EspFlashLogsItem = {
  address: number
  size: number
}

export type EspFlashLogsResponse = {
  total: number
  used: number
  logs: EspFlashLogsItem[]
}

export const parseFlashLogsResponse = (msg: MspMessage): EspFlashLogsResponse => {
  const reader = msg.getReader()
  const v: EspFlashLogsResponse = {
    total: reader.readU32(),
    used: reader.readU32(),
    logs: [],
  }
  while (reader.remain() >= 8) {
    const log = {
      address: reader.readU32(),
      size: reader.readU32(),
    }
    if (log.size) v.logs.push(log)
  }
  return v
}

export const createFlashLogsRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_FLASH_LOGS)
}

export type EspFlashReadRequest = {
  address: number
  size: number
}

export type EspFlashReadResponse = {
  address: number
  size: number
  flags: number
  buffer: ArrayBuffer
}

export const parseFlashReadResponse = (msg: MspMessage): EspFlashReadResponse => {
  const reader = msg.getReader()
  const v: EspFlashReadResponse = {
    address: reader.readU32(),
    size: reader.readU16(),
    flags: reader.readU16(),
    buffer: reader.readAsBuffer(reader.remain()),
  }
  return v
}

export const createFlashReadRequest = (data: EspFlashReadRequest): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_FLASH_READ)
  if (data) {
    msg.writeU32(data.address)
    msg.writeU16(data.size)
  }
  return msg
}

export type EspFlashErase = {
  status: number
}

export const parseFlashEraseResponse = (msg: MspMessage): EspFlashErase => {
  const reader = msg.getReader()
  return { status: reader.readU8() }
}

export const createFlashEraseRequest = (): MspMessage => {
  return new MspMessage(MspCommand.ESP_CMD_FLASH_ERASE)
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

export interface EspOutputOverride {
  count: number
  values: number[]
}

export const createOutputOverrideRequest = (data?: EspOutputOverride): MspMessage => {
  const msg = new MspMessage(MspCommand.ESP_CMD_OUTPUT_OVERRIDE)
  if (data) {
    msg.writeU8(data.count)
    data.values.map(v => {
      msg.writeU16(v)
    })
  }
  return msg
}

export const parseOutputOverrideResponse = (msg: MspMessage): EspOutputOverride => {
  const reader = msg.getReader()
  const count = reader.readU8()
  const v: EspOutputOverride = {
    count: count,
    values: [],
  }
  while (reader.remain() >= 2) {
    v.values.push(reader.readU16())
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

export const createDefaultsRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_DEFAULTS)
export const parseDefaultsResponse = (_msg: MspMessage) => {
  return {}
}
