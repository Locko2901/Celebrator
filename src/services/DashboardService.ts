import type { Client, DMChannel, EmbedBuilder } from "discord.js"

import { config } from "../config.js"
import { MAX_EMBEDS_PER_MESSAGE } from "../utils/constants.js"
import { buildListEmbeds, buildUpcomingEmbed } from "../ui/views.js"
import { BirthdayService } from "./BirthdayService.js"
import { JsonCache } from "./JsonCache.js"

interface DashboardState {
  listMessageId: string | null
  upcomingMessageId: string | null
  reminderMessageIds: string[]
}

const DEFAULT_STATE: DashboardState = {
  listMessageId: null,
  upcomingMessageId: null,
  reminderMessageIds: [],
}

let dashboardCache: JsonCache<DashboardState> | null = null

function getCache(): JsonCache<DashboardState> {
  dashboardCache ??= new JsonCache<DashboardState>("data/dashboard.json", DEFAULT_STATE, null)

  return dashboardCache
}

export function initDashboardCache(dataPath: string, encryptionKey: string | null): void {
  dashboardCache = new JsonCache<DashboardState>(dataPath, DEFAULT_STATE, encryptionKey)
}

async function resolveDM(client: Client): Promise<DMChannel | null> {
  try {
    const user = await client.users.fetch(config.userId)

    return await user.createDM()
  } catch (error) {
    console.error("Failed to resolve DM channel:", error)

    return null
  }
}

async function editOrCreate(
  dm: DMChannel,
  messageId: string | null,
  embeds: EmbedBuilder[],
): Promise<string> {
  if (messageId !== null) {
    try {
      const message = await dm.messages.fetch(messageId)

      await message.edit({ embeds })

      return messageId
    } catch {
      // message was deleted or is unreachable
    }
  }

  const message = await dm.send({ embeds })

  return message.id
}

async function deleteMessages(dm: DMChannel, ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      const message = await dm.messages.fetch(id)

      await message.delete()
    } catch {
      // already gone
    }
  }
}

export class DashboardService {
  static async refresh(client: Client): Promise<void> {
    const dm = await resolveDM(client)

    if (dm === null) {
      return
    }

    const birthdays = await BirthdayService.sorted()

    await getCache().update(async (state) => {
      const listId = await editOrCreate(
        dm,
        state.listMessageId,
        buildListEmbeds(birthdays).slice(0, MAX_EMBEDS_PER_MESSAGE),
      )
      const upcomingId = await editOrCreate(dm, state.upcomingMessageId, [buildUpcomingEmbed(birthdays)])

      return { ...state, listMessageId: listId, upcomingMessageId: upcomingId }
    })
  }

  static async renderList(client: Client): Promise<void> {
    const dm = await resolveDM(client)

    if (dm === null) {
      return
    }

    const birthdays = await BirthdayService.sorted()

    await getCache().update(async (state) => {
      const listId = await editOrCreate(
        dm,
        state.listMessageId,
        buildListEmbeds(birthdays).slice(0, MAX_EMBEDS_PER_MESSAGE),
      )

      return { ...state, listMessageId: listId }
    })
  }

  static async renderUpcoming(client: Client): Promise<void> {
    const dm = await resolveDM(client)

    if (dm === null) {
      return
    }

    const birthdays = await BirthdayService.sorted()

    await getCache().update(async (state) => {
      const upcomingId = await editOrCreate(dm, state.upcomingMessageId, [buildUpcomingEmbed(birthdays)])

      return { ...state, upcomingMessageId: upcomingId }
    })
  }

  static async sendReminders(client: Client, embeds: EmbedBuilder[]): Promise<void> {
    const dm = await resolveDM(client)

    if (dm === null) {
      return
    }

    await getCache().update(async (state) => {
      await deleteMessages(dm, state.reminderMessageIds)

      let ids: string[] = []

      if (embeds.length > 0) {
        const message = await dm.send({ embeds })

        ids = [message.id]
      }

      return { ...state, reminderMessageIds: ids }
    })
  }

  static async prune(client: Client): Promise<void> {
    const dm = await resolveDM(client)

    if (dm === null) {
      return
    }

    const state = await getCache().read()
    const keep = new Set(
      [state.listMessageId, state.upcomingMessageId, ...state.reminderMessageIds].filter(
        (id): id is string => id !== null,
      ),
    )

    const botId = client.user?.id

    if (botId === undefined) {
      return
    }

    let before: string | undefined
    let deleted = 0
    let scanned = 0
    let ownKept = 0
    let foreign = 0
    let failed = 0

    for (;;) {
      const batch = await dm.messages.fetch({ limit: 100, before })

      if (batch.size === 0) {
        break
      }

      before = batch.last()?.id

      for (const message of batch.values()) {
        scanned++
        if (message.author.id !== botId) {
          foreign++
          continue
        }
        if (keep.has(message.id)) {
          ownKept++
          continue
        }
        try {
          await message.delete()
          deleted++
        } catch {
          // cannot delete
          failed++
        }
      }

      if (batch.size < 100) {
        break
      }
    }

    console.log(
      `[dashboard] Prune: scanned ${scanned}, deleted ${deleted}, kept ${ownKept}, ` +
        `not-mine ${foreign}, undeletable ${failed}`,
    )
  }
}
