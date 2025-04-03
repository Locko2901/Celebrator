# Celebrator

Celebrator is a Discord bot that helps you keep track of birthdays. It sends direct messages a week before, a day before, and on the day of someone's birthday at exactly 12:00 AM midnight in the timezone you configured. You can manage birthdays using the following commands:
- `/bdadd`: Add a birthday
- `/bdremove`: Remove a birthday
- `/bdlist`: List all birthdays

## Preview 

![Project Screenshot](https://github.com/Locko2901/Celebrator/blob/main/images/1.jpg)

## Manual Installation

### Prerequisites
- Node.js
- npm

### Setup

1. Clone the repository:
    ```sh
    git clone https://github.com/Locko2901/Celebrator.git
    cd Celebrator
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Install PM2 globally if not already installed:
    ```sh
    npm install -g pm2
    ```

4. Install pm2-logrotate:
    ```sh
    pm2 install pm2-logrotate
    ```

5. Create the necessary directories:
    ```sh
    mkdir /logs
    ```

6. Fill out the `config.json`.

7. Run the project using PM2 and `ecosystem.config.js`:
    ```sh
    pm2 start ecosystem.config.js
    ```

## Docker Installation

### Prerequisites
- [Docker](https://docs.docker.com/engine/install/)

### Setup with Docker

1. Clone the repository:
    ```sh
    git clone https://github.com/Locko2901/Celebrator.git
    cd Celebrator
    ```

2. Fill out the `config.json`.

3. Build and run using Docker:
    ```sh
    ./start_celebrator.sh
    ```
    This command may take some time.

---

#### Tipp: Some of the Most Common Timezones Are:

1. `Africa/Johannesburg` - South African Standard Time (SAST)
2. `America/Chicago` - Central Standard Time (CST)/Central Daylight Time (CDT)
3. `America/Los_Angeles` - Pacific Standard Time (PST)/Pacific Daylight Time (PDT)
4. `America/Mexico_City` - Central Standard Time (CST)/Central Daylight Time (CDT)
5. `America/New_York` - Eastern Standard Time (EST)/Eastern Daylight Time (EDT)
6. `America/Sao_Paulo` - Brasília Time (BRT)/Brasília Summer Time (BRST)
7. `America/Toronto` - Eastern Standard Time (EST)/Eastern Daylight Time (EDT)
8. `Asia/Bangkok` - Indochina Time (ICT)
9. `Asia/Dubai` - Gulf Standard Time (GST)
10. `Asia/Kolkata` - Indian Standard Time (IST)
11. `Asia/Seoul` - Korea Standard Time (KST)
12. `Asia/Shanghai` - China Standard Time (CST)
13. `Asia/Singapore` - Singapore Standard Time (SGT)
14. `Asia/Tokyo` - Japan Standard Time (JST)
15. `Australia/Sydney` - Australian Eastern Standard Time (AEST)/Australian Eastern Daylight Time (AEDT)
16. `Europe/Berlin` - Central European Time (CET)/Central European Summer Time (CEST)
17. `Europe/Istanbul` - Turkey Time (TRT)
18. `Europe/London` - Greenwich Mean Time (GMT)/British Summer Time (BST)
19. `Europe/Moscow` - Moscow Standard Time (MSK)
20. `Europe/Paris` - Central European Time (CET)/Central European Summer Time (CEST)

## Creating a Discord Bot Account

To interact with your application, a bot account on Discord is necessary. Here are the steps to set one up:

1. Navigate to the [Discord Developer Portal](https://discord.com/developers/applications) and log in with your Discord credentials.
2. Select the "New Application" button, name your application, and click on "Create".
3. Copy the "Application ID" from the "General Information" tab and save it.
4. Navigate to the "Installation" tab and set the install link to *"none"*.
5. In the "Bot" tab:
   - (Optional) Customize your bot's username and profile image.
   - Disable *"Public Bot"* (otherwise anyone can invite it to their server) and leave *"Requires OAuth2 Code Grant"* deactivated.
   - Enable *"Server Members Intent"*.
6. Under "TOKEN", click "Copy" to save your bot's token. This token and the application ID will be needed for the `config.json` file configuration.

**Important:** Your bot's token is called a secret for a reason. Keep it that way!

### Inviting Your Bot to a Server

To make your bot operational:

1. Access your bot's application page in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Navigate to the "OAuth2" tab and use the "URL Generator":
   - In “Scopes”, select “bot” and "applications.commands".
   - Under “Bot Permissions” you can leave everything disabled.
3. Copy the "Generated URL", paste it into a web browser, select a server, and confirm to add your bot.
4. From there you can send your bot a dm and start configuring Birthdays with the `/bdadd`, `/bdremove` and `/bdlist` commands.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Locko2901/Celebrator/blob/main/LICENSE) file for details.
