import { SlashCommandBuilder } from 'discord.js';

process.env.TZ = 'Europe/Berlin';
export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Replies with Pong!');
export const execute = async (interaction) => {

	await interaction.reply('Pong!');

};
