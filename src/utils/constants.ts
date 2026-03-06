import { join } from "path"

export const DISCORD_EMOJI_RE = /<a?:\w+:\d+>/

export const DATA_PATH = join(process.cwd(), "data", "birthdays.json")

export const MAX_NAME_LENGTH = 100

export const AUTOCOMPLETE_MAX_RESULTS = 25

export const MAX_EMBED_DESCRIPTION = 4000

export const MAX_EMBEDS_PER_MESSAGE = 10
