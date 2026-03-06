import { Discord, Slash, SlashOption } from "discordx"
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
} from "discord.js"
import { BirthdayService, DuplicateNameError } from "../services/BirthdayService.js"
import { userInputToDate } from "../types.js"
import {
  Colors, Emoji, prettyDateFromString, birthdayCount, formatNameList, handleCommandError, commandEmbed, warningEmbed, replyEphemeral,
} from "../ui/embeds.js"
import { MAX_NAME_LENGTH } from "../utils/constants.js"
import { validateName, validateDate } from "../utils/validation.js"
import { slashOptions } from "../utils/slashConfig.js"

@Discord()
export class BdAdd {
  @Slash({
    name: "bdadd",
    description: "Add a birthday",
    ...slashOptions,
  })
  async add(
    @SlashOption({
      name: "name",
      description: "Name of the person",
      required: true,
      type: ApplicationCommandOptionType.String,
      maxLength: MAX_NAME_LENGTH,
    })
    name: string,

    @SlashOption({
      name: "date",
      description: "Birthday date (DD/MM)",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    date: string,

    interaction: CommandInteraction,
  ): Promise<void> {
    const trimmedName = name.trim()

    if (!await validateName(trimmedName, interaction)) {return}
    if (!await validateDate(date, interaction)) {return}

    try {
      const { birthday: bd, count, sameDay } = await BirthdayService.add({ name: trimmedName, date: userInputToDate(date) })

      const embed = commandEmbed({
        color: Colors.success,
        emoji: Emoji.cake,
        title: "Birthday Added",
        description: `**${bd.name}**'s birthday has been saved!`,
        footer: birthdayCount(count),
      }).addFields(
        { name: "Date", value: prettyDateFromString(bd.date), inline: true },
      )

      if (sameDay.length > 0) {
        const names = formatNameList(sameDay.map(b => b.name))

        embed.addFields({
          name: "Same Day",
          value: `${names} also ha${sameDay.length === 1 ? "s" : "ve"} a birthday on this date!`,
          inline: false,
        })
      }

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      if (error instanceof DuplicateNameError) {
        await replyEphemeral(interaction, warningEmbed(`A birthday entry for **${error.name}** already exists.`))

        return
      }
      await handleCommandError(interaction, "adding the birthday", error)
    }
  }
}
