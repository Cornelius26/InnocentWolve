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
	setAutomaticQuestStartTime,
	setColeaderAccess,
} from '../../MongoRequests/clans.js';
import { checkAccessRight } from '../../accessManager.js';


export const data = new SlashCommandBuilder()
	.setName('quest_start_settings')
	.setDMPermission(false)
	.setDescription('The clan leader can change Innocent Wolve quest start settings here');

const autoQuestStart = (questStartEnabled) => {
	return new ActionRowBuilder()
		.addComponents(
			new SelectMenuBuilder()
				.setCustomId('questStartEnabled')
				.setPlaceholder(questStartEnabled ? 'Auto Quest Start is enabled.' : 'Auto Quest Start is not enabled.')
				.addOptions(
					{
						label: 'Auto Quest Start Enabled',
						description: 'Innocent Wolves automatically starts the quest.',
						value: 'true',
						default: questStartEnabled,
					},
					{
						label: 'Auto Quest Start Disabled',
						description: 'Innocent Wolves does not starts the quest.',
						value: 'false',
						default: !questStartEnabled,
					},
				),
		);
};
const questStartTime = (startTime) => {
	const getOptions = (start, end, skips, defaultValue, type) => {
		const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		const options = [];
		while (start <= end) {
			options.push(
				{
					label: type == 'days' ? day[parseInt(start)] : type + ': ' + start.toString(),
					value: start.toString(),
					default: (defaultValue == start),
				},
			);
			start += skips;
		}
		return options;
	};
	return [
		new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId('questDayStartTime')
					.setPlaceholder(startTime.slice(0, 1))
					.setOptions(getOptions(0, 6, 1, parseInt(startTime.slice(0, 1)), 'days')),
			),
		new ActionRowBuilder().addComponents(
			new SelectMenuBuilder()
				.setCustomId('questHourStartTime')
				.setPlaceholder(startTime.slice(2, 4))
				.setOptions(getOptions(0, 23, 1, parseInt(startTime.slice(2, 4)), 'Hour')),
		),
		new ActionRowBuilder().addComponents(
			new SelectMenuBuilder()
				.setCustomId('questMinuteStartTime')
				.setPlaceholder(startTime.slice(5, 7))
				.setOptions(getOptions(0, 55, 5, parseInt(startTime.slice(5, 7)), 'Minute')),
		)]
	;
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
	const menu = [autoQuestStart(clanInformation.settings.autoQuestStartEnabled)];
	const menu2 = questStartTime(clanInformation.settings.autoQuestStartTime);
	interaction.editReply({
		content: 'Innocent Wolve Quest Start Settings\n' +
			'The format for the questStart below is\n' +
			'day 0 - Monday | 6 - Sunday\n' +
			'hour\n' +
			'minute',
		components: menu.concat(menu2),
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
		if (i.customId == 'questDayStartTime') {
			setAutomaticQuestStartTime(i.guildId, 0, i.values[0]).then(d => {
				const newMenu = [autoQuestStart(d.settings.autoQuestStartEnabled)];
				const newMenu2 = questStartTime(d.settings.autoQuestStartTime);
				i.editReply({
					content: 'Innocent Wolve Quest Start Settings | UPDATED: ' + new Date().toLocaleString() + '\n' +
						'The format for the questStart below is\n' +
						'day 0 - Monday | 6 - Sunday\n' +
						'hour\n' +
						'minute',
					components: newMenu.concat(newMenu2),
					ephemeral: true,
				});
			}).catch(e => {
				console.log(e);
			});
		}
		if (i.customId == 'questHourStartTime') {
			setAutomaticQuestStartTime(i.guildId, 1, i.values[0]).then(d => {
				const newMenu = [autoQuestStart(d.settings.autoQuestStartEnabled)];
				const newMenu2 = questStartTime(d.settings.autoQuestStartTime);
				i.editReply({
					content: 'Innocent Wolve Quest Start Settings | UPDATED: ' + new Date().toLocaleString() + '\n' +
						'The format for the questStart below is\n' +
						'day 0 - Monday | 6 - Sunday\n' +
						'hour\n' +
						'minute',
					components: newMenu.concat(newMenu2),
					ephemeral: true,
				});
			}).catch(e => {
				console.log(e);
			});
		}
		if (i.customId == 'questMinuteStartTime') {
			setAutomaticQuestStartTime(i.guildId, 2, i.values[0]).then(d => {
				const newMenu = [autoQuestStart(d.settings.autoQuestStartEnabled)];
				const newMenu2 = questStartTime(d.settings.autoQuestStartTime);
				i.editReply({
					content: 'Innocent Wolve Quest Start Settings | UPDATED: ' + new Date().toLocaleString() + '\n' +
						'The format for the questStart below is\n' +
						'day 0 - Monday | 6 - Sunday\n' +
						'hour\n' +
						'minute',
					components: newMenu.concat(newMenu2),
					ephemeral: true,
				});
			}).catch(e => {
				console.log(e);
			});
		}
		if (i.customId == 'questStartEnabled') {
			setAutomaticQuestStart(i.guildId, (i.values[0] == 'true')).then(d => {
				const newMenu = [autoQuestStart(d.settings.autoQuestStartEnabled)];
				const newMenu2 = questStartTime(d.settings.autoQuestStartTime);
				i.editReply({
					content: 'Innocent Wolve Quest Start Settings | UPDATED: ' + new Date().toLocaleString() + '\n' +
						'The format for the questStart below is\n' +
						'day 0 - Monday | 6 - Sunday\n' +
						'hour\n' +
						'minute',
					components: newMenu.concat(newMenu2),
					ephemeral: true,
				});
			}).catch(e => {
				console.log(e);
			});
		}

	});

	collector.on('end', collected => console.log(`Collected ${collected.size} items`));
};
