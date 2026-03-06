import { join } from "node:path"

export const DATA_PATH_ENCRYPTED = join(process.cwd(), "data", "birthdays.encrypted")

export const ENCRYPTION_KEY_FILE = join(process.cwd(), "data", ".encryption_key")

export const KEY_LENGTH = 32

export const IV_LENGTH = 12

export const AUTH_TAG_LENGTH = 16

export const SALT_LENGTH = 32

export const SCRYPT_COST = 16384

export const SCRYPT_BLOCK_SIZE = 8

export const SCRYPT_PARALLELIZATION = 1
