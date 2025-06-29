import { MspCommand, MspMessage } from "@/api/msp/msp"
import { createQuaternion, Euler, Quaternion, quaternionToEuler } from "@/api/spatial"

export const createVersionRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_VERSION)

export interface EspVersionResponse {
  apiMajor: number
  apiMinor: number
  hwType: number
  capabilities: number
  fwVersion: string
  fwRevision: string
}

export const parseVersionResponse = (msg: MspMessage): EspVersionResponse => {
  const v = {
    apiMajor: msg.readU8(),
    apiMinor: msg.readU8(),
    hwType: msg.readU8(),
    capabilities: msg.readU32(),
    fwVersion: '',
    fwRevision: '',
  }
  // TODO: parse fw ver/rev
  return v
}

export const createStatusRequest = () : MspMessage => new MspMessage(MspCommand.ESP_CMD_STATUS)

export interface EspStatusResponse {
  sensors: number
  gyroTimeUs: number
  modeSwitchMask: number
  modeActiveMask: number
  armingDisableFlags: number
}

export const parseStatusResponse = (msg: MspMessage): EspStatusResponse => {
  const v = {
    sensors: msg.readU16(),
    gyroTimeUs: msg.readU16(),
    modeSwitchMask: msg.readU32(),
    modeActiveMask: msg.readU32(),
    armingDisableFlags: msg.readU32(),
  }
  return v
}

export const createAttitudeRequest = (): MspMessage => new MspMessage(MspCommand.ESP_CMD_ATTITUDE)

export const parseAttitudeResponse = (msg: MspMessage): [Quaternion, Euler] => {
  const q = createQuaternion(msg.read16() * 0.001, msg.read16() * 0.001, msg.read16() * 0.001, msg.read16() * 0.001)
  const e = quaternionToEuler(q)
  return [q, e]
}

export const createSensorsRequest = () : MspMessage => new MspMessage(MspCommand.ESP_CMD_SENSORS)

export interface EspSensorsResponse {
  gyro: { x: number, y: number, z: number}
  accel: { x: number, y: number, z: number}
  mag: { x: number, y: number, z: number}
  baroAlt: number
}

export const parseSensorsResponse = (msg: MspMessage): EspSensorsResponse => {
  const v = {
    gyro: { x: msg.read16() * 0.01, y: msg.read16() * 0.01, z: msg.read16() * 0.01 },
    accel: { x: msg.read16() * 0.01, y: msg.read16() * 0.01, z: msg.read16() * 0.01 },
    mag: { x: msg.read16() * 0.01, y: msg.read16() * 0.01, z: msg.read16() * 0.01 },
    baroAlt: msg.read16() * 0.01,
  }
  return v
}

