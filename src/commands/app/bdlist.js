const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MAX_MESSAGE_LENGTH = 2000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bdlist')
        .setDescription('List all birthdays.'),
    
    async execute(interaction) {
        const birthdaysFilePath = path.join(__dirname, '..', '..', 'data', 'birthdays.json');

        try {
            // Read birthdays
            let birthdays = readBirthdays(birthdaysFilePath);

            if (birthdays.length > 0) {
                // Sort birthdays
                birthdays = sortBirthdays(birthdays);

                // Determine today's birthdays and the next upcoming birthday
                const { todayBirthdays, nextUpcomingBirthday } = findRelevantBirthdays(birthdays);

                // Format the birthday list
                const birthdayList = formatBirthdayList(birthdays, todayBirthdays, nextUpcomingBirthday);

                // Acknowledge interaction
                await interaction.reply({ content: "**🎉 Birthdays 🎉**" });

                // Send the actual list in chunks
                await sendInChunks(interaction, birthdayList);
            } else {
                await interaction.reply('No birthdays found.');
            }
        } catch (error) {
            console.error('Error listing birthdays:', error);
            await interaction.reply('An error occurred while listing birthdays.');
        }
    }
};

// Function to read birthdays from a file
function readBirthdays(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (error) {
            throw new Error('Error reading the birthdays file.');
        }
    } else {
        return [];
    }
}

// Function to sort birthdays by month and day
function sortBirthdays(birthdays) {
    return birthdays.sort((a, b) => {
        return a.month === b.month ? a.day - b.day : a.month - b.month;
    });
}

// Function to find today's and the next upcoming birthday
function findRelevantBirthdays(birthdays) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed so +1 for human-readable month
    const currentDay = now.getDate();
    let nextUpcomingBirthday = null;
    const todayBirthdays = [];

    birthdays.forEach(birthday => {
        if (birthday.month === currentMonth && birthday.day === currentDay) {
            todayBirthdays.push(birthday);
        } else if (!nextUpcomingBirthday && 
                   (birthday.month > currentMonth || 
                    (birthday.month === currentMonth && birthday.day > currentDay))) {
            nextUpcomingBirthday = birthday;
        }
    });

    // If no upcoming birthday found, check from the start of the year
    if (!nextUpcomingBirthday) {
        nextUpcomingBirthday = birthdays.find(birthday => 
            birthday.month > currentMonth || 
            (birthday.month === currentMonth && birthday.day > currentDay)
        );
    }

    return { todayBirthdays, nextUpcomingBirthday };
}

// Function to format the birthday list
function formatBirthdayList(birthdays, todayBirthdays, nextUpcomingBirthday) {
    return birthdays.map(birthday => {
        const day = String(birthday.day).padStart(2, '0');
        const monthName = monthNames[birthday.month - 1];
        let birthdayString = `🎂 **${birthday.name}**: ${monthName} ${day}`;

        if (todayBirthdays.includes(birthday)) {
            birthdayString += " 🎉 *Today*";
        } else if (nextUpcomingBirthday && 
                   birthday.day === nextUpcomingBirthday.day && 
                   birthday.month === nextUpcomingBirthday.month) {
            birthdayString += " 🚀 *Upcoming*";
        }

        return birthdayString;
    });
}

async function sendInChunks(interaction, list) {
    let message = "";
    
    for (const item of list) {
        const formattedItem = `${item}\n`;
        
        if (message.length + formattedItem.length > MAX_MESSAGE_LENGTH) {
            await interaction.followUp(message);
            message = formattedItem; // Reset the message with the current item
        } else {
            message += formattedItem;
        }
    }
    
    if (message.length > 0) {
        await interaction.followUp(message); // Send any remaining message content
    }
}
