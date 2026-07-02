import { Discord, Slash } from "discordx"
import { type CommandInteraction } from "discord.js"
import { DashboardService } from "../services/DashboardService.js"
import { Colors, Emoji, commandEmbed, handleCommandError, replyEphemeral } from "../ui/embeds.js"
import { slashOptions } from "../utils/slashConfig.js"

@Discord()
export class BdNext {
  @Slash({
    name: "bdnext",
    description: "Refresh the upcoming birthdays message",
    ...slashOptions,
  })
  async next(interaction: CommandInteraction): Promise<void> {
    try {
      await DashboardService.renderUpcoming(interaction.client)
      await replyEphemeral(
        interaction,
        commandEmbed({
          color: Colors.success,
          emoji: Emoji.check,
          title: "Upcoming Updated",
          description: "The upcoming birthdays message has been refreshed in your DMs.",
        }),
      )
    } catch (error) {
      await handleCommandError(interaction, "loading upcoming birthdays", error)
    }
  }
}
