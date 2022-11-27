import {
	AttachmentBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { checkAccessRight } from '../../accessManager.js';
import { getUserById } from '../../wolvesVille/WolvesVilleRequests.js';

if (process.env.ENVIROMENT == 'production') {
	console.log("load")
	GlobalFonts.registerFromPath('~/NotoColorEmoji-Regular.ttf', 'Google Emoji');
}

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
	console.log(url);
	return loadImage(url).then(image => {
		return loadImage('https://cdn.wolvesville.com/backgrounds/wolvesville_large_day.wide@2x.png').then(backgroundimage => {
			const neededHeight = image.height;
			const maxWidthImages = image.width;


			const canvas = createCanvas(maxWidthImages * 3, neededHeight);

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
			context.font = '70px sans-serif';
			if (process.env.ENVIROMENT == 'production') {
				context.font = '70px Google Emoji';
			}
			context.fillStyle = '#ffffff';
			context.fillText(wolvesvilleMemberData.username, image.width + 20, 80);
			context.font = '50px sans-serif';
			if (process.env.ENVIROMENT == 'production') {
				context.font = '50px Google Emoji';
			}
			context.fillText('💰', image.width + 20, 150);
			context.fillText('💎', image.width + 20, 210);
			context.fillText('Current Gold Balance ' + clanMember.goldBalance.toString(), image.width + 100, 150);
			context.fillText('Current Gem Balance ' + clanMember.gemsBalance.toString(), image.width + 100, 210);
			context.font = '40px sans-serif';
			if (process.env.ENVIROMENT == 'production') {
				context.font = '40px Google Emoji';
			}
			context.fillText('💰', image.width + 20 + 15, 270);
			context.fillText('💎', image.width + 20 + 15, 320);
			context.fillText('Total Gold Donated ' + clanMember.goldDonated.toString(), image.width + 100, 270);
			context.fillText('Total Gems Donated ' + clanMember.gemsDonated.toString(), image.width + 100, 320);


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