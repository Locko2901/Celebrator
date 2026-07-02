import { type EmbedBuilder } from "discord.js"
import { config } from "../config.js"
import {
  type Birthday,
  parseDate,
  getCurrentDateParts,
  isDateAfter,
  isDateBefore,
  daysBetween,
} from "../types.js"
import { MAX_EMBED_DESCRIPTION } from "../utils/constants.js"
import {
  Colors,
  Emoji,
  emptyListEmbed,
  formatListEntry,
  formatUpcomingEntry,
  formatMonthHeader,
  birthdayCount,
  listEmbed,
  groupByMonth,
} from "./embeds.js"

export function buildListEmbeds(birthdays: Birthday[]): EmbedBuilder[] {
  if (birthdays.length === 0) {
    return [emptyListEmbed("Birthday List", Emoji.cake)]
  }

  const { month: cm, day: cd } = getCurrentDateParts(config.timezone)

  let nextDate: string | null = null

  for (const b of birthdays) {
    const { month, day } = parseDate(b.date)

    if (isDateAfter(month, day, cm, cd)) {
      nextDate = b.date
      break
    }
  }
  nextDate ??= birthdays[0].date

  const byMonth = groupByMonth(birthdays, (b) => parseDate(b.date).month)

  const sections: string[] = []

  for (let m = 1; m <= 12; m++) {
    const group = byMonth.get(m)

    if (group === undefined) {
      continue
    }

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
    const sep = current === "" ? "" : "\n\n"

    if ((current + sep + section).length > MAX_EMBED_DESCRIPTION) {
      if (current !== "") {
        pages.push(current)
      }
      current = section
    } else {
      current += sep + section
    }
  }
  if (current !== "") {
    pages.push(current)
  }

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

interface UpcomingData {
  today: Birthday[]
  upcoming: Array<{ birthday: Birthday; daysUntil: number }>
}

function getUpcoming(sorted: Birthday[], timezone: string, bdnextCount: number): UpcomingData {
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

export function buildUpcomingEmbed(birthdays: Birthday[]): EmbedBuilder {
  if (birthdays.length === 0) {
    return emptyListEmbed("Upcoming Birthdays", Emoji.calendar)
  }

  const { today, upcoming } = getUpcoming(birthdays, config.timezone, config.bdnextCount)
  const lines: string[] = []

  const allEntries: Array<{
    month: number
    day: number
    names: string[]
    daysUntil: number
    isToday: boolean
  }> = []

  if (today.length > 0) {
    const { month, day } = parseDate(today[0].date)

    allEntries.push({ month, day, names: today.map((b) => b.name), daysUntil: 0, isToday: true })
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

  const byMonth = groupByMonth(allEntries, (e) => e.month)

  for (const [month, entries] of byMonth) {
    lines.push(formatMonthHeader(month))
    for (const { day, names, daysUntil, isToday } of entries) {
      lines.push(formatUpcomingEntry(day, names, daysUntil, isToday))
    }
  }

  if (lines.length === 0) {
    lines.push("*No upcoming birthdays found.*")
  }

  return listEmbed({
    color: today.length > 0 ? Colors.gold : Colors.primary,
    emoji: Emoji.calendar,
    title: "Upcoming Birthdays",
    description: lines.join("\n"),
    footer: birthdayCount(birthdays.length),
  })
}
