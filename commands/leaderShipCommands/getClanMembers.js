import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	SelectMenuBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { getMember, getMemberOfClan } from '../../MongoRequests/clanMembers.js';
import { getClanMembers, getUserById, getWolvesvilleClan } from '../../wolvesVille/WolvesVilleRequests.js';
import { getClan, setColeaderAccess } from '../../MongoRequests/clans.js';
import { checkAccessRight } from '../../accessManager.js';
import { getLastVoting, getLastVotingWeek } from '../../MongoRequests/clanVotings.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { questVotings } from '../../mongoModel.js';

export const data = new SlashCommandBuilder()
	.setName('get_members_info')
	.setDMPermission(false)
	.setDescription('The clan leader can see infos about the clanmembers here.');


export const execute = async (interaction) => {
	// check if user has access
	await interaction.deferReply({ ephemeral: true });
	try {
		checkAccessRight(interaction).then(rights => {
			const access = rights[0];
			const coLeaderAcess = rights[1];
			const userData = rights[2];
			if (access == 'leader' || access == 'coLeader') {
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

const getAllClanUsersInformation = async (clanId, wolvesvilleId) => {
	const botMembers = await getMemberOfClan(clanId);
	let clanMembers = await getClanMembers(wolvesvilleId);
	clanMembers = clanMembers.body;
	const replyText = [];
	replyText.push(['Name', 'Auth', 'Gold', 'Gems']);

	for (const clanMember of clanMembers) {
		let memberIndex = -1;
		let count = 0;
		for (const botMember of botMembers) {
			if (botMember.wolvesvilleId == clanMember.playerId) {
				memberIndex = count;
			}
			count++;
		}
		if (memberIndex != -1) {
			replyText.push([clanMember.username, '✔', botMembers[memberIndex].goldBalance.toString(), botMembers[memberIndex].gemsBalance.toString()]);
		}
		else {
			replyText.push([clanMember.username, '❌', '-----', '-----']);
		}

	}
	const textSize = 12;
	const canvas = createCanvas(250, 15 * replyText.length + 10);
	const context = canvas.getContext('2d');
	context.fillStyle = '#2b2b2b';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.strokeStyle = '#e2e2e2';
	context.fillStyle = '#e2e2e2';
	context.font = process.env.ENVIROMENT == 'production' ? `${textSize}px DejaVu Sans` : `${textSize}px sans-serif`;
	let start = 17;
	for (const text of replyText) {
		context.fillText(text[0], 5, start);
		context.font = process.env.ENVIROMENT == 'production' ? `${textSize}px Noto Color Emoji` : `${textSize}px sans-serif`;
		context.fillText(text[1], 115, start);
		context.font = process.env.ENVIROMENT == 'production' ? `${textSize}px DejaVu Sans` : `${textSize}px sans-serif`;
		context.fillText(text[2], 155, start);
		context.fillText(text[3], 205, start);
		start += 15;
	}
	return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile-image.png' });

};


const userHasAccessResponse = async (interaction, clanInformation) => {
	const attachment = await getAllClanUsersInformation(clanInformation._id, clanInformation.clanId);

	interaction.editReply({
		content: '',
		files: [attachment],
		components: [],
		ephemeral: true,
	});
};