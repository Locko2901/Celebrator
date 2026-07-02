import { Discord, Slash } from "discordx"
import { type CommandInteraction } from "discord.js"
import { DashboardService } from "../services/DashboardService.js"
import { Colors, Emoji, commandEmbed, handleCommandError, replyEphemeral } from "../ui/embeds.js"
import { slashOptions } from "../utils/slashConfig.js"

@Discord()
export class BdList {
  @Slash({
    name: "bdlist",
    description: "Refresh the birthday list message",
    ...slashOptions,
  })
  async list(interaction: CommandInteraction): Promise<void> {
    try {
      await DashboardService.renderList(interaction.client)
      await replyEphemeral(
        interaction,
        commandEmbed({
          color: Colors.success,
          emoji: Emoji.check,
          title: "List Updated",
          description: "The birthday list message has been refreshed in your DMs.",
        }),
      )
    } catch (error) {
      await handleCommandError(interaction, "loading birthdays", error)
    }
  }
}
