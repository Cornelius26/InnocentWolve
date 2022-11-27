import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { Client, Events, GatewayIntentBits, Collection, Routes, REST } from 'discord.js';
import { fileURLToPath } from 'url';

import schedule from 'node-schedule';
import allJobs from './jobs.js';
import { global_command_deploy } from './deploy-commands_global.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

dotenv.config();
const token = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const getInteractions = async (userPath) => {
	const commandsPath = path.join(__dirname, userPath);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	const commandDirectories = fs.readdirSync(commandsPath, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		import('file://' + filePath).then((command) => {
			console.log(command.data.name);
			client.commands.set(command.data.name, command);
		});
		// Set a new item in the Collection with the key as the command name and the value as the exported module
	}
	console.log(commandDirectories);

	for (const dir of commandDirectories) {
		await getInteractions(userPath + '/' + dir);
	}
};

getInteractions('commands');
if (process.env.ENVIROMENT == 'production') {
	global_command_deploy().then(() => {
		console.log('Commands Deployed');
	});
}

client.on(Events.InteractionCreate, async interaction => {

	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});
/*
client.on(Events.InteractionCreate, interaction => {
	if (!interaction.isButton()) return;
});
 */

schedule.scheduleJob('*/1 * * * *', (fireDate) => {
	console.log('jobs updated');
	allJobs(fireDate);
});

client.login(token);