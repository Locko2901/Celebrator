import { readFile, writeFile, unlink } from "node:fs/promises"

import { config } from "../../config.js"
import { DATA_PATH_JSON } from "../../utils/constants.js"
import { decrypt, encrypt } from "./crypto.js"
import { DATA_PATH_ENCRYPTED } from "./constants.js"
import { getOrCreateKey, getExistingKey, removeKeyFile } from "./keyManager.js"

export interface EncryptionResult {
  key: string | null
  dataPath: string
}

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8")
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    throw e
  }
}

async function tryDelete(path: string): Promise<void> {
  try {
    await unlink(path)
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
      throw e
    }
  }
}

export async function initEncryption(): Promise<EncryptionResult> {
  const { useEncryption } = config

  const jsonContent = await tryReadFile(DATA_PATH_JSON)
  const encContent = await tryReadFile(DATA_PATH_ENCRYPTED)

  if (useEncryption) {
    const key = await getOrCreateKey()

    if (jsonContent !== null) {
      console.log("[encryption] Encrypting data file...")
      const encrypted = encrypt(jsonContent, key)

      await writeFile(DATA_PATH_ENCRYPTED, encrypted)
      await tryDelete(DATA_PATH_JSON)
      console.log("[encryption] Data migrated to encrypted format (birthdays.encrypted)")
    }

    return { key, dataPath: DATA_PATH_ENCRYPTED }
  }

  const existingKey = await getExistingKey()

  if (encContent !== null && existingKey !== null) {
    console.log("[encryption] Decrypting data file...")
    try {
      const decrypted = decrypt(encContent, existingKey)

      JSON.parse(decrypted)

      await writeFile(DATA_PATH_JSON, decrypted)
      await tryDelete(DATA_PATH_ENCRYPTED)
      await removeKeyFile()
      console.log("[encryption] Data migrated to plain format (birthdays.json)")

      return { key: null, dataPath: DATA_PATH_JSON }
    } catch {
      console.error("[encryption] Failed to decrypt - wrong key or corrupted data")
      console.error("[encryption] Keeping encrypted file. Set USE_ENCRYPTION=true to continue with encrypted data.")

      return { key: existingKey, dataPath: DATA_PATH_ENCRYPTED }
    }
  }

  if (encContent !== null && existingKey === null) {
    console.error("[encryption] ERROR: Encrypted data exists but no key found!")
    console.error("[encryption] Cannot decrypt. Restore .encryption_key or set USE_ENCRYPTION=true to generate new key (data will be lost).")
    console.error("[encryption] Refusing to start with inaccessible data.")
    process.exit(1)
  }

  if (existingKey !== null && encContent === null) {
    await removeKeyFile()
  }

  return { key: null, dataPath: DATA_PATH_JSON }
}
