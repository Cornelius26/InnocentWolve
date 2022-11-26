import cryptoRandomString from 'crypto-random-string';
import { clanMembers as ClanMembers, clans as Clans } from '../mongoModel.js';
import { fileURLToPath } from 'url';
import path from 'path';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Integration } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

dotenv.config(__dirname);

const CodeValidDays = process.env.CODE_VALID_DAYS;

// get member
export const getMember = async (id) => {
	return ClanMembers.findOne({ id: id }).populate('clanId').exec().then(data => {
		return data;
	}).catch(err => {
		throw new Error(err);
	});
};
export const getClansMemberByClanObjectID = async (id) => {
	return ClanMembers.find({ clanId: id }).populate('clanId').exec().then(data => {
		return data;
	}).catch(err => {
		throw new Error(err);
	});
};
export const deleteById = async id => {
	return ClanMembers.deleteOne({ _id: id }).exec().then(data => {
		return data;
	}).catch(err => {
		throw new Error(err);
	});
};

export const getMemberByDiscordId = async (id) => {
	return ClanMembers.findOne({ discordId: id }).populate('clanId').exec().then(data => {
		return data;
	}).catch(err => {
		throw new Error(err);
	});
};
export const createMember = async (userID, localClanId, discordId) => {
	const authCode = cryptoRandomString({ length: 6, type: 'distinguishable' });
	const newMember = new ClanMembers({
		wolvesvilleId: userID,
		authenticationDiscordID: discordId,
		clanId: localClanId,
		authenticationCode: authCode,
		authenticationCodeValidUntil: new Date().setDate(new Date().getDate() + parseInt(CodeValidDays)),
	});
	try {
		await newMember.save();
		return authCode;
	}
	catch (err) {
		throw new Error(err);
	}
};
// create Member
// returns pin


export const getPendingCodes = async (clanId) => {
	return Clans.findOne({ clanId: clanId })
		.exec()
		.then(clan => {
			clanId = clan._id;
			return ClanMembers.find({
				clanId: clanId,
				authenticationCodeValidUntil: { $gt: new Date() },
			})
				.exec()
				.then(data => {
					return data;
				}).catch(err => {
					throw new Error(err);
				});
		}).catch(err => {
			throw new Error(err);
		});

};
export const activateMember = (_id) => {
	ClanMembers.findById(_id).exec().then(clanMember => {
		clanMember.discordId = clanMember.authenticationDiscordID;
		clanMember.authenticationDiscordID = null;
		clanMember.authenticated = true;
		clanMember.authenticationCode = null;
		clanMember.authenticationCodeValidUntil = null;
		clanMember.save();
	});
};

export const addDonateGoldAndGemToUser = async (_clanId, wolvesVilleId, gold, gems) => {
	return ClanMembers.findOne({ clanId: _clanId, wolvesvilleId: wolvesVilleId }).exec().then(member => {
		member.goldDonated += gold;
		member.goldBalance += gold;
		member.gemsDonated += gems;
		member.gemsBalance += gems;
		return member.save();
	}).catch(e => {
		console.log(e);
	});
};
export const removeGoldAndGemFromUser = async (_clanId, wolvesVilleId, gold, gems) => {
	return ClanMembers.findOne({ clanId: _clanId, wolvesvilleId: wolvesVilleId }).exec().then(member => {
		member.goldDonated -= gold;
		member.goldBalance -= gold;
		member.gemsDonated -= gems;
		member.gemsBalance -= gems;
		return member.save();
	}).catch(e => {
		console.log(e);
	});
};