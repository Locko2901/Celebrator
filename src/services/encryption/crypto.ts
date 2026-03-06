import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto"

import {
  KEY_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  SALT_LENGTH,
  SCRYPT_COST,
  SCRYPT_BLOCK_SIZE,
  SCRYPT_PARALLELIZATION,
} from "./constants.js"

const ALGORITHM = "aes-256-gcm"

function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  })
}

export function encrypt(plaintext: string, password: string): string {
  if (!plaintext || !password) {
    throw new Error("Plaintext and password are required")
  }

  const salt = randomBytes(SALT_LENGTH)
  const key = deriveKey(password, salt)
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  const combined = Buffer.concat([salt, iv, authTag, encrypted])

  return combined.toString("base64")
}

export function decrypt(ciphertext: string, password: string): string {
  if (!ciphertext || !password) {
    throw new Error("Ciphertext and password are required")
  }

  const combined = Buffer.from(ciphertext, "base64")

  const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1
  if (combined.length < minLength) {
    throw new Error("Ciphertext too short to be valid")
  }

  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)

  const key = deriveKey(password, salt)

  const decipher = createDecipheriv(ALGORITHM, key, iv)

  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

  return decrypted.toString("utf8")
}

export function isEncrypted(data: string): boolean {
  const trimmed = data.trimStart()

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return false
  }

  const stripped = data.trim().replace(/\s/g, "")

  if (!/^[A-Za-z0-9+/]+=*$/.test(stripped)) {
    return false
  }

  try {
    const decoded = Buffer.from(stripped, "base64")

    return decoded.length > SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  } catch {
    return false
  }
}
