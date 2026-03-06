import { Discord, Slash } from "discordx"
import { type CommandInteraction, type EmbedBuilder } from "discord.js"
import { BirthdayService } from "../services/BirthdayService.js"
import { type Birthday, parseDate, getCurrentDateParts, isDateAfter, isDateBefore, daysBetween } from "../types.js"
import { config } from "../config.js"
import {
  Colors, Emoji, emptyListEmbed, formatUpcomingEntry, formatMonthHeader, birthdayCount, handleCommandError, listEmbed, groupByMonth,
} from "../ui/embeds.js"

@Discord()
export class BdNext {
  @Slash({ name: "bdnext", description: "Show the next upcoming birthdays" })
  async next(interaction: CommandInteraction): Promise<void> {
    try {
      const birthdays = await BirthdayService.sorted()

      if (birthdays.length === 0) {
        await interaction.reply({ embeds: [emptyListEmbed("Upcoming Birthdays", Emoji.calendar)] })

        return
      }

      const upcoming = this.getUpcoming(birthdays, config.timezone, config.bdnextCount)
      const embed = await this.buildEmbed(upcoming)

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      await handleCommandError(interaction, "loading upcoming birthdays", error)
    }
  }

  private getUpcoming(sorted: Birthday[], timezone: string, bdnextCount: number): {
    today: Birthday[]
    upcoming: Array<{ birthday: Birthday; daysUntil: number }>
  } {
    const { now, month: cm, day: cd } = getCurrentDateParts(timezone)

    const today: Birthday[] = []
    const future: Array<{ birthday: Birthday; daysUntil: number }> = []

    for (const b of sorted) {
      const { month, day } = parseDate(b.date)

      if (month === cm && day === cd) {
        today.push(b)
      } else if (isDateAfter(month, day, cm, cd)) {
        future.push({ birthday: b, daysUntil: daysBetween(now, month, day) })
      }
    }

    for (const b of sorted) {
      const { month, day } = parseDate(b.date)

      if (isDateBefore(month, day, cm, cd)) {
        future.push({ birthday: b, daysUntil: daysBetween(now, month, day) })
      }
    }

    return { today, upcoming: future.slice(0, bdnextCount) }
  }

  private async buildEmbed(data: {
    today: Birthday[]
    upcoming: Array<{ birthday: Birthday; daysUntil: number }>
  }): Promise<EmbedBuilder> {
    const { today, upcoming } = data
    const lines: string[] = []

    const allEntries: Array<{ month: number; day: number; names: string[]; daysUntil: number; isToday: boolean }> = []

    if (today.length > 0) {
      const { month, day } = parseDate(today[0].date)

      allEntries.push({ month, day, names: today.map(b => b.name), daysUntil: 0, isToday: true })
    }

    const groups = new Map<string, { month: number; day: number; daysUntil: number; names: string[] }>()

    for (const { birthday: b, daysUntil } of upcoming) {
      const { month, day } = parseDate(b.date)
      const existing = groups.get(b.date)

      if (existing) {
        existing.names.push(b.name)
      } else {
        groups.set(b.date, { month, day, daysUntil, names: [b.name] })
      }
    }

    for (const { month, day, daysUntil, names } of groups.values()) {
      allEntries.push({ month, day, names, daysUntil, isToday: false })
    }

    const byMonth = groupByMonth(allEntries, e => e.month)

    for (const [month, entries] of byMonth) {
      lines.push(formatMonthHeader(month))
      for (const { day, names, daysUntil, isToday } of entries) {
        lines.push(formatUpcomingEntry(day, names, daysUntil, isToday))
      }
    }

    if (lines.length === 0) {
      lines.push("*No upcoming birthdays found.*")
    }

    const count = await BirthdayService.count()

    return listEmbed({
      color: today.length > 0 ? Colors.gold : Colors.primary,
      emoji: Emoji.calendar,
      title: "Upcoming Birthdays",
      description: lines.join("\n"),
      footer: birthdayCount(count),
    })
  }
}
