import { clans as Clans } from '../mongoModel.js';


export const getAllClans = async () => {
	return await Clans.find().exec().then(data => {
		return data;
	}).catch(err => {
		throw new Error(err);
	});
};
export const getAllActiveClans = async () => {
	return await Clans.find({ clanActive:true }).exec().then(data => {
		return data;
	}).catch(err => {
		throw new Error(err);
	});
};
export const getClan = async (clanId) => {
	return await Clans.findOne({ clanId: clanId }).exec().then(data => {
		return data;
	}).catch(err => {
		console.log(err);
		throw new Error(err);
	});
};
export const updateClanChatCheck = async (clanObjectId) => {
	return Clans.findByIdAndUpdate(clanObjectId, { lastCheckChat: new Date() });
};
export const setClanDiscordId = async (clanId, discordId) => {
	return Clans.findOne({ clanId: clanId }).exec().then(foundClan => {
		foundClan.guildId = discordId;
		foundClan.save();
	});
};
export const createClan = (clanId) => {
	const newClan = new Clans({ clanId: clanId });
	newClan.save();
};
export const deactivateClan = (clanId) => {
	Clans.findOneAndUpdate(
		{ clanId: clanId },
		{ clanActive: false, clanInactiveSince: new Date() })
		.exec();
};

export const activateClan = (clanId) => {
	Clans.findOneAndUpdate(
		{ clanId: clanId },
		{ clanActive: true, clanInactiveSince: null })
		.exec();
};
export const setColeaderAccess = (guildId, access) => {
	return Clans.findOne({ guildId: guildId }).exec().then(foundClan => {
		foundClan.settings.allowCoLeaderAccess = access;
		return foundClan.save();
	});
};

export const setAutomaticVoteStart = (guildId, enabled) => {
	return Clans.findOne({ guildId: guildId }).exec().then(foundClan => {
		foundClan.settings.autoNewVotingEnabled = enabled;
		return foundClan.save();
	});
};
export const setAutomaticVoteStartTime = (guildId, field, time) => {
	console.log('update');
	return Clans.findOne({ guildId: guildId }).exec().then(foundClan => {
		if (field == 0) {
			foundClan.settings.autoVotingTimeStart = time.toString() + foundClan.settings.autoVotingTimeStart.slice(1);
		}
		else if (field == 1) {
			foundClan.settings.autoVotingTimeStart = foundClan.settings.autoVotingTimeStart.slice(0, 2) + time.toString().padStart(2, '0') + foundClan.settings.autoVotingTimeStart.slice(4);
		}
		else if (field == 2) {
			foundClan.settings.autoVotingTimeStart = foundClan.settings.autoVotingTimeStart.slice(0, 5) + time.toString().padStart(2, '0');
		}

		return foundClan.save();
	});
};

export const setAutomaticVoteEndTime = (guildId, field, time) => {
	console.log('update');
	return Clans.findOne({ guildId: guildId }).exec().then(foundClan => {
		if (field == 0) {
			foundClan.settings.autoVotingTimeEnd = time.toString() + foundClan.settings.autoVotingTimeEnd.slice(1);
		}
		else if (field == 1) {
			foundClan.settings.autoVotingTimeEnd = foundClan.settings.autoVotingTimeEnd.slice(0, 2) + time.toString().padStart(2, '0') + foundClan.settings.autoVotingTimeEnd.slice(4);
		}
		else if (field == 2) {
			foundClan.settings.autoVotingTimeEnd = foundClan.settings.autoVotingTimeEnd.slice(0, 5) + time.toString().padStart(2, '0');
		}

		return foundClan.save();
	});
};
export const setAutomaticQuestStart = (guildId, enabled) => {
	return Clans.findOne({ guildId: guildId }).exec().then(foundClan => {
		foundClan.settings.autoQuestStartEnabled = enabled;
		return foundClan.save();
	});
};
export const setAutomaticQuestStartTime = (guildId, field, time) => {
	return Clans.findOne({ guildId: guildId }).exec().then(foundClan => {
		if (field == 0) {
			foundClan.settings.autoQuestStartTime = time.toString() + foundClan.settings.autoQuestStartTime.slice(1);
		}
		else if (field == 1) {
			foundClan.settings.autoQuestStartTime = foundClan.settings.autoQuestStartTime.slice(0, 2) + time.toString().padStart(2, '0') + foundClan.settings.autoQuestStartTime.slice(4);
		}
		else if (field == 2) {
			foundClan.settings.autoQuestStartTime = foundClan.settings.autoQuestStartTime.slice(0, 5) + time.toString().padStart(2, '0');
		}

		return foundClan.save();
	});
};
export const updateLedgerTime = (clan_id, time) => {
	return Clans.findById(clan_id).exec().then(clan => {
		clan.lastCheckLedger = time;
		return clan.save();
	});
};
