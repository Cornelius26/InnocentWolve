import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	SelectMenuBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { getMember } from '../../MongoRequests/clanMembers.js';
import { getClanMembers, getUserById, getWolvesvilleClan } from '../../wolvesVille/WolvesVilleRequests.js';
import { getClan, setColeaderAccess } from '../../MongoRequests/clans.js';
import { checkAccessRight } from '../../accessManager.js';
import { getLastVoting, getLastVotingWeek } from '../../MongoRequests/clanVotings.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { questVotings } from '../../mongoModel.js';

export const data = new SlashCommandBuilder()
	.setName('voting_result_leader')
	.setDMPermission(false)
	.setDescription('The clan leader can see the results of an quest voting by user here.')
	.addNumberOption(option =>
		option.setName('week')
			.setDescription('Option to show your profile to everybody')
			.setRequired(false));


export const execute = async (interaction) => {
	// check if user has access
	await interaction.deferReply({ ephemeral: true });
	try {
		checkAccessRight(interaction).then(rights => {
			const access = rights[0];
			const coLeaderAcess = rights[1];
			const userData = rights[2];
			if (access == 'leader' || access == 'coLeader' ) {
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

const buildVotingResult = async (voting) => {
	const images = [];
	const numberOfVotes = [];
	const numberOfParticipates = [];

	const names = [];

	const leftMargin = 20;

	const margins = 10;
	const smallMargins = 10;
	const titleHeight = 20;
	const subtitleHeight = 16;
	const textHeight = 14;

	let neededHeight = 0;

	//header Row
	neededHeight += margins + titleHeight + margins;

	neededHeight += +titleHeight + smallMargins; // for winner
	let c = 0;
	for (const option of voting.questOptions) {
		const urlSplitted = option.promoImageUrl.split('/');
		names.push(urlSplitted[urlSplitted.length - 1].slice(0, -4).toUpperCase());
		images.push(await loadImage(option.promoImageUrl.slice(0, -4) + option.promoImageUrl.slice(-4)));// '@2x' + url.slice(-4)));

		neededHeight += images[c].height;
		c++;
		neededHeight += smallMargins + titleHeight + smallMargins; // Questname

		neededHeight += subtitleHeight + smallMargins; // Questtype
		neededHeight += subtitleHeight + smallMargins; // Number of votes
		neededHeight += subtitleHeight + smallMargins; // Number of participates

		neededHeight += subtitleHeight + smallMargins; // Voters
		neededHeight += subtitleHeight + smallMargins; // Participaters


		let votes = 0;
		let participates = 0;
		for (const voter of option.votings) {
			if (voter.votedFor == true) {
				votes++;
			}
			if (voter.participation == true) {
				participates++;
			}
		}
		numberOfVotes.push(votes);
		numberOfParticipates.push(participates);
		neededHeight += textHeight * votes + smallMargins * votes;
		neededHeight += textHeight * participates + smallMargins * votes;
		neededHeight +=margins

	}
	for (const option of voting.questOptions) {
		let voteCount = 0;
		for (const vote of option.votings) {
			if (vote.votedFor == true) {
				voteCount++;
			}
		}
		numberOfVotes.push(voteCount);
	}
	const max = Math.max.apply(null, numberOfVotes);
	const itemWonIndex = numberOfVotes.indexOf(max);

	const canvas = createCanvas(images[0].width, neededHeight);
	const context = canvas.getContext('2d');
	context.fillStyle = 'rgba(24,24,24,0.4)';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#ffffff';
	let textPosition = 0;
	textPosition += margins + titleHeight;
	context.font = process.env.ENVIROMENT == 'production' ? `${titleHeight}px DejaVu Sans` : `${titleHeight}px sans-serif`;
	context.fillText('QuestVoting of Week ' + voting.calenderWeek, leftMargin, textPosition);
	textPosition += margins;
	let counter = 0;
	const nameMap = new Map();
	for (const option of voting.questOptions) {
		context.drawImage(images[counter], 0, textPosition, images[counter].width, images[counter].height);
		textPosition += images[counter].height + smallMargins + titleHeight;
		context.font = process.env.ENVIROMENT == 'production' ? `${titleHeight}px DejaVu Sans` : `${titleHeight}px sans-serif`;
		context.fillText(names[counter], leftMargin, textPosition);
		if (counter == itemWonIndex) {
			textPosition += smallMargins + subtitleHeight;
			context.font = process.env.ENVIROMENT == 'production' ? `${subtitleHeight}px DejaVu Sans` : `${subtitleHeight}px sans-serif`;
			context.fillText('WINNER', leftMargin, textPosition);
		}

		textPosition += smallMargins + titleHeight;

		context.font = process.env.ENVIROMENT == 'production' ? `${subtitleHeight}px DejaVu Sans` : `${subtitleHeight}px sans-serif`;
		context.fillText(option.purchasableWithGems ? 'GEM QUEST' : 'GOLD QUEST', leftMargin, textPosition);
		textPosition += smallMargins + subtitleHeight;
		context.fillText('Votes for this Quest: ' + numberOfVotes[counter].toString(), leftMargin, textPosition);
		textPosition += smallMargins + subtitleHeight;
		context.fillText('Wanted to Participate: ' + numberOfParticipates[counter].toString(), leftMargin, textPosition);

		textPosition += smallMargins + subtitleHeight;
		context.font = process.env.ENVIROMENT == 'production' ? `${subtitleHeight}px DejaVu Sans` : `${subtitleHeight}px sans-serif`;
		context.fillText('Voted for this Quest:', leftMargin, textPosition);
		for (const vote of option.votings) {
			if (vote.votedFor == true) {
				let name;
				if (vote.clanMemberId == null) {
					name = 'Unbekannter Spieler';
				}
				else {
					name = nameMap.get(vote.clanMemberId.wolvesvilleId);
					if (name == undefined) {
						name = await getUserById(vote.clanMemberId.wolvesvilleId);
						name = name.body.username;
						if (name == undefined) {
							name = 'Unbekannter Spieler';
						}
						nameMap.set(vote.clanMemberId.wolvesvilleId, name);
					}
				}

				textPosition += smallMargins + textHeight;
				context.font = process.env.ENVIROMENT == 'production' ? `${textHeight}px DejaVu Sans` : `${textHeight}px sans-serif`;
				context.fillText(name, leftMargin, textPosition);
			}
		}
		textPosition += smallMargins + subtitleHeight;
		context.font = process.env.ENVIROMENT == 'production' ? `${subtitleHeight}px DejaVu Sans` : `${subtitleHeight}px sans-serif`;
		context.fillText('Wanted to participate in this Quest:', leftMargin, textPosition);
		for (const vote of option.votings) {
			if (vote.participation == true) {
				let name;
				if (vote.clanMemberId == null) {
					name = 'Unbekannter Spieler';
				}
				else {
					name = nameMap.get(vote.clanMemberId.wolvesvilleId);
					if (name == undefined) {
						name = await getUserById(vote.clanMemberId.wolvesvilleId);
						name = name.body.username;
						if (name == undefined) {
							name = 'Unbekannter Spieler';
						}
						nameMap.set(vote.clanMemberId.wolvesvilleId, name);
					}
				}

				textPosition += smallMargins + textHeight;
				context.font = process.env.ENVIROMENT == 'production' ? `${textHeight}px DejaVu Sans` : `${textHeight}px sans-serif`;
				context.fillText(name, leftMargin, textPosition);
			}
		}
		textPosition += margins;
		counter += 1;

	}
	return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile-image.png' });


};


const userHasAccessResponse = async (interaction, clanInformation) => {
	if (interaction.options.getNumber('week') != undefined) {
		getLastVotingWeek(clanInformation._id, interaction.options.getNumber('week')).then(async voting => {
				const attachment = await buildVotingResult(voting);
				interaction.editReply({ content: 'Voting Results', files: [attachment], components: [], ephemeral: true });
			},
		);
	}
	else {
		getLastVoting(clanInformation._id).then(async voting => {
				const attachment = await buildVotingResult(voting);
				interaction.editReply({ content: 'Voting Results', files: [attachment], components: [], ephemeral: true });
			},
		);
	}
};