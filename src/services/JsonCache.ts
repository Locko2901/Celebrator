import { readFile, writeFile, mkdir, rename } from "fs/promises"
import { dirname, join } from "path"

import { decrypt, encrypt, isEncrypted } from "./encryption/index.js"

class Mutex {
  private locked = false
  private queue: Array<() => void> = []

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true

      return
    }

    return new Promise((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    const next = this.queue.shift()

    if (next) {
      next()
    } else {
      this.locked = false
    }
  }
}

export class JsonCache<T> {
  private cache: T | null = null
  private readonly mutex = new Mutex()

  constructor(
    private readonly filePath: string,
    private readonly defaultValue: T,
    private readonly encryptionKey: string | null = null,
  ) {}

  private async _readUnsafe(): Promise<T> {
    if (this.cache !== null) {return this.cache}
    try {
      let raw = await readFile(this.filePath, "utf-8")

      if (this.encryptionKey !== null && isEncrypted(raw)) {
        try {
          raw = decrypt(raw, this.encryptionKey)
        } catch {
          throw new Error(`Failed to decrypt ${this.filePath}. Wrong ENCRYPTION_KEY?`)
        }
      }

      this.cache = JSON.parse(raw) as T

      return this.cache
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        this.cache = this.defaultValue

        return this.cache
      }
      throw new Error(`Failed to parse ${this.filePath}: ${String(e)}`, { cause: e })
    }
  }

  async read(): Promise<T> {
    if (this.cache !== null) {return this.cache}
    await this.mutex.acquire()
    try {
      return await this._readUnsafe()
    } finally {
      this.mutex.release()
    }
  }

  async write(data: T): Promise<void> {
    const dir = dirname(this.filePath)

    await mkdir(dir, { recursive: true })
    const tempPath = join(dir, `.${Date.now()}.tmp`)

    let content = JSON.stringify(data, null, 2)

    if (this.encryptionKey !== null) {
      content = encrypt(content, this.encryptionKey)
    }

    await writeFile(tempPath, content)
    await rename(tempPath, this.filePath)
    this.cache = data
  }

  async update(fn: (data: T) => T | Promise<T>): Promise<T> {
    await this.mutex.acquire()
    try {
      const data = await this._readUnsafe()
      const updated = await fn(data)

      await this.write(updated)

      return updated
    } finally {
      this.mutex.release()
    }
  }

  invalidate(): void {
    this.cache = null
  }

  isCached(): boolean {
    return this.cache !== null
  }
}
