import { customAlphabet } from "nanoid"

const DEVICE_ID_KEY = "bill_split_device_id"
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24)

/**
 * Gets the device ID from local storage or generates a new one if it doesn't exist
 * @returns The device ID for this device
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") {
    // Server-side rendering fallback
    return "server"
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)

  if (!deviceId) {
    deviceId = nanoid()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  return deviceId
}

/**
 * Manually set a device ID (useful for testing)
 * @param id The device ID to set
 */
export function setDeviceId(id: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
}
