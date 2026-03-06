import { randomBytes } from "node:crypto"
import { readFile, writeFile, unlink } from "node:fs/promises"

import { ENCRYPTION_KEY_FILE, KEY_LENGTH } from "./constants.js"

let cachedKey: string | null = null

async function tryReadKeyFile(): Promise<string | null> {
  try {
    return (await readFile(ENCRYPTION_KEY_FILE, "utf-8")).trim()
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    throw e
  }
}

export async function getOrCreateKey(): Promise<string> {
  if (cachedKey !== null) {
    return cachedKey
  }

  const existingKey = await tryReadKeyFile()

  if (existingKey !== null) {
    cachedKey = existingKey

    return cachedKey
  }

  cachedKey = randomBytes(KEY_LENGTH).toString("base64")
  await writeFile(ENCRYPTION_KEY_FILE, cachedKey, { mode: 0o600 })
  console.log("[encryption] Generated new encryption key")

  return cachedKey
}

export async function getExistingKey(): Promise<string | null> {
  if (cachedKey !== null) {
    return cachedKey
  }

  const key = await tryReadKeyFile()

  if (key !== null) {
    cachedKey = key
  }

  return key
}

export async function removeKeyFile(): Promise<void> {
  try {
    await unlink(ENCRYPTION_KEY_FILE)
    cachedKey = null
    console.log("[encryption] Removed encryption key file")
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
      throw e
    }
  }
}

export function clearKeyCache(): void {
  cachedKey = null
}
