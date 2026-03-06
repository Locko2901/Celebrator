import { Discord, Slash, SlashOption } from "discordx"
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
} from "discord.js"
import { Colors, Emoji, prettyDateFromString, commandEmbed } from "../ui/embeds.js"
import { nameAutocomplete } from "../utils/autocomplete.js"
import { requireBirthday } from "../utils/validation.js"

@Discord()
export class BdCheck {
  @Slash({ name: "bdcheck", description: "Check someone's birthday date" })
  async check(
    @SlashOption({
      name: "name",
      description: "Name of the person to check",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: nameAutocomplete,
    })
    id: string,

    interaction: CommandInteraction,
  ): Promise<void> {
    const existing = await requireBirthday(id, interaction)

    if (!existing) {return}

    const embed = commandEmbed({
      color: Colors.birthday,
      emoji: Emoji.calendar,
      title: "Birthday Check",
      description: `**${existing.name}**'s birthday is on **${prettyDateFromString(existing.date)}**.`,
    })

    await interaction.reply({ embeds: [embed] })
  }
}
