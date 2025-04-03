const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { token } = require('../config.json');
const { scheduleAtMidnight } = require('./modules/scheduler');
const { loadConfig } = require('./modules/configLoader');
const { DateTime } = require('luxon');

const path = require('path');
const fsSync = require('fs');
const fsPromises = require('fs').promises;

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
    ],
});

module.exports = {
    client,
};

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fsSync.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fsSync.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.on('ready', async () => {
    console.log(`${client.user.tag} is online.`);
    const config = await loadConfig();
    if (config.timezone) {
        scheduleAtMidnight(config.timezone, remindBirthdays, client);
    } else {
        console.log('Timezone is not configured. Cannot schedule birthday reminders.');
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        if (typeof command.autocomplete === 'function') {
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error('Error in autocomplete interaction:', error);
            }
        }
        return;
    }
    
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const response = interaction.replied || interaction.deferred ? interaction.followUp : interaction.reply;
        response({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
        });
    }
});  

client.login(token);

async function remindBirthdays(client) {
    try {
        const { timezone, userId } = await loadConfig();
        
        const targetUser = await client.users.fetch(userId);
        
        const now = DateTime.now().setZone(timezone);

        let birthdays;
        try {
            birthdays = JSON.parse(await fsPromises.readFile('./data/birthdays.json', 'utf-8'));
        } catch (error) {
            console.error('Failed to read or parse birthdays.json', error);
            return;
        }

        // Today's birthdays
        const todayBirthdays = birthdays.filter(birthday =>
            birthday.day === now.day && birthday.month === now.month
        );
        await sendReminders(targetUser, todayBirthdays, "Today", "🎉 Today is ${name}'s birthday! 🎉");

        // Birthdays in one day
        const tomorrow = now.plus({ days: 1 });
        const tomorrowBirthdays = birthdays.filter(birthday =>
            birthday.day === tomorrow.day && birthday.month === tomorrow.month
        );
        await sendReminders(targetUser, tomorrowBirthdays, "in 1 day", "🎉 Hey: ${name}'s birthday is tomorrow! 🎉");

        // Birthdays in one week
        const nextWeek = now.plus({ days: 7 });
        const nextWeekBirthdays = birthdays.filter(birthday =>
            birthday.day === nextWeek.day && birthday.month === nextWeek.month
        );
        await sendReminders(targetUser, nextWeekBirthdays, "in 1 week", "🎉 Heads up: ${name}'s birthday is in a week! 🎉");

    } catch (error) {
        console.error('Failed to execute remindBirthdays', error);
    }
}

async function sendReminders(user, birthdays, reminderType, messageTemplate) {
    const reminderPromises = birthdays.map(birthday => 
        user.send(messageTemplate.replace('${name}', birthday.name))
            .then(() => {
                console.log(`Reminder sent for ${birthday.name}: ${reminderType}`);
            })
    );
    await Promise.all(reminderPromises);
}
