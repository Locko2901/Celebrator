import { randomUUID } from "crypto"

import type { Birthday } from "../types.js"
import { DATA_PATH_JSON } from "../utils/constants.js"
import { JsonCache } from "./JsonCache.js"

export class DuplicateNameError extends Error {
  constructor(public readonly name: string) {
    super(`A birthday entry for "${name}" already exists.`)
    this.name = "DuplicateNameError"
  }
}

let birthdayCache: JsonCache<Birthday[]> | null = null

function getCache(): JsonCache<Birthday[]> {
  birthdayCache ??= new JsonCache<Birthday[]>(DATA_PATH_JSON, [], null)

  return birthdayCache
}

export function initBirthdayCache(dataPath: string, encryptionKey: string | null): void {
  birthdayCache = new JsonCache<Birthday[]>(dataPath, [], encryptionKey)
}

export interface AddResult {
  birthday: Birthday
  count: number
  sameDay: Birthday[]
}

export interface UpdateResult {
  success: boolean
  count: number
}

export interface RemoveResult {
  success: boolean
  count: number
}

export class BirthdayService {
  static async read(): Promise<Birthday[]> {
    return getCache().read()
  }

  static invalidateCache(): void {
    getCache().invalidate()
  }

  private static hasDuplicateName(all: Birthday[], name: string, excludeId?: string): boolean {
    return all.some((b) => b.name.toLowerCase() === name.toLowerCase() && b.id !== excludeId)
  }

  static async sorted(birthdays?: Birthday[]): Promise<Birthday[]> {
    const list = birthdays ?? await this.read()

    return [...list].sort((a, b) => a.date.localeCompare(b.date))
  }

  static async count(): Promise<number> {
    const all = await this.read()

    return all.length
  }

  static async findById(id: string): Promise<Birthday | undefined> {
    const all = await this.read()

    return all.find((b) => b.id === id)
  }

  static async findByName(name: string): Promise<Birthday | undefined> {
    const all = await this.read()

    return all.find((b) => b.name === name)
  }

  static async findByDate(date: string, excludeId?: string): Promise<Birthday[]> {
    const all = await this.read()

    return all.filter((b) => b.date === date && b.id !== excludeId)
  }

  static async add(data: Omit<Birthday, "id">): Promise<AddResult> {
    let result!: AddResult

    await getCache().update((all) => {
      if (this.hasDuplicateName(all, data.name)) {
        throw new DuplicateNameError(data.name)
      }
      const birthday: Birthday = { id: randomUUID(), ...data }

      all.push(birthday)
      const sameDay = all.filter((b) => b.date === birthday.date && b.id !== birthday.id)

      result = { birthday, count: all.length, sameDay }

      return all
    })

    return result
  }

  static async remove(id: string): Promise<RemoveResult> {
    let result!: RemoveResult

    await getCache().update((all) => {
      const idx = all.findIndex((b) => b.id === id)

      if (idx === -1) {
        result = { success: false, count: all.length }

        return all
      }
      all.splice(idx, 1)
      result = { success: true, count: all.length }

      return all
    })

    return result
  }

  static async update(id: string, updates: Partial<Omit<Birthday, "id">>): Promise<UpdateResult> {
    let result!: UpdateResult

    await getCache().update((all) => {
      const idx = all.findIndex((b) => b.id === id)

      if (idx === -1) {
        result = { success: false, count: all.length }

        return all
      }
      if (updates.name !== undefined && this.hasDuplicateName(all, updates.name, id)) {
        throw new DuplicateNameError(updates.name)
      }
      Object.assign(all[idx], updates)
      result = { success: true, count: all.length }

      return all
    })

    return result
  }
}
