
export type Vector3 = [number, number, number];

export const FORWARD_X: Vector3 = [1, 0, 0];
export const BACKWARD_X: Vector3 = [-1, 0, 0];
export const FORWARD_Y: Vector3 = [0, 1, 0];
export const BACKWARD_Y: Vector3 = [0, -1, 0];
export const FORWARD_Z: Vector3 = [0, 0, 1];
export const BACKWARD_Z: Vector3 = [0, 0, -1];

export function addVectors(v1: Vector3, v2: Vector3): Vector3 {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

export function areVectorsEqual(v1: Vector3, v2: Vector3): boolean {
  return v1[0] === v2[0] && v1[1] === v2[1] && v1[2] === v2[2];
}

export function vectorToString(v: Vector3): string {
    return v.join(',');
}
