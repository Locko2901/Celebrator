const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const birthdaysFilePath = path.join(__dirname, '..', '..', 'data', 'birthdays.json');

const addBirthdayCommand = new SlashCommandBuilder()
  .setName('bdadd')
  .setDescription('Add a birthday.')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('The name of the person whose birthday you want to add.')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('date')
      .setDescription('The date of the birthday (DD/MM format).')
      .setRequired(true));

module.exports = {
  data: addBirthdayCommand,
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const date = interaction.options.getString('date');

    const [day, month] = date.split('/');

    if (!day || !month) {
      return await interaction.reply('Invalid date format. Please use DD/MM format.');
    }

    const birthday = { name, day: parseInt(day), month: parseInt(month) };

    let birthdays = [];

    try {
      if (fs.existsSync(birthdaysFilePath)) {
        const data = fs.readFileSync(birthdaysFilePath, 'utf-8');
        if (data) {
          birthdays = JSON.parse(data);
        }
      } else {
        fs.writeFileSync(birthdaysFilePath, '[]', 'utf-8');
      }
    } catch (error) {
      console.error('Error reading or parsing birthdays.json:', error);
    }

    birthdays.push(birthday);

    try {
      fs.writeFileSync(birthdaysFilePath, JSON.stringify(birthdays, null, 2));
      await interaction.reply(`${name}'s birthday was added successfully!`);
    } catch (error) {
      console.error('Error writing to birthdays.json:', error);
      await interaction.reply('An error occurred while adding the birthday.');
    }
  }
};
