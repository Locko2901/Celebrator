export { encrypt, decrypt, isEncrypted } from "./crypto.js"
export { getOrCreateKey, getExistingKey, removeKeyFile } from "./keyManager.js"
export { initEncryption, type EncryptionResult } from "./init.js"
export {
  ENCRYPTION_KEY_FILE,
  DATA_PATH_ENCRYPTED,
  SCRYPT_COST,
  SCRYPT_BLOCK_SIZE,
  SCRYPT_PARALLELIZATION,
} from "./constants.js"
