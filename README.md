![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6?logo=typescript&logoColor=white)
![Built with discordx](https://img.shields.io/badge/Built%20with-discordx-5865F2?logo=discord&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green)

# Celebrator

A Discord bot that tracks birthdays and sends DM reminders - a week before, a day before, and on the day itself - at midnight in your configured timezone.

> **v2** - Full rewrite from JavaScript to TypeScript using [discordx](https://github.com/discordx-ts/discordx). Config moved from `config.json` to `.env`, PM2 dropped in favor of a multi-stage Docker build.

## Table of Contents

- [Preview](#preview)
- [How It Works](#how-it-works)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Commands](#commands)
- [Development](#development)
- [Upgrading from v1](#upgrading-from-v1)
- [Common Timezones](#common-timezones)
- [Encryption](#encryption)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Preview (old - to be updated)

![Preview](https://github.com/Locko2901/Celebrator/blob/main/images/1.jpg)

## How It Works

Celebrator is a single-user Discord bot - it runs for one person at a time. Birthdays are stored in a local JSON file (optionally encrypted) and a built-in scheduler checks daily at midnight in your configured timezone, sending DM reminders at 7 days, 1 day, and on the day itself.

## Features

- **Birthday Tracking** - Add, edit, remove, and list birthdays
- **Reminders** - Get DMs 7 days before, 1 day before, and on the day
- **Timezone Support** - Schedule reminders at midnight in any IANA timezone
- **Upcoming View** - See the next birthdays at a glance
- **Persistent Storage** - JSON-based storage with automatic migration from v1
- **Optional Encryption** - AES-256-GCM encryption for data at rest
- **Docker Ready** - Multi-stage build with Compose for easy deployment

## Prerequisites

- **Docker** with Compose (recommended), or
- **Node.js** 20+

## Installation

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a **New Application**
2. In the **General Information** tab, copy the **Application ID**
3. Go to the **Bot** tab, click *"Reset Token"*, and save the new token
4. Follow either **User Install** or **Guild Install** below to configure and authorize the bot

> **Important:** Finish the install **before** starting the bot. Discord doesn't let bots DM you out of nowhere - you need to either authorize the bot on your account (user install) or share a server with it (guild install) first. On first launch, the bot tries to DM you to open the conversation for future reminders. If it can't reach you, it retries for up to a minute and then gives up. If that happens, just fix your setup and restart.

#### User Install (recommended)

No server needed - the bot is tied to your account and you interact with it in its own DMs.

1. In the **Bot** tab, disable *"Public Bot"*
2. Go to the **Installation** tab and check only *"User Install"*
3. Under *"Install Link"*, select *"Discord Provided Link"* and copy the URL
4. Open that URL and authorize the bot on your account
5. Set `INSTALL_MODE=user` in your `.env`

> **Note:** The bot will always appear offline in your friend list - this is a Discord limitation for user-installed apps. It still works normally; just interact with it in its own DM.

#### Guild Install

Server-based setup - the bot shows as online while it's running. Since reminders only go to you (the user in `DISCORD_USER_ID`), create a **private server just for you and the bot**.

1. Create a private server with just you in it
2. In the **Bot** tab, enable *"Server Members Intent"*
3. Go to the **Installation** tab and check only *"Guild Install"*
4. Under *"Default Install Settings"*, add the scopes `applications.commands` and `bot`
5. Under *"Install Link"*, select *"Discord Provided Link"* and copy the URL
6. Open that URL, select your private server, and authorize
7. Set `INSTALL_MODE=guild` in your `.env`

> **Note:** We're not disabling *"Public Bot"* here because Discord rejects the default install link when it's off. You can work around it via the **OAuth2** tab, but it's easier to leave it on - the private server keeps the bot to yourself anyway.

### 2. Clone and Configure

```sh
git clone https://github.com/Locko2901/Celebrator.git
cd Celebrator
cp .env.example .env
```

Edit `.env` with your values (see [Configuration](#configuration)).

### 3. Run

#### Docker (recommended)

Requires [Docker](https://docs.docker.com/engine/install/) with Compose.

```sh
docker compose up -d --build
```

Birthday data is persisted in the `./data` volume.

#### Manual

```sh
npm install
npm run build
npm start
```

## Configuration

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token from the Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID from the Developer Portal |
| `DISCORD_USER_ID` | Your Discord user ID (receives the DM reminders) |
| `TIMEZONE` | IANA timezone for midnight scheduling (see [Common Timezones](#common-timezones)) |
| `BDNEXT_COUNT` | How many upcoming birthdays `/bdnext` shows (default: `5`) |
| `USE_ENCRYPTION` | `true`/`false` - encrypts the data file with an auto-generated key stored in `data/.encryption_key`. Toggling to `false` decrypts the file (default: `false`). |
| `INSTALL_MODE` | `user` or `guild` - determines how the bot is installed (default: `user`). Must match your Installation settings in the Developer Portal. |

## Commands

| Command | Description |
|---|---|
| `/bdadd` | Add a birthday |
| `/bdremove` | Remove a birthday |
| `/bdedit` | Edit a birthday |
| `/bdlist` | List all birthdays |
| `/bdcheck` | Check someone's birthday date |
| `/bdnext` | Show the next upcoming birthdays |

## Development

```sh
npm run dev
```

Linting:

```sh
npm run lint
npm run lint:fix
```

## Upgrading from v1

If you used Celebrator before the v2 rewrite, your birthday data uses the old format (`day`/`month` fields). **The bot automatically migrates your data on startup** - no manual steps required.

- A backup is created at `data/birthdays.backup-<timestamp>.json` before migration

## Common Timezones

<details>
<summary>Click to expand</summary>

| Timezone | Name |
|---|---|
| `Africa/Johannesburg` | South African Standard Time (SAST) |
| `America/Chicago` | Central Time (CT) |
| `America/Los_Angeles` | Pacific Time (PT) |
| `America/New_York` | Eastern Time (ET) |
| `America/Sao_Paulo` | Bras&iacute;lia Time (BRT) |
| `America/Toronto` | Eastern Time (ET) |
| `Asia/Dubai` | Gulf Standard Time (GST) |
| `Asia/Kolkata` | Indian Standard Time (IST) |
| `Asia/Shanghai` | China Standard Time (CST) |
| `Asia/Singapore` | Singapore Time (SGT) |
| `Asia/Tokyo` | Japan Standard Time (JST) |
| `Australia/Sydney` | Australian Eastern Time (AET) |
| `Europe/Berlin` | Central European Time (CET) |
| `Europe/London` | Greenwich Mean Time (GMT) |
| `Europe/Moscow` | Moscow Standard Time (MSK) |
| `Europe/Paris` | Central European Time (CET) |

</details>

## Encryption

### Why?

If you're hosting the bot for someone else (a friend, etc.), encryption keeps their birthday data private - you won't accidentally stumble across it during routine maintenance. To actually read it, you'd need to either manually decrypt with the key, or toggle `USE_ENCRYPTION` and restart the bot.

This is **privacy from convenience, not security from adversaries**. If you need stronger guarantees, the person whose data it is should host the bot themselves.

### How it works

When `USE_ENCRYPTION=true`, birthday data is encrypted at rest using **AES-256-GCM** with keys derived via **scrypt**. On first run, a 32-byte key is auto-generated and stored in `data/.encryption_key` with restricted permissions (`0600`).

- Data is saved to `data/birthdays.encrypted` instead of `birthdays.json`
- Toggling `USE_ENCRYPTION=false` automatically decrypts and migrates back to plain JSON

> This should go without saying, but if you lose `data/.encryption_key` while encryption is enabled, your data is gone.

### Security model

**Protects against:**
- **At-rest exposure** - Data file is AES-256-GCM encrypted and unreadable without the key
- **Casual snooping** - Birthdays won't be visible when editing configs or doing backups
- **Data leaks** - If only the data file is exposed (without the key), it's useless

**Does not protect against:**
- **Host with key access** - The key is in `data/.encryption_key` - anyone who can read it can decrypt
- **Memory inspection** - Data is decrypted in memory during bot operation
- **Malicious host** - If you don't trust the person running the bot, encryption won't help

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Bot doesn't DM me on first launch | The bot can't reach you - no shared server (guild mode) or no authorization (user mode) | Make sure you've completed the install steps **before** starting the bot. It retries for up to a minute, then gives up. Restart the bot after fixing. |
| Bot appears offline | User-installed apps always show offline in friend lists - this is a Discord limitation | The bot is still running. Use its DM to interact. |
| Commands don't show up | Slash commands haven't synced yet | Wait a minute after first launch. If they still don't appear, check that `DISCORD_CLIENT_ID` is correct. |
| Wrong reminder time | Timezone mismatch | Verify `TIMEZONE` in `.env` is a valid IANA timezone (see [Common Timezones](#common-timezones)). |

## License

[MIT](LICENSE)
