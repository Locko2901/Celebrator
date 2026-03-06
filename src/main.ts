import "reflect-metadata"
import { dirname, importx } from "@discordx/importer"
import { Events, IntentsBitField, EmbedBuilder } from "discord.js"
import { Client } from "discordx"
import { DateTime } from "luxon"
import { config } from "./config.js"
import { scheduleAtMidnight } from "./services/Scheduler.js"
import { BirthdayService } from "./services/BirthdayService.js"
import { type Birthday, matchesDate, parseDate } from "./types.js"
import { Colors, Emoji, prettyDate, formatNameList, pluralize } from "./ui/embeds.js"
import { migrateIfNeeded } from "./utils/migrate.js"

const client = new Client({
  intents: [IntentsBitField.Flags.GuildMembers],
  silent: false,
})

client.once(Events.ClientReady, async () => {
  await client.initApplicationCommands()
  console.log(`${client.user?.tag} is online.`)

  if (config.timezone) {
    scheduleAtMidnight(config.timezone, remindBirthdays, client)
  } else {
    console.log("Timezone not configured – birthday reminders disabled.")
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
