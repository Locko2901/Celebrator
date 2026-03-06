import { DateTime } from "luxon"
import type { Client } from "discordx"

type TaskFn = (client: Client) => void | Promise<void>;

export function scheduleAtMidnight(
  timezone: string,
  task: TaskFn,
  client: Client,
): void {
  const now = DateTime.now().setZone(timezone)
  const nextMidnight = now.plus({ days: 1 }).startOf("day")
  const ms = nextMidnight.diff(now).toMillis()

  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.round((ms % 60_000) / 1_000)

  console.log(
    `[${now.toFormat("FFF")}] Next task at ${nextMidnight.toFormat("FFF")}`,
  )
  console.log(`Wait: ${h}h ${m}m ${s}s`)

  setTimeout(async () => {
    console.log(
      `[${DateTime.now().setZone(timezone).toFormat("FFF")}] Running scheduled task`,
    )
    try {
      await task(client)
    } catch (error) {
      console.error("Scheduled task failed:", error)
    }
    scheduleAtMidnight(timezone, task, client)
  }, ms)
}
