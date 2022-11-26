import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, SlashCommandBuilder } from 'discord.js';
import { getMember } from '../../MongoRequests/clanMembers.js';
import { getClanMembers, getWolvesvilleClan } from '../../wolvesVille/WolvesVilleRequests.js';
import { getClan, setColeaderAccess } from '../../MongoRequests/clans.js';
import { checkAccessRight } from '../../accessManager.js';

export const data = new SlashCommandBuilder()
	.setName('set_permissions')
	.setDMPermission(false)
	.setDescription('The clan leader can change Innocent Wolve access permissions here');

const row = (coLeaderRights) => {
	return new ActionRowBuilder()
		.addComponents(
			new SelectMenuBuilder()
				.setCustomId('coLeaderAccess')
				.setPlaceholder(coLeaderRights ? 'Co Leader currently have access.' : 'Co Leader currently have no access.')
				.addOptions(
					{
						label: 'Co Leaders Enabled',
						description: 'Co Leader can change Innocent Wolve Clan Settings (this Command). (Dangerous for Co Leaders)',
						value: 'true',
						default: coLeaderRights,
					},
					{
						label: 'Co Leaders Disabled',
						description: 'Co Leader can NOT change Innocent Wolve Clan Settings (this Command).',
						value: 'false',
						default: !coLeaderRights,
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
			console.log(access);
			console.log(coLeaderAcess);
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
	} catch (e) {
		console.log(e);
		interaction.editReply({
			content: 'You have no access to the bot or a internal error accured.',
			ephemeral: true,
		});
	}

};


const userHasAccessResponse = (interaction, clanInformation) => {
	const menu = row(clanInformation.settings.allowCoLeaderAccess);
	interaction.editReply({ content: 'Innocent Wolve Settings', components: [menu], ephemeral: true });
	const collector = interaction.channel.createMessageComponentCollector({ time: 30000 });

	collector.on('collect', async i => {
		await i.deferUpdate({ ephemeral: true });
		if (i.customId == 'coLeaderAccess') {
			setColeaderAccess(i.guildId, (i.values[0] == 'true')).then(d => {
				const menuNew = row(d.settings.allowCoLeaderAccess);
				i.editReply({
					content: 'Innocent Wolve Settings  | UPDATED: ' + new Date().toLocaleString(),
					components: [menuNew],
					ephemeral: true,
				});
			}).catch(e => {
				console.log(e);
			});
		}

	});

	collector.on('end', collected => console.log(`Collected ${collected.size} items`));
};