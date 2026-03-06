import { Discord, Slash, SlashOption } from "discordx"
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
} from "discord.js"
import { BirthdayService } from "../services/BirthdayService.js"
import { Colors, Emoji, prettyDateFromString, birthdayCount, handleCommandError, commandEmbed } from "../ui/embeds.js"
import { nameAutocomplete } from "../utils/autocomplete.js"
import { requireBirthday } from "../utils/validation.js"
import { slashOptions } from "../utils/slashConfig.js"

@Discord()
export class BdRemove {
  @Slash({
    name: "bdremove",
    description: "Remove a birthday",
    ...slashOptions,
  })
  async remove(
    @SlashOption({
      name: "name",
      description: "Name of the person to remove",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: nameAutocomplete,
    })
    id: string,

    interaction: CommandInteraction,
  ): Promise<void> {
    const existing = await requireBirthday(id, interaction)

    if (!existing) {return}

    try {
      const { count } = await BirthdayService.remove(id)

      const embed = commandEmbed({
        color: Colors.removal,
        emoji: Emoji.wastebasket,
        title: "Birthday Removed",
        description: `**${existing.name}**'s birthday (${prettyDateFromString(existing.date)}) has been removed.`,
        footer: birthdayCount(count, "remaining"),
      })

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      await handleCommandError(interaction, "removing the birthday", error)
    }
  }
}
