import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	SelectMenuBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
} from 'discord.js';
import { getMember } from '../../MongoRequests/clanMembers.js';
import { getClanMembers, getWolvesvilleClan } from '../../wolvesVille/WolvesVilleRequests.js';
import {
	getClan,
	setAutomaticQuestStart,
	setAutomaticQuestStartTime, setAutomaticVoteStart,
	setColeaderAccess,
} from '../../MongoRequests/clans.js';
import { checkAccessRight } from '../../accessManager.js';


import moment from 'moment-timezone';
export const data = new SlashCommandBuilder()
	.setName('settings_vote_start_enablement')
	.setDMPermission(false)
	.setDescription('The clan leader can change Innocent Wolve quest start settings here');

const autoVoteStart = (voteStartEnabled) => {
	return new ActionRowBuilder()
		.addComponents(
			new SelectMenuBuilder()
				.setCustomId('voteStartEnabled')
				.setPlaceholder(voteStartEnabled ? 'Auto Vote Start is enabled.' : 'Auto Quest Start is not enabled.')
				.addOptions(
					{
						label: 'Auto Vote Start Enabled',
						description: 'Innocent Wolves automatically starts the quest voting.',
						value: 'true',
						default: voteStartEnabled,
					},
					{
						label: 'Auto Vote Start Disabled',
						description: 'Innocent Wolves does not start the quest voting.',
						value: 'false',
						default: !voteStartEnabled,
					},
				),
		);
};

export const execute = async (interaction) => {
	// check if user has access
	await interaction.deferReply({ ephemeral: true });
	try {
		checkAccessRight(interaction).then(rights => {
			const access = rights[0];
			const coLeaderAcess = rights[1];
			const userData = rights[2];
			if (access == 'leader' || (access == 'coLeader' && coLeaderAcess)) {
				userHasAccessResponse(interaction, userData.clanId);
			}
			else if (access == 'clanNotRegistered') {
				interaction.editReply({
					content: 'Your Clan is not registered to this Server.',
					ephemeral: true,
				});
			}
			else {
				interaction.editReply({ content: 'You have no access to this command.', ephemeral: true });
			}
		});
	}
	catch (e) {
		console.log(e);
		interaction.editReply({
			content: 'You have no access to the bot or a internal error accured.',
			ephemeral: true,
		});
	}

};


const userHasAccessResponse = (interaction, clanInformation) => {
	const menu = [autoVoteStart(clanInformation.settings.autoNewVotingEnabled)];
	interaction.editReply({
		content: 'Innocent Wolve Vote Vote Settings',
		components: menu,
		ephemeral: true,
	});
	const collector = interaction.channel.createMessageComponentCollector({ time: 30000 });
	/**
	 *  \n' +
	 * 			'Please use this format for the queststarts: \n' +
	 * 			'd.hh.mm - (d)ay (0-6) | (h)our (00-23) | (m)inute (00-59)' +
	 * 			'0 - Monday' +
	 * 			'6 - Sunday
	 */
	collector.on('collect', async i => {
		await i.deferUpdate({ ephemeral: true });

		if (i.customId == 'voteStartEnabled') {
			setAutomaticVoteStart(i.guildId, (i.values[0] == 'true')).then(d => {
				const newMenu = [autoVoteStart(d.settings.autoNewVotingEnabled)];
				i.editReply({
					content: 'Innocent Wolve Vote Start Settings | UPDATED: ' + moment(new Date()).tz("Europe/Berlin").toDate().toLocaleString(),
					components: newMenu,
					ephemeral: true,
				});
			}).catch(e => {
				console.log(e);
			});
		}

	});

	collector.on('end', collected => console.log(`Collected ${collected.size} items`));
};
