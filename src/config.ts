import "dotenv/config"
import { DateTime } from "luxon"

export interface Config {
  token: string;
  clientId: string;
  userId: string;
  timezone: string;
  bdnextCount: number;
  useEncryption: boolean;
}

function env(key: string): string {
  const val = process.env[key]

  if (val === undefined || val === "") {
    console.error(`Missing required env variable: ${key}`)
    process.exit(1)
  }

  return val
}

function validateTimezone(tz: string): string {
  const dt = DateTime.now().setZone(tz)

  if (!dt.isValid) {
    console.error(`Invalid timezone: ${tz}. Using UTC instead.`)

    return "UTC"
  }

  return tz
}

function createConfig(): Config {
  const rawTimezone = process.env.TIMEZONE ?? "UTC"
  const useEncryption = process.env.USE_ENCRYPTION?.toLowerCase() === "true"

  return {
    token: env("DISCORD_TOKEN"),
    clientId: env("DISCORD_CLIENT_ID"),
    userId: env("DISCORD_USER_ID"),
    timezone: validateTimezone(rawTimezone),
    bdnextCount: Math.min(25, Math.max(1, parseInt(process.env.BDNEXT_COUNT ?? "5", 10) || 5)),
    useEncryption,
  }
}

export const config: Config = createConfig()
