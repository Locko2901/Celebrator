/**
 * Auto-migration utility for birthday data format.
 *
 * Detects and migrates from old formats to v2:
 * - v1.0: { name, day, month }
 * - v1.5: { id, name, day, month }
 * - v2:   { id, name, date }  (current)
 */

import { readFile, writeFile, copyFile, access } from "fs/promises"
import { randomUUID } from "crypto"
import { DATA_PATH_JSON } from "./constants.js"

interface V1Birthday {
  name: string
  day: number
  month: number
}

interface V1_5Birthday {
  id: string
  name: string
  day: number
  month: number
}

interface V2Birthday {
  id: string
  name: string
  date: string
}

type AnyBirthday = V1Birthday | V1_5Birthday | V2Birthday

type DataFormat = "v1" | "v1.5" | "v2" | "empty" | "unknown"

function detectFormat(data: AnyBirthday[]): DataFormat {
  if (data.length === 0) {
    return "empty"
  }

  const sample = data[0]

  if ("id" in sample && "date" in sample) {
    return "v2"
  }

  if ("id" in sample && "day" in sample && "month" in sample) {
    return "v1.5"
  }

  if ("name" in sample && "day" in sample && "month" in sample) {
    return "v1"
  }

  return "unknown"
}

function migrateToV2(data: AnyBirthday[], format: DataFormat): V2Birthday[] {
  switch (format) {
    case "v1":
      return (data as V1Birthday[]).map((entry) => ({
        id: randomUUID(),
        name: entry.name,
        date: `${String(entry.month).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`,
      }))

    case "v1.5":
      return (data as V1_5Birthday[]).map((entry) => ({
        id: entry.id,
        name: entry.name,
        date: `${String(entry.month).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`,
      }))

    case "v2":
    case "empty":
    case "unknown":
      return data as V2Birthday[]
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

export interface MigrationResult {
  migrated: boolean
  format: DataFormat
  count: number
  backupPath?: string
}

export async function migrateIfNeeded(): Promise<MigrationResult> {
  if (!(await fileExists(DATA_PATH_JSON))) {
    return { migrated: false, format: "empty", count: 0 }
  }

  let raw: string

  try {
    raw = await readFile(DATA_PATH_JSON, "utf-8")
  } catch {
    return { migrated: false, format: "empty", count: 0 }
  }

  let data: AnyBirthday[]

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      console.error("[migrate] birthdays.json is not an array - skipping migration")

      return { migrated: false, format: "empty", count: 0 }
    }
    data = parsed as AnyBirthday[]
  } catch {
    console.error("[migrate] Failed to parse birthdays.json - skipping migration")

    return { migrated: false, format: "empty", count: 0 }
  }

  const format = detectFormat(data)

  if (format === "v2" || format === "empty") {
    return { migrated: false, format, count: data.length }
  }

  if (format === "unknown") {
    console.warn("[migrate] Unrecognized data format - skipping migration")

    return { migrated: false, format, count: data.length }
  }

  const backupPath = DATA_PATH_JSON.replace(".json", `.backup-${Date.now()}.json`)

  await copyFile(DATA_PATH_JSON, backupPath)
  console.log(`[migrate] Created backup: ${backupPath}`)

  const migrated = migrateToV2(data, format)

  await writeFile(DATA_PATH_JSON, JSON.stringify(migrated, null, 2))
  console.log(`[migrate] Migrated ${migrated.length} entries from ${format} to v2 format`)

  return {
    migrated: true,
    format,
    count: migrated.length,
    backupPath,
  }
}
