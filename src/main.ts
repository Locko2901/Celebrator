import "reflect-metadata"
import { dirname, importx } from "@discordx/importer"
import { Events, EmbedBuilder, IntentsBitField } from "discord.js"
import { Client } from "discordx"
import { DateTime } from "luxon"
import { config } from "./config.js"
import { scheduleAtMidnight } from "./services/Scheduler.js"
import { BirthdayService, initBirthdayCache } from "./services/BirthdayService.js"
import { DashboardService, initDashboardCache } from "./services/DashboardService.js"
import { initEncryption } from "./services/encryption/index.js"
import { type Birthday, matchesDate, parseDate } from "./types.js"
import { Colors, Emoji, prettyDate, formatNameList, pluralize } from "./ui/embeds.js"
import { DASHBOARD_PATH_JSON } from "./utils/constants.js"
import { migrateIfNeeded } from "./utils/migrate.js"

const client = new Client({
  intents: config.installMode === "guild" ? [IntentsBitField.Flags.GuildMembers] : [],
  silent: false,
  botGuilds: config.installMode === "guild" ? undefined : [],
})

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function establishDM(bot: Client): Promise<boolean> {
  const maxAttempts = 12

  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      const user = await bot.users.fetch(config.userId)
      const dm = await user.createDM()

      await dm.messages.fetch({ limit: 1 })
      console.log(`DM channel established with ${user.tag} (${dm.id})`)

      return true
    } catch {
      if (attempt < maxAttempts) {
        await delay(5000)
      }
    }
  }

  return false
}

async function bootstrapDashboard(bot: Client): Promise<void> {
  const established = await establishDM(bot)

  if (!established) {
    console.warn(
      "Failed to establish DM channel after 1 minute. Reminders may not work until user interacts with the bot.",
    )

    return
  }

  await DashboardService.prune(bot)
  await DashboardService.refresh(bot)
}

client.once(Events.ClientReady, async () => {
  await client.initApplicationCommands()
  console.log(`${client.user?.tag} is online. (${config.installMode} install mode)`)

  bootstrapDashboard(client).catch((error: unknown) => {
    console.error("Failed to bootstrap dashboard:", error)
  })

  if (config.timezone) {
    scheduleAtMidnight(config.timezone, nightlyTask, client)
  } else {
    console.log("Timezone not configured - birthday reminders disabled.")
  }
})

client.on(Events.InteractionCreate, (interaction) => {
  client.executeInteraction(interaction)
})

async function nightlyTask(bot: Client): Promise<void> {
  await remindBirthdays(bot)
  await DashboardService.refresh(bot)
}

async function remindBirthdays(bot: Client): Promise<void> {
  try {
    const { timezone } = config
    const now = DateTime.now().setZone(timezone)

    let birthdays: Birthday[]

    try {
      birthdays = await BirthdayService.read()
    } catch (error) {
      console.error("Failed to read birthdays.json:", error)

      return
    }

    const todayList = birthdays.filter((b) => matchesDate(b, now))
    const tomorrow = now.plus({ days: 1 })
    const tmrwList = birthdays.filter((b) => matchesDate(b, tomorrow))
    const week = now.plus({ days: 7 })
    const weekList = birthdays.filter((b) => matchesDate(b, week))

    const embeds: EmbedBuilder[] = []

    if (todayList.length > 0) {
      const names = formatNameList(todayList.map((b) => b.name))

      embeds.push(
        new EmbedBuilder()
          .setColor(Colors.gold)
          .setAuthor({ name: `${Emoji.party} Happy Birthday!` })
          .setDescription(
            todayList.length === 1
              ? `Today is ${names}'s birthday!`
              : `Today is ${names}' birthdays!`,
          )
          .addFields(
            ...todayList.map((b) => {
              const { month, day } = parseDate(b.date)

              return { name: b.name, value: prettyDate(month, day), inline: true }
            }),
          )
          .setTimestamp(),
      )
    }

    if (tmrwList.length > 0) {
      const names = formatNameList(tmrwList.map((b) => b.name))

      embeds.push(
        new EmbedBuilder()
          .setColor(Colors.birthday)
          .setAuthor({ name: `${Emoji.calendar} Tomorrow's ${pluralize(tmrwList.length, "Birthday")}` })
          .setDescription(
            tmrwList.length === 1
              ? `${names}'s birthday is tomorrow!`
              : `${names} have birthdays tomorrow!`,
          )
          .setTimestamp(),
      )
    }

    if (weekList.length > 0) {
      const names = formatNameList(weekList.map((b) => b.name))

      embeds.push(
        new EmbedBuilder()
          .setColor(Colors.primary)
          .setAuthor({ name: `${Emoji.reminder} ${pluralize(weekList.length, "Birthday")} in a Week` })
          .setDescription(
            weekList.length === 1
              ? `Heads up – ${names}'s birthday is in a week!`
              : `Heads up – ${names} have birthdays in a week!`,
          )
          .setTimestamp(),
      )
    }

    await DashboardService.sendReminders(bot, embeds)

    if (embeds.length > 0) {
      console.log(
        `Reminders sent (today: ${todayList.length}, tomorrow: ${tmrwList.length}, week: ${weekList.length})`,
      )
    }
  } catch (error) {
    console.error("Failed to execute remindBirthdays:", error)
  }
}

try {
  await migrateIfNeeded()
  const { key, dataPath } = await initEncryption()

  initBirthdayCache(dataPath, key)
  initDashboardCache(DASHBOARD_PATH_JSON, key)

  await importx(`${dirname(import.meta.url)}/commands/**/*.{js,ts}`)
  await client.login(config.token)
} catch (error) {
  console.error("Failed to start bot:", error)
  process.exit(1)
}

function shutdown(signal: string): void {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`)
  void client.destroy()
  process.exit(0)
}

process.on("SIGINT", () => { shutdown("SIGINT") })
process.on("SIGTERM", () => { shutdown("SIGTERM") })
