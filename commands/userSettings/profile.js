import {
	AttachmentBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { checkAccessRight } from '../../accessManager.js';
import { getUserById } from '../../wolvesVille/WolvesVilleRequests.js';


/**
 * Create Command to Show Profile
 * Options:
 * public and private answer
 * @type {Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">}
 */
export const data = new SlashCommandBuilder()
	.setName('profile')
	.setDMPermission(false)
	.setDescription('Here you can get an overview of your profile.')
	.addStringOption(option =>
		option.setName('visibility')
			.setDescription('Option to show your profile to everybody')
			.setRequired(true)
			.addChoices(
				{ name: 'Private', value: 'true' },
				{ name: 'Public', value: 'false' },
			));

/**
 * After calling the /profile command
 * check access and return the profile image
 * @param interaction
 * @returns {Promise<void>}
 */
export const execute = async (interaction) => {
	// check if user has access
	await interaction.deferReply({ ephemeral: (interaction.options.getString('visibility') == 'true') });
	try {
		// A outsourced often used function that checks the user access permissions
		checkAccessRight(interaction).then(rights => {
			const access = rights[0];
			const userData = rights[2];
			if (access != 'clanNotRegistered' && access != 'noAccess') {
				// Get the user data and create the response
				getUserById(userData.wolvesvilleId).then(d => {
					response(interaction, userData, d.body);
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


/**
 * Create the user image
 * @param clanMember
 * @param wolvesvilleMemberData
 * @returns {Promise<AttachmentBuilder>}
 */
const profileImage = async (clanMember, wolvesvilleMemberData) => {

	const url = wolvesvilleMemberData.equippedAvatar.url.slice(0, -4) + '@3x' + wolvesvilleMemberData.equippedAvatar.url.slice(-4);
	return loadImage(url).then(image => {
		return loadImage('https://cdn.wolvesville.com/backgrounds/wolvesville_large_day.wide@2x.png').then(backgroundimage => {
			const neededHeight = image.height;
			const maxWidthImages = backgroundimage + image.width;


			const canvas = createCanvas(maxWidthImages, neededHeight);
			const getTextWidth = (text, font) => {
				// if given, use cached canvas for better performance
				// else, create new canvas
				const localContext = canvas.getContext('2d');
				localContext.font = font;
				const metrics = localContext.measureText(text);
				return metrics.width;
			};


			const context = canvas.getContext('2d');
			context.fillStyle = '#e2e2e2';
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.drawImage(backgroundimage, -20, (canvas.height - backgroundimage.height) / 2, backgroundimage.width, backgroundimage.height);
			context.fillStyle = 'rgba(24,24,24,0.4)';
			context.fillRect(image.width, 0, canvas.width - image.width, canvas.height);
			context.fillStyle = '#ffffff';
			// context.fillRect(1, 1, image.width, image.height);
			context.drawImage(image, 0, 0, image.width, image.height);
			context.strokeStyle = '#000000';

			const outerMarginSize = image.height * 0.06;
			const innerMarginSize = image.height * 0.04;
			const titleSize = image.height * 0.18;
			const balanceSize = image.height * 0.15;
			const donatedSize = image.height * 0.11;
			const leftMarginSize = maxWidthImages * 0.10;
			const titlePosition = outerMarginSize + titleSize;
			const balancePosition1 = titlePosition + outerMarginSize + balanceSize;
			const balancePosition2 = balancePosition1 + innerMarginSize + balanceSize;
			const donatedPosition1 = balancePosition2 + innerMarginSize + donatedSize;
			const donatedPosition2 = donatedPosition1 + innerMarginSize + donatedSize;

			context.font = process.env.ENVIROMENT == 'production' ? `${titleSize}px DejaVu Sans` : `${titleSize}px sans-serif`;
			context.fillStyle = '#ffffff';
			context.fillText(wolvesvilleMemberData.username, image.width + leftMarginSize, titlePosition);

			context.font = process.env.ENVIROMENT == 'production' ? `${balanceSize}px Noto Color Emoji` : `${balanceSize}px sans-serif`;
			context.fillText('💰', image.width + leftMarginSize, balancePosition1);
			context.fillText('💎', image.width + leftMarginSize, balancePosition2);
			const balanceEmojiWidth1 = getTextWidth('💰 ', context.font);
			const balanceEmojiWidth2 = getTextWidth('💎 ', context.font);

			context.font = process.env.ENVIROMENT == 'production' ? `${balanceSize}px DejaVu Sans` : `${balanceSize}px sans-serif`;
			context.fillText('Current Gold Balance ' + clanMember.goldBalance.toString(), image.width + balanceEmojiWidth1, balancePosition1);
			context.fillText('Current Gem Balance ' + clanMember.gemsBalance.toString(), image.width + balanceEmojiWidth2, balancePosition2);

			context.font = process.env.ENVIROMENT == 'production' ? `${donatedSize}px Noto Color Emoji` : `${donatedSize}px sans-serif`;
			context.fillText('💰', image.width + leftMarginSize, donatedPosition1);
			context.fillText('💎', image.width + leftMarginSize, donatedPosition2);
			const donatedEmojiWidth1 = getTextWidth('💰 ', context.font);
			const donatedEmojiWidth2 = getTextWidth('💎 ', context.font);
			context.font = process.env.ENVIROMENT == 'production' ? `${donatedSize}px DejaVu Sans` : `${donatedSize}px sans-serif`;
			context.fillText('Total Gold Donated ' + clanMember.goldDonated.toString(), image.width + donatedEmojiWidth1, donatedPosition1);
			context.fillText('Total Gems Donated ' + clanMember.gemsDonated.toString(), image.width + donatedEmojiWidth2, donatedPosition2);


			return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile-image.png' });

		});

	});


}
;

/**
 * Display the user image
 * @param interaction
 * @param userData
 * @param wolvesVilleUserData
 * @returns {Promise<void>}
 */
const response = async (interaction, userData, wolvesVilleUserData) => {
	// const menu = row(clanInformation.settings.allowCoLeaderAccess);

	const attachment = await profileImage(userData, wolvesVilleUserData);
	interaction.editReply({ files: [attachment], ephemeral: (interaction.options.getString('visibility') == 'true') });

};