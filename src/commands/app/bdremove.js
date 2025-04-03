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
    .setName('bdremove')
    .setDescription('Remove a birthday.')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('The name of the person whose birthday you want to remove.')
        .setRequired(true)
        .setAutocomplete(true)
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
    try {
      let birthdays = [];
      if (fs.existsSync(birthdaysFilePath)) {
        const data = fs.readFileSync(birthdaysFilePath, 'utf-8');
        birthdays = JSON.parse(data);
      }

      const index = birthdays.findIndex(birthday => birthday.name === name);
      if (index !== -1) {
        birthdays.splice(index, 1);
        fs.writeFileSync(birthdaysFilePath, JSON.stringify(birthdays, null, 2));
        await interaction.reply(`Birthday for ${name} removed successfully!`);
      } else {
        await interaction.reply(`No birthday found for ${name}.`);
      }
    } catch (error) {
      console.error('Error removing birthday:', error);
      await interaction.reply('An error occurred while removing the birthday.');
    }
  },
};
