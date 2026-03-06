import { EmbedBuilder, MessageFlags, type CommandInteraction } from "discord.js"
import { parseDate } from "../types.js"

export const Colors = {
  primary: 0x9b59b6, // soft purple
  success: 0x2ecc71, // green
  warning: 0xf39c12, // amber
  error: 0xe74c3c, // red
  removal: 0x95a5a6, // neutral gray
  birthday: 0xffc0cb, // pink
  gold: 0xf1c40f, // gold
} as const

export const Emoji = {
  cake:        "🎂",
  party:       "🎉",
  calendar:    "📅",
  check:       "✅",
  cross:       "❌",
  warning:     "⚠️",
  pencil:      "✏️",
  wastebasket: "🗑️",
  reminder:    "🔔",
} as const

export const WS = {
  emSpace: "\u2003", 
  indent:  "\u2003\u2003",
} as const

export const Sym = {
  arrow: "▸", // highlight marker for special entries
  dash:  "–", // en-dash for separators
} as const

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export const MONTH_EMOJIS = [
  "❄️", "💕", "🌸", "🌧️", "🌺", "☀️",
  "🏖️", "🌻", "🍂", "🎃", "🍁", "🎄",
]

export const Messages = {
  birthdayNotFound: "Birthday not found.",
  noBirthdaysYet: "*No birthdays tracked yet.*\nUse `/bdadd` to get started!",
  invalidDateFormat: "Invalid date format – please use **DD/MM**.",
  noEmojiInName: "Names can't contain Discord emoji markup.",
} as const

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

export function birthdayCount(count: number, suffix = "tracked"): string {
  return `${count} ${pluralize(count, "birthday")} ${suffix}`
}

export function formatNameList(names: string[]): string {
  return names.map((n) => `**${n}**`).join(", ")
}

export function formatMonthHeader(month: number): string {
  return `${MONTH_EMOJIS[month - 1]} **${MONTH_NAMES[month - 1]}**`
}

export function groupByMonth<T>(items: T[], getMonth: (item: T) => number): Map<number, T[]> {
  const byMonth = new Map<number, T[]>()

  for (const item of items) {
    const month = getMonth(item)
    const list = byMonth.get(month) ?? []

    list.push(item)
    byMonth.set(month, list)
  }

  return byMonth
}

export function errorEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.error)
    .setAuthor({ name: `${Emoji.cross} Error` })
    .setDescription(description)
    .setTimestamp()
}

export async function replyEphemeral(
  interaction: CommandInteraction,
  embed: EmbedBuilder,
): Promise<void> {
  await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] })
}

export async function handleCommandError(
  interaction: CommandInteraction,
  action: string,
  error: unknown,
): Promise<void> {
  console.error(`Error ${action}:`, error)
  const embed = errorEmbed(`Something went wrong while ${action}.`)

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral })
  } else {
    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] })
  }
}

export function warningEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.warning)
    .setAuthor({ name: `${Emoji.warning} Warning` })
    .setDescription(description)
    .setTimestamp()
}

export function emptyListEmbed(title: string, emoji: string = Emoji.cake): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.primary)
    .setAuthor({ name: `${emoji} ${title}` })
    .setDescription(Messages.noBirthdaysYet)
    .setTimestamp()
}

export function ordinal(day: number): string {
  if (day >= 11 && day <= 13) {return `${day}th`}
  switch (day % 10) {
    case 1:  return `${day}st`
    case 2:  return `${day}nd`
    case 3:  return `${day}rd`
    default: return `${day}th`
  }
}

export function prettyDate(month: number, day: number): string {
  return `${MONTH_NAMES[month - 1]} ${ordinal(day)}`
}

export function prettyDateFromString(dateStr: string): string {
  const { month, day } = parseDate(dateStr)

  return prettyDate(month, day)
}

export function commandEmbed(options: {
  color: number
  emoji: string
  title: string
  description: string
  footer?: string
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(options.color)
    .setAuthor({ name: `${options.emoji} ${options.title}` })
    .setDescription(options.description)
    .setTimestamp()

  if (options.footer !== undefined) {
    embed.setFooter({ text: options.footer })
  }

  return embed
}

export function listEmbed(options: {
  color: number
  emoji?: string
  title?: string
  description: string
  footer?: string
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(options.color)
    .setDescription(options.description)
    .setTimestamp()

  const authorName = [options.emoji, options.title].filter(Boolean).join(" ")

  if (authorName !== "") {
    embed.setAuthor({ name: authorName })
  }

  if (options.footer !== undefined) {
    embed.setFooter({ text: options.footer })
  }

  return embed
}

export function formatListEntry(day: number, name: string, highlight = false): string {
  const dayStr = ordinal(day).padStart(5)

  if (highlight) {
    return `${WS.indent}${Sym.arrow} \`${dayStr}\` ${Sym.dash} **${name}**`
  }

  return `${WS.indent}\`${dayStr}\` ${Sym.dash} ${name}`
}

export function formatUpcomingEntry(
  day: number,
  names: string[],
  daysUntil: number,
  isToday = false,
): string {
  const dayStr = ordinal(day).padStart(5)
  const nameList = formatNameList(names)

  if (isToday) {
    return `${WS.indent}${Sym.arrow} \`${dayStr}\` ${Sym.dash} ${nameList} ${Sym.dash} *today!*`
  }

  const daysLabel = daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`

  return `${WS.indent}\`${dayStr}\` ${Sym.dash} ${nameList} ${Sym.dash} *${daysLabel}*`
}
