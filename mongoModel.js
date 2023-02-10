import mongoose from './mongoConnection.js';

const Schema = mongoose.Schema;

const clansSchema = new Schema({
	clanId: { type: String, required: true, unique: true },
	guildId: { type: String, default: null, unique: true },
	lastCheckLedger: { type: Date, required: true, default: new Date() },
	lastCheckChat: { type: Date, required: true, default: new Date() },
	lastCheckLog: { type: Date, required: true, default: new Date() },
	clanActive: { type: Boolean, required: true, default: true },
	welcomeMessageActive: { type: Boolean, default: false, required: true },
	welcomeMessage: { type: String, default: '', required: true },
	clanInactiveSince: { type: Date },
	settings: {
		autoQuestStartEnabled: { type: Boolean, default: true, required: true },
		autoQuestStartTime: { type: String, required: true, default: '3.12.00' },
		autoVotingTimeStart: { type: String, required: true, default: '2.23.55' },
		autoVotingTimeEnd: { type: String, required: true, default: '1.01.00' },
		autoNewVotingEnabled: { type: Boolean, default: true, required: true },
		allowGoldTransfer: { type: Boolean, default: true, required: true },
		allowGemTransfer: { type: Boolean, default: true, required: true },
		allowCoLeaderAccess: { type: Boolean, default: false, required: true },
		defaultQuestPriceGold: { type: Number, default: 500, required: true },
		defaultQuestPriceGem: { type: Number, default: 300, required: true },
		dynamicPricing: { type: Boolean, default: false },
		pricingAddOnGold: { type: Number, default: 0, required: true },
		pricingAddOnGem: { type: Number, default: 0, required: true },
	},
});
export const clans = mongoose.model('clans', clansSchema);

const clanMembersSchema = new Schema({
	wolvesvilleId: { type: String, required: true, unique: true, index: true, sparse: true },
	discordId: { type: String, unique: true, index: true, sparse: true },
	currentClanMember: { type: Boolean, required: true, default: true },
	clanLeft: { type: Date },
	clanId: { type: Schema.Types.ObjectId, ref: 'clans', required: true },
	// choosenAvatar: {type: Number, default: 0, required: true},
	// avatarURL: {type: String, required: true},
	goldDonated: { type: Number, default: 0, required: true },
	goldBalance: { type: Number, default: 0, required: true },
	gemsDonated: { type: Number, default: 0, required: true },
	gemsBalance: { type: Number, default: 0, required: true },
	gemsTransfered: { type: Number, default: 0, required: true },
	goldTransfered: { type: Number, default: 0, required: true },
	gemsReceived: { type: Number, default: 0, required: true },
	goldReceived: { type: Number, default: 0, required: true },
	votingsParticipated: { type: Number, default: 0, required: true },
	authenticated: { type: Boolean, default: false, required: true },
	authenticationCode: { type: String },
	authenticationDiscordID: { type: String },
	authenticationCodeValidUntil: { type: Date },
});

export const clanMembers = mongoose.model('clanMembers', clanMembersSchema);


const questVotingsSchema = new Schema({
	votingForClan: { type: Schema.Types.ObjectId, ref: 'clans', required: true },
	// check if active is current quest, else notify that owner has to update
	votingActive: { type: Boolean, required: true, default: true },
	votingStarted: { type: Date, required: true, default: new Date() },
	calenderWeek: { type: Number, required: true },
	votingEnded: { type: Date },
	questStarted: { type: Boolean, required: true, default: false },
	questWon: { type: Number },
	questStartedDate: { type: Date },
	year: { type: Number, required: true },
	questOptions: [
		{
			id: { type: String, required: true },
			purchasableWithGems: { type: Boolean, required: true },
			promoImagePrimaryColor: { type: String, required: true },
			promoImageUrl: { type: String, required: true },
			questStart: { type: Date },
			questParticipants: [
				{
					type: Schema.Types.ObjectId,
					ref: 'clanMembers',
					required: true,
				}],
			votings: [
				{
					clanMemberId: {
						type: Schema.Types.ObjectId,
						ref: 'clanMembers',
						required: true,
					}, votedFor: {
						type: Boolean,
					}, participation: {
						type: Boolean,
					},
				}],
		}],
});

export const questVotings = mongoose.model('questVotings', questVotingsSchema);

const logsSchema = new Schema({
	clanId: { type: Schema.Types.ObjectId, ref: 'clans', required: true },
	logType: {
		type: String,
		enum: [
			'donation',
			'transfer',
			'participationStatus',
			'quest',
			'voting',
			'authentication',
			'clanSettings',
		],
	},
	content: { type: String, required: true },
});

export const logs = mongoose.model('logs', logsSchema);


const transactionsSchema = new Schema({
	clanId: { type: Schema.Types.ObjectId, ref: 'clans', required: true },
	transferType: { type: String, enum: ['gems', 'gold'], required: true },
	date: { type: Date, required: true },
	sender: {
		type: Schema.Types.ObjectId,
		ref: 'clanMembers',
		required: true,
	},
	receiver: {
		type: Schema.Types.ObjectId,
		ref: 'clanMembers',
		required: true,
	},

});
export const transactions = mongoose.model('transactions', transactionsSchema);

