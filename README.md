![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6?logo=typescript&logoColor=white)
![Built with discordx](https://img.shields.io/badge/Built%20with-discordx-5865F2?logo=discord&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green)

# Celebrator

A Discord bot that tracks birthdays and sends DM reminders - a week before, a day before, and on the day itself - at midnight in your configured timezone.

> **v2** - Full rewrite from JavaScript to TypeScript using [discordx](https://github.com/discordx-ts/discordx). Config moved from `config.json` to `.env`, PM2 dropped in favor of a multi-stage Docker build.

## Table of Contents

- [Preview](#preview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Commands](#commands)
- [Upgrading from v1](#upgrading-from-v1)
- [Common Timezones](#common-timezones)
- [License](#license)

## Preview (old - to be updated)

![Preview](https://github.com/Locko2901/Celebrator/blob/main/images/1.jpg)

## Features

- **Birthday Tracking** - Add, edit, remove, and list birthdays
- **Reminders** - Get DMs 7 days before, 1 day before, and on the day
- **Timezone Support** - Schedule reminders at midnight in any IANA timezone
- **Upcoming View** - See the next birthdays at a glance
- **Persistent Storage** - JSON-based storage with automatic migration from v1
- **Docker Ready** - Multi-stage build with Compose for easy deployment

## Prerequisites

- **Docker** with Compose (recommended), or
- **Node.js** 20+

## Installation

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a **New Application**.
2. Copy the **Application ID** from the "General Information" tab.
3. In the **Installation** tab, set the install link to *"none"*.
4. In the **Bot** tab:
   - Disable *"Public Bot"*.
   - Enable *"Server Members Intent"*.
   - Click **"Copy"** under TOKEN to grab your bot token.
5. In the **OAuth2 → URL Generator** tab:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: none needed.
   - Open the generated URL to invite the bot to your server.

> **Keep your bot token secret!**

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

For development:

```sh
npm run dev
```

## Configuration

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token from the Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID from the Developer Portal |
| `DISCORD_USER_ID` | Your Discord user ID (receives the DM reminders) |
| `TIMEZONE` | IANA timezone for midnight scheduling (see [Common Timezones](#common-timezones)) |
| `BDNEXT_COUNT` | How many upcoming birthdays `/bdnext` shows (default: `5`) |

## Commands

| Command | Description |
|---|---|
| `/bdadd` | Add a birthday |
| `/bdremove` | Remove a birthday |
| `/bdedit` | Edit a birthday |
| `/bdlist` | List all birthdays |
| `/bdcheck` | Check someone's birthday |
| `/bdnext` | Show upcoming birthdays |

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
| `America/Sao_Paulo` | Brasília Time (BRT) |
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

## License

[MIT](LICENSE)
