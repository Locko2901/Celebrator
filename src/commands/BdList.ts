import { Discord, Slash } from "discordx"
import { type CommandInteraction, type EmbedBuilder } from "discord.js"
import { BirthdayService } from "../services/BirthdayService.js"
import { type Birthday, parseDate, getCurrentDateParts, isDateAfter } from "../types.js"
import { config } from "../config.js"
import {
  Colors, Emoji,
  emptyListEmbed, formatListEntry, formatMonthHeader, birthdayCount, handleCommandError, listEmbed, groupByMonth,
} from "../ui/embeds.js"
import { MAX_EMBED_DESCRIPTION, MAX_EMBEDS_PER_MESSAGE } from "../utils/constants.js"

@Discord()
export class BdList {
  @Slash({ name: "bdlist", description: "List all birthdays" })
  async list(interaction: CommandInteraction): Promise<void> {
    try {
      const birthdays = await BirthdayService.sorted()

      if (birthdays.length === 0) {
        await interaction.reply({ embeds: [emptyListEmbed("Birthday List", Emoji.cake)] })

        return
      }

      const embeds = this.buildEmbeds(birthdays)

      await interaction.reply({ embeds: embeds.slice(0, MAX_EMBEDS_PER_MESSAGE) })
      for (let i = MAX_EMBEDS_PER_MESSAGE; i < embeds.length; i += MAX_EMBEDS_PER_MESSAGE) {
        await interaction.followUp({ embeds: embeds.slice(i, i + MAX_EMBEDS_PER_MESSAGE) })
      }
    } catch (error) {
      await handleCommandError(interaction, "loading birthdays", error)
    }
  }

  private buildEmbeds(birthdays: Birthday[]): EmbedBuilder[] {
    const { month: cm, day: cd } = getCurrentDateParts(config.timezone)

    let nextDate: string | null = null

    for (const b of birthdays) {
      const { month, day } = parseDate(b.date)

      if (isDateAfter(month, day, cm, cd)) {
        nextDate = b.date
        break
      }
    }
    if (nextDate === null && birthdays.length > 0) {
      nextDate = birthdays[0].date
    }

    const byMonth = groupByMonth(birthdays, b => parseDate(b.date).month)

    const sections: string[] = []

    for (let m = 1; m <= 12; m++) {
      const group = byMonth.get(m)

      if (!group) {continue}

      const monthLines: string[] = [formatMonthHeader(m)]

      for (const b of group) {
        const { day } = parseDate(b.date)
        const isNext = b.date === nextDate

        monthLines.push(formatListEntry(day, b.name, isNext))
      }

      sections.push(monthLines.join("\n"))
    }

    const footerText = birthdayCount(birthdays.length)

    const pages: string[] = []
    let current = ""

    for (const section of sections) {
      const sep = current ? "\n\n" : ""

      if ((current + sep + section).length > MAX_EMBED_DESCRIPTION) {
        if (current) {pages.push(current)}
        current = section
      } else {
        current += sep + section
      }
    }
    if (current) {pages.push(current)}

    return pages.map((content, i) => {
      const isFirst = i === 0
      const isLast = i === pages.length - 1

      return listEmbed({
        color: Colors.primary,
        emoji: isFirst ? Emoji.cake : "",
        title: isFirst ? "Birthday List" : "",
        description: content,
        footer: isLast ? footerText : undefined,
      })
    })
  }
}
