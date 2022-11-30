import { SlashCommandBuilder } from 'discord.js';
import { getUserByName, getWolvesvilleClan } from '../../wolvesVille/WolvesVilleRequests.js';
import { createMember } from '../../MongoRequests/clanMembers.js';
import { getClan, setClanDiscordId } from '../../MongoRequests/clans.js';

export const data = new SlashCommandBuilder()
	.setName('register')
	.setDMPermission(false)
	.setDescription('Here you can register to use access the Innocent Wolve Bot')
	.addStringOption(option =>
		option.setName('username')
			.setDescription('Please enter your Wolvesville Username')
			.setRequired(true),
	);
export const execute = async (interaction) => {

	const username = interaction.options.get('username').value;
	await interaction.deferReply({ ephemeral: true });
	checkUserRegisterState(interaction, username).then(([state, clanId, userId]) => {
		switch (state) {
		case 'newUser':
			response(interaction, true, 'Please enter the code "authCode" in your Clan Chat to connect your Discord Account this Application.', clanId, userId);
			break;
		case 'leaderRegisteredClan':
			response(interaction, true, 'Your Clan has been registered to this Discord Server.\nPlease enter the code "authCode" in your Clan Chat to connect your Discord Account to this Application.', clanId, userId);
			break;
		case 'alreadyRegistered':
			// reply
			response(interaction, false, 'You are already registered.');
			break;
		case 'serverNotRegistered':
			// ask Clan Leader
			response(interaction, false, 'The Clan has not been registered yet or is not registered to this Discord. Please ask your Clan Leader to register the Clan.');
			break;
		case 'userNotFound':
			// ask Clan Leader
			response(interaction, false, 'I could not find a Wolvesville User with this Username.');
			break;
		case 'registeredToOtherDiscord':
			// ask Clan Leader
			response(interaction, false, 'Your Clan is registered to another discord.');
			break;
		case 'notRegisteredToThisDiscord':
			// ask Clan Leader
			response(interaction, false, 'Clan Is not registered to this Server');
			break;
		case 'clanAlreadyRegistered':
			// ask Clan Leader
			response(interaction, false, 'The Clan is already registered. You have been registered to. Please authenticate by writing this code "authCode" into the clanchat.');
			break;
		case 'noClan':
			// ask Clan Leader
			response(interaction, false, 'You are currently not a member of a Wolvesville Clan');
			break;
		default:
			response(interaction, false, 'A Error occured. Please contact a developer');
			// report error
			break;
		}
	}).catch(err => {
		console.log(err);
		response(interaction, false, 'A Error occured. Please contact a developer');
	});

};
const checkUserRegisterState = async (interaction, username) => {
	// check User exists

	return getUserByName(username).then(wolvesVilleUserdata => {
		if (wolvesVilleUserdata.body.clanId === undefined) {
			return ['noClan', null, null];
		}
		return getWolvesvilleClan(wolvesVilleUserdata.body.clanId).then(wolvesVilleClanData => {
			return getClan(wolvesVilleUserdata.body.clanId).then(clandata => {

				if (clandata.guildId === undefined) {
					if (wolvesVilleClanData.body.leaderId == wolvesVilleUserdata.body.id) {
						return setClanDiscordId(wolvesVilleUserdata.body.clanId, interaction.guildId).then(d => {
							return ['leaderRegisteredClan', clandata._id, wolvesVilleUserdata.body.id];
						}).catch(e => {
							console.log(e);
							return ['clanAlreadyRegistered', clandata._id, wolvesVilleUserdata.body.id];
						});
					}
					else {
						return ['serverNotRegistered', null, null];
					}
				}
				else if (clandata.guildId != interaction.guildId) {

					console.log('hi');
					if (wolvesVilleClanData.body.leaderId == wolvesVilleUserdata.body.id) {
						return setClanDiscordId(wolvesVilleUserdata.body.clanId, interaction.guildId).then(d => {
							return ['leaderRegisteredClan', clandata._id, wolvesVilleUserdata.body.id];
						}).catch(errCatch);
					}
					else {
						return ['registeredToOtherDiscord', null, null];
					}
				}
				else {
					return ['newUser', clandata._id, wolvesVilleUserdata.body.id];
				}
			}).catch(errCatch);
		}).catch(errCatch);
	}).catch((e) => {
		console.log(e);
		return ['userNotFound', null, null];
	});


};

const response = (interaction, isCreateMember, text, clanId, userId) => {
	if (isCreateMember) {
		createMember(userId, clanId, interaction.user.id).then(authCode => {
			interaction.editReply({ ephemeral: true, content: text.replace('authCode', authCode) });
		}).catch(err => {
			let answer = 'A internal error occured. Please contact a developer';
			if (err == 'discordId already taken') {
				answer = 'You can not register with the same discord account for different Wolvesville Accounts';
			}
			else if (err == 'already registered') {
				answer = 'You are already registered';
			}
			interaction.editReply({
				ephemeral: true,
				content: answer,
			});
		});
	}
	else {
		interaction.editReply({ ephemeral: true, content: text });
	}
};

const errCatch = (e) => {
	throw new Error(e);
};