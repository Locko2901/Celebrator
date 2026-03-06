import { Discord, Slash, SlashOption } from "discordx"
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
} from "discord.js"
import { BirthdayService, DuplicateNameError } from "../services/BirthdayService.js"
import { userInputToDate, parseDate } from "../types.js"
import { Colors, Emoji, prettyDate, warningEmbed, replyEphemeral, handleCommandError, commandEmbed, birthdayCount } from "../ui/embeds.js"
import { MAX_NAME_LENGTH } from "../utils/constants.js"
import { nameAutocomplete } from "../utils/autocomplete.js"
import { requireBirthday, validateName, validateDate } from "../utils/validation.js"

@Discord()
export class BdEdit {
  @Slash({ name: "bdedit", description: "Edit a birthday" })
  async edit(
    @SlashOption({
      name: "name",
      description: "Name of the person to edit",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: nameAutocomplete,
    })
    id: string,

    @SlashOption({
      name: "new_name",
      description: "New name for the person",
      required: false,
      type: ApplicationCommandOptionType.String,
      maxLength: MAX_NAME_LENGTH,
    })
    newName: string | undefined,

    @SlashOption({
      name: "date",
      description: "New birthday date (DD/MM)",
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    date: string | undefined,

    interaction: CommandInteraction,
  ): Promise<void> {
    if (newName === undefined && date === undefined) {
      await replyEphemeral(
        interaction,
        warningEmbed("Provide at least a **new name** or a **new date** to update."),
      )

      return
    }

    const existing = await requireBirthday(id, interaction)

    if (!existing) {return}

    const updates: Partial<{ name: string; date: string }> = {}
    const changes: string[] = []

    if (date !== undefined) {
      if (!await validateDate(date, interaction)) {return}
      const newDate = userInputToDate(date)
      const oldParsed = parseDate(existing.date)
      const newParsed = parseDate(newDate)

      changes.push(
        `**Date:** ${prettyDate(oldParsed.month, oldParsed.day)} \u2192 ${prettyDate(newParsed.month, newParsed.day)}`,
      )
      updates.date = newDate
    }

    if (newName !== undefined) {
      if (!await validateName(newName, interaction)) {return}
      changes.push(`**Name:** ${existing.name} \u2192 ${newName.trim()}`)
      updates.name = newName.trim()
    }

    try {
      const { count } = await BirthdayService.update(id, updates)

      const embed = commandEmbed({
        color: Colors.success,
        emoji: Emoji.pencil,
        title: "Birthday Updated",
        description: changes.join("\n"),
        footer: birthdayCount(count),
      })

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      if (error instanceof DuplicateNameError) {
        await replyEphemeral(interaction, warningEmbed(`A birthday entry for **${error.name}** already exists.`))

        return
      }
      await handleCommandError(interaction, "editing the birthday", error)
    }
  }
}
