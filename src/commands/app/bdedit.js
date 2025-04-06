const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const birthdaysFilePath = path.join(__dirname, '..', '..', 'data', 'birthdays.json');

function getBirthdayNames() {
  try {
    if (fs.existsSync(birthdaysFilePath)) {
      const data = fs.readFileSync(birthdaysFilePath, 'utf-8');
      const birthdays = JSON.parse(data);
      return birthdays.map(birthday => birthday.name);
    }
  } catch (error) {
    console.error('Error reading or parsing birthdays.json:', error);
  }
  return [];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bdedit')
    .setDescription('Edit a birthday.')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('The name of the person whose birthday you want to edit.')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option
        .setName('new_name')
        .setDescription('The new name of the person.')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('date')
        .setDescription('The new date of the birthday (DD/MM format).')
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();

      const birthdayNames = getBirthdayNames();

      const filtered = birthdayNames.filter(name =>
        name.toLowerCase().startsWith(focusedValue.toLowerCase())
      );

      const response = filtered
        .slice(0, 25)
        .map(name => ({
          name: name.length > 25 ? name.slice(0, 25) : name,
          value: name,
        }));

      await interaction.respond(response);
    } catch (error) {
      console.error('Error in autocomplete handler:', error);
    }
  },

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const newName = interaction.options.getString('new_name');
    const newDate = interaction.options.getString('date');

    if (!newName && !newDate) {
      return await interaction.reply('Please provide at least a new name or a new date to update.');
    }

    let day, month;
    if (newDate) {
      const dateParts = newDate.split('/');
      day = dateParts[0];
      month = dateParts[1];

      if (!day || !month || isNaN(day) || isNaN(month)) {
        return await interaction.reply('Invalid date format. Please use DD/MM format.');
      }
    }

    try {
      let birthdays = [];
      if (fs.existsSync(birthdaysFilePath)) {
        const data = fs.readFileSync(birthdaysFilePath, 'utf-8');
        birthdays = JSON.parse(data);
      }

      const index = birthdays.findIndex(birthday => birthday.name === name);
      if (index === -1) {
        return await interaction.reply(`No birthday found for ${name}.`);
      }

      if (newName) {
        const nameExists = birthdays.some(birthday => birthday.name === newName);
        if (nameExists) {
          return await interaction.reply(`A birthday entry for ${newName} already exists.`);
        }
        birthdays[index].name = newName;
      }

      if (newDate) {
        birthdays[index].day = parseInt(day, 10);
        birthdays[index].month = parseInt(month, 10);
      }

      fs.writeFileSync(birthdaysFilePath, JSON.stringify(birthdays, null, 2));
      await interaction.reply(
        `Birthday for ${
          newName ? newName : name
        } has been updated successfully!`
      );
    } catch (error) {
      console.error('Error editing birthday:', error);
      await interaction.reply('An error occurred while editing the birthday.');
    }
  },
};
