import type { AutocompleteInteraction } from "discord.js"
import { BirthdayService } from "../services/BirthdayService.js"
import { AUTOCOMPLETE_MAX_RESULTS, MAX_NAME_LENGTH } from "./constants.js"

export async function nameAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  try {
    const focused = interaction.options.getFocused().toLowerCase()
    const birthdays = await BirthdayService.read()

    const startsWithMatches: typeof birthdays = []
    const includesMatches: typeof birthdays = []

    for (const b of birthdays) {
      const nameLower = b.name.toLowerCase()

      if (nameLower.startsWith(focused)) {
        startsWithMatches.push(b)
      } else if (nameLower.includes(focused)) {
        includesMatches.push(b)
      }
    }

    const results = [...startsWithMatches, ...includesMatches]
      .slice(0, AUTOCOMPLETE_MAX_RESULTS)
      .map((b) => ({ name: b.name.slice(0, MAX_NAME_LENGTH), value: b.id }))

    await interaction.respond(results)
  } catch (error) {
    console.error("Autocomplete failed:", error)
    await interaction.respond([])
  }
}
