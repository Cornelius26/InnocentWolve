import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	SlashCommandBuilder,
} from 'discord.js';
import { addUpdateVoting, getLastVoting } from '../../MongoRequests/clanVotings.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { checkAccessRight } from '../../accessManager.js';


export const data = new SlashCommandBuilder()
	.setName('vote')
	.setDMPermission(false)
	.setDescription('Here you can vote for the current Quest');


export const execute = async (interaction) => {
	// check if user has access
	await interaction.deferReply({ ephemeral: true });

	try {
		checkAccessRight(interaction).then(rights => {
			const access = rights[0];
			const userData = rights[2];
			if (access != 'clanNotRegistered' && access != 'noAccess') {
				getLastVoting(userData.clanId._id).then(voting => {
					if (voting.votingActive) {
						response(interaction, voting, userData);
					}
					else {
						interaction.editReply({ content: 'Currently no voting is in progress.', ephemeral: true });

					}
				});
			}
			else {
				interaction.editReply({ content: 'You have no access to this command.', ephemeral: true });
			}
		});
	} catch (e) {
		console.log(e);

		try {
			interaction.editReply({
				content: 'You have no access to the bot or a internal error accured.',
				ephemeral: true,
			});
		} catch (e2) {
			console.log(e2);
		}
	}


};

const answerButtons = (clanVotings, userId) => {
	const urls = [];
	const names = [];
	const questIds = [];
	const numberOfVotes = [];
	const gemQuest = [];
	const userVote = [];
	const userParticipate = [];
	for (const option of clanVotings.questOptions) {
		urls.push(option.promoImageUrl);
		questIds.push(option.id);
		gemQuest.push(option.purchasableWithGems);
		let voteCount = 0;

		let localUserVote = false;
		let localUserParticipate = false;
		for (const vote of option.votings) {
			if (vote.votedFor == true) {
				voteCount++;
			}
			if (vote.clanMemberId._id.toString() == userId.toString()) {
				if (vote.votedFor == true) {
					localUserVote = true;
				}
				if (vote.participation == true) {
					localUserParticipate = true;
				}
			}
		}
		userVote.push(localUserVote);
		userParticipate.push(localUserParticipate);
		numberOfVotes.push(voteCount);
		const urlSplitted = option.promoImageUrl.split('/');
		names.push(urlSplitted[urlSplitted.length - 1].slice(0, -4).toUpperCase());
	}

	const getButtons = (mode) => {
		const arrayOfButtons = [];
		for (const vote in clanVotings.questOptions) {
			arrayOfButtons.push(new ButtonBuilder()
				.setCustomId(questIds[vote] + ':' + mode + ':' + (mode == 'voting' ? (userVote[vote] ? 'false' : 'true') : (userParticipate[vote] ? 'false' : 'true')))
				.setLabel((mode == 'voting' ? '🗳' : '👍') + names[vote])
				.setStyle(((mode == 'voting' ? userVote[vote] : userParticipate[vote]) ? ButtonStyle.Success : ButtonStyle.Danger)),
			);
		}
		return arrayOfButtons;
	};

	return [
		new ActionRowBuilder()
			.addComponents(getButtons('voting')),
		new ActionRowBuilder()
			.addComponents(getButtons('participation')),
	];

};

const votingOverviewImage = async (clanVotings, userId) => {
	const urls = [];
	const names = [];
	const numberOfVotes = [];
	const gemQuest = [];
	const userVote = [];
	const userParticipate = [];
	for (const option of clanVotings.questOptions) {
		urls.push(option.promoImageUrl);
		gemQuest.push(option.purchasableWithGems);
		let voteCount = 0;

		let localUserVote = false;
		let localUserParticipate = false;
		for (const vote of option.votings) {
			if (vote.votedFor == true) {
				voteCount++;
			}
			if (vote.clanMemberId.toString() == userId.toString()) {
				if (vote.votedFor == true) {
					localUserVote = true;
				}
				if (vote.participation == true) {
					localUserParticipate = true;
				}
			}
		}
		userVote.push(localUserVote);
		userParticipate.push(localUserParticipate);
		numberOfVotes.push(voteCount);
		const urlSplitted = option.promoImageUrl.split('/');
		names.push(urlSplitted[urlSplitted.length - 1].slice(0, -4).toUpperCase());
	}

	const images = [];
	for (const url of urls) {
		images.push(await loadImage(url.slice(0, -4) + url.slice(-4)));// '@2x' + url.slice(-4)));

	}
	let neededHeight = 0;
	for (const image of images) {
		neededHeight += image.height;
	}
	let maxWidthImages = 0;
	for (const image of images) {
		if (image.width > maxWidthImages) {
			maxWidthImages = image.width;
		}

	}

	const canvas = createCanvas(maxWidthImages * 2, neededHeight);

	const context = canvas.getContext('2d');
	context.strokeStyle = '#340505';
	context.fillRect(0, 0, canvas.width, canvas.height);

	// context.beginPath();
	// context.arc(125, 125, 100, 0, Math.PI * 2, true);
	// context.closePath();
	// context.clip();
	for (const image in images) {
		context.drawImage(images[image], 0, images[image].height * image, images[image].width, images[image].height);
		context.strokeStyle = '#000000';
		context.strokeRect(0, images[image].height * image, images[image].width, images[image].width);

		context.font = process.env.ENVIROMENT == 'production' ? '30 DejaVu Sans' : '30px sans-serif';
		context.fillStyle = '#ffffff';
		context.fillText(names[image], images[image].width + 20, images[image].height * image + images[image].height / 2 - 80);

		context.font = process.env.ENVIROMENT == 'production' ? '20px DejaVu Sans' : '20px sans-serif';
		context.fillText(gemQuest[image] ? 'Gem Quest' : 'Gold Quest', images[image].width + 45, images[image].height * image + images[image].height / 2 - 50);
		context.fillText(numberOfVotes[image] + ' - Number of Votes for this Quest', images[image].width + 30, images[image].height * image + images[image].height / 2 - 10);
		context.fillText('- You Voted', images[image].width + 35, images[image].height * image + images[image].height / 2 + 40);
		context.fillText('- You Like to Participate', images[image].width + 35, images[image].height * image + images[image].height / 2 + 70);

		context.font = process.env.ENVIROMENT == 'production' ? '20px Noto Color Emoji' : '20px sans-serif';
		context.fillText((gemQuest[image] ? '💎' : '💰'), images[image].width + 20, images[image].height * image + images[image].height / 2 - 50);
		context.fillText(userVote[image] ? '✔' : '❌', images[image].width + 20, images[image].height * image + images[image].height / 2 + 40);
		context.fillText(userParticipate[image] ? '✔' : '❌', images[image].width + 20, images[image].height * image + images[image].height / 2 + 70);

	}

	return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile-image.png' });


};

const getVoted = (userId, votedFor, participation) => {
	return { clanMemberId: userId, votedFor: votedFor, participation: participation };

};

const response = async (interaction, clanVotings, userData) => {
	const userId = userData._id;
	// const menu = row(clanInformation.settings.allowCoLeaderAccess);

	const attachment = await votingOverviewImage(clanVotings, userId);
	const votingButtons = answerButtons(clanVotings, userId);
	interaction.editReply({
		content: 'Here you can vote for the current quest. With 🗳 you vote for the quest. With 👍 you like to participate in the Quest.',
		files: [attachment],
		components: votingButtons,
		ephemeral: true,
	});
	// interaction.editReply({ content: 'Innocent Wolve Settings', components: [menu], ephemeral: true });
	const collector = interaction.channel.createMessageComponentCollector({ time: 120000 });

	collector.on('collect', async i => {
		await i.deferUpdate({ ephemeral: true });
		// i.editReply({ content: 'loading...', files: [], components: [], ephemeral: true });
		for (const questOption of clanVotings.questOptions) {

			if (i.customId.split(':')[0] == questOption.id) {
				if ((questOption.purchasableWithGems == true && userData.gemsBalance >= userData.clanId.settings.defaultQuestPriceGem) ||
					(questOption.purchasableWithGems == false && userData.goldBalance >= userData.clanId.settings.defaultQuestPriceGold)) {
					if (i.customId.split(':')[1] == 'voting') {
						const voteOption = getVoted(userId, (i.customId.split(':')[2] == 'true'), null);

						addUpdateVoting(clanVotings._id, userId, questOption.id, voteOption).then(async d => {
							const newAttachment = await votingOverviewImage(d, userId);
							const newVotingButtons = answerButtons(d, userId);
							i.editReply({
								content: 'Here you can vote for the current quest. With 🗳 you vote for the quest. With 👍 you like to participate in the Quest.',
								files: [newAttachment],
								components: newVotingButtons,
								ephemeral: true,
							});
						});

						break;
					}
					else if (i.customId.split(':')[1] == 'participation') {

						const voteOption = getVoted(userId, null, (i.customId.split(':')[2] == 'true'));
						addUpdateVoting(clanVotings._id, userId, questOption.id, voteOption).then(async d => {

							const newAttachment = await votingOverviewImage(d, userId);
							const newVotingButtons = answerButtons(d, userId);
							i.editReply({
								content: 'Here you can vote for the current quest. With 🗳 you vote for the quest. With 👍 you like to participate in the Quest.',
								files: [newAttachment],
								components: newVotingButtons,
								ephemeral: true,
							});
						});
						break;
					}
				}
				else {
					i.editReply({
						content: 'Here you can vote for the current quest. With 🗳 you vote for the quest. With 👍 you like to participate in the Quest.\n' +
							'You do not have enough balance to join this quest.',
						files: [], components: [], ephemeral: true,
					});
				}
			}
		}
	});

	collector.on('end', collected => console.log(`Collected ${collected.size} items`));
};