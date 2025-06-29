
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
  toArray?: () => [number, number, number, number]
  toUi: () => [number, number, number, number]
}

export interface Euler {
  roll: number;   // Rotation around x-axis
  pitch: number;  // Rotation around y-axis
  yaw: number;    // Rotation around z-axis
}

export function radToDeg(rad: number) {
  return rad * 180 / Math.PI;
}

export function createQuaternion(x: number, y: number, z: number, w: number): Quaternion {
  return {
    x: x,
    y: y,
    z: z,
    w: w,
    toArray() {
      return [this.x, this.y, this.z, this.w];
    },
    toUi() {
      // Translate device quaternion to UI quaternion
      // Device: [x, y, z, w]
      // UI: [-y, z, -x, w]
      return [-this.y, this.z, -this.x, this.w];
    }
  }
}

export function quaternionToEuler(q: Quaternion): Euler {

  // const roll = Math.atan2((q.x * q.y + q.z * q.w), 0.5 * (q.y * q.y + q.z * q.z))
  // const pitch = Math.asin(-2 * (q.y * q.w - q.x * q.y))
  // const yaw = Math.atan2((q.y * q.z + q.x * q.w), 0.5 * (q.z * q.z + q.w * q.w))

  // roll (x-axis rotation)
  const roll = Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y));

  // pitch (y-axis rotation)
  const sinp = 2 * (q.w * q.y - q.z * q.x);
  let pitch;
  if (Math.abs(sinp) >= 1) {
    pitch = Math.sign(sinp) * Math.PI / 2; // over 90 degrees, so clamp to 90
  } else {
    pitch = Math.asin(sinp);
  }

  // yaw (z-axis rotation)
  const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));

  return { roll, pitch, yaw };
}
