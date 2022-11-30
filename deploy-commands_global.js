import path from 'path';

import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


dotenv.config();

const commands = [];
// Grab all the command files from the commands directory you created earlier

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment

const getInteractions = async (userPath) => {
	console.log(userPath);
	const commandsPath = path.join(__dirname, userPath);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	const commandDirectories = fs.readdirSync(commandsPath, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		await import('file://' + filePath).then((command) => {
			commands.push(command.data.toJSON());
			console.log(commands.length);
		});
		// Set a new item in the Collection with the key as the command name and the value as the exported module
	}

	for (const dir of commandDirectories) {
		await getInteractions(userPath + '/' + dir);
	}
};

await getInteractions('commands');

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
export const global_command_deploy = async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
};

