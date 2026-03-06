import { ApplicationIntegrationType, InteractionContextType } from "discord.js"
import { config } from "../config.js"

export const slashOptions = config.installMode === "user"
  ? {
      integrationTypes: [ApplicationIntegrationType.UserInstall],
      contexts: [InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
    }
  : {
      integrationTypes: [ApplicationIntegrationType.GuildInstall],
      contexts: [InteractionContextType.Guild, InteractionContextType.BotDM],
    }
