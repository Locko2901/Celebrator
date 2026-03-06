import type { CommandInteraction } from "discord.js"
import { type Birthday, isValidDate } from "../types.js"
import { BirthdayService } from "../services/BirthdayService.js"
import { warningEmbed, errorEmbed, replyEphemeral, Messages } from "../ui/embeds.js"
import { DISCORD_EMOJI_RE } from "./constants.js"

export async function validateDate(
  date: string,
  interaction: CommandInteraction,
): Promise<boolean> {
  if (!isValidDate(date)) {
    await replyEphemeral(interaction, warningEmbed(Messages.invalidDateFormat))

    return false
  }

  return true
}

export async function validateName(
  name: string,
  interaction: CommandInteraction,
): Promise<boolean> {
  const trimmed = name.trim()

  if (trimmed.length === 0) {
    await replyEphemeral(interaction, warningEmbed("Name cannot be empty or whitespace-only."))

    return false
  }

  if (DISCORD_EMOJI_RE.test(name)) {
    await replyEphemeral(interaction, warningEmbed(Messages.noEmojiInName))

    return false
  }

  return true
}

export async function requireBirthday(
  id: string,
  interaction: CommandInteraction,
): Promise<Birthday | null> {
  const existing = await BirthdayService.findById(id)

  if (!existing) {
    await replyEphemeral(interaction, errorEmbed(Messages.birthdayNotFound))

    return null
  }

  return existing
}
