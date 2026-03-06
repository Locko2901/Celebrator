import "reflect-metadata"
import { dirname, importx } from "@discordx/importer"
import { Events, EmbedBuilder, IntentsBitField } from "discord.js"
import { Client } from "discordx"
import { DateTime } from "luxon"
import { config } from "./config.js"
import { scheduleAtMidnight } from "./services/Scheduler.js"
import { BirthdayService, initBirthdayCache } from "./services/BirthdayService.js"
import { initEncryption } from "./services/encryption/index.js"
import { type Birthday, matchesDate, parseDate } from "./types.js"
import { Colors, Emoji, prettyDate, formatNameList, pluralize } from "./ui/embeds.js"
import { migrateIfNeeded } from "./utils/migrate.js"

const client = new Client({
  intents: config.installMode === "guild" ? [IntentsBitField.Flags.GuildMembers] : [],
  silent: false,
  botGuilds: config.installMode === "guild" ? undefined : [],
})

async function initializeDM(bot: Client): Promise<void> {
  const maxAttempts = 12
  let attempts = 0

  const tryDM = async (): Promise<boolean> => {
    try {
      const user = await bot.users.fetch(config.userId)
      const dm = await user.createDM()

      const messages = await dm.messages.fetch({ limit: 1 })

      if (messages.size === 0) {
        const greeting = new EmbedBuilder()
          .setColor(Colors.primary)
          .setAuthor({ name: `${Emoji.party} ${bot.user?.displayName} is ready!` })
          .setDescription("You'll receive birthday reminders here – a week before, a day before, and on the day itself.")
          .setTimestamp()

        await dm.send({ embeds: [greeting] })
        console.log(`Greeting sent to ${user.tag}`)
      }

      console.log(`DM channel established with ${user.tag} (${dm.id})`)

      return true
    } catch {
      return false
    }
  }

  if (await tryDM()) {return}

  console.log("Could not establish DM channel - will retry every 5 seconds...")

  const interval = setInterval(async () => {
    attempts++

    if (await tryDM()) {
      clearInterval(interval)
    } else if (attempts >= maxAttempts) {
      clearInterval(interval)
      console.warn("Failed to establish DM channel after 1 minute. Reminders may not work until user interacts with the bot.")
    }
  }, 5000)
}

client.once(Events.ClientReady, async () => {
  await client.initApplicationCommands()
  console.log(`${client.user?.tag} is online. (${config.installMode} install mode)`)

  await initializeDM(client)

  if (config.timezone) {
    scheduleAtMidnight(config.timezone, remindBirthdays, client)
  } else {
    console.log("Timezone not configured - birthday reminders disabled.")
  }
})

client.on(Events.InteractionCreate, (interaction) => {
  client.executeInteraction(interaction)
})

async function remindBirthdays(bot: Client): Promise<void> {
  try {
    const { timezone, userId } = config
    const user = await bot.users.fetch(userId)
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

    if (todayList.length > 0) {
      const names = formatNameList(todayList.map(b => b.name))
      const embed = new EmbedBuilder()
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
        .setTimestamp()

      await user.send({ embeds: [embed] })
      console.log(`Today reminder sent for: ${todayList.map((b) => b.name).join(", ")}`)
    }

    if (tmrwList.length > 0) {
      const names = formatNameList(tmrwList.map(b => b.name))
      const embed = new EmbedBuilder()
        .setColor(Colors.birthday)
        .setAuthor({ name: `${Emoji.calendar} Tomorrow's ${pluralize(tmrwList.length, "Birthday")}` })
        .setDescription(
          tmrwList.length === 1
            ? `${names}'s birthday is tomorrow!`
            : `${names} have birthdays tomorrow!`,
        )
        .setTimestamp()

      await user.send({ embeds: [embed] })
      console.log(`Tomorrow reminder sent for: ${tmrwList.map((b) => b.name).join(", ")}`)
    }

    if (weekList.length > 0) {
      const names = formatNameList(weekList.map(b => b.name))
      const embed = new EmbedBuilder()
        .setColor(Colors.primary)
        .setAuthor({ name: `${Emoji.reminder} ${pluralize(weekList.length, "Birthday")} in a Week` })
        .setDescription(
          weekList.length === 1
            ? `Heads up – ${names}'s birthday is in a week!`
            : `Heads up – ${names} have birthdays in a week!`,
        )
        .setTimestamp()

      await user.send({ embeds: [embed] })
      console.log(`Week reminder sent for: ${weekList.map((b) => b.name).join(", ")}`)
    }
  } catch (error) {
    console.error("Failed to execute remindBirthdays:", error)
  }
}

try {
  await migrateIfNeeded()
  const { key, dataPath } = await initEncryption()

  initBirthdayCache(dataPath, key)

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
