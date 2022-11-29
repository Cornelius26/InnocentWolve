import { questVotings as QuestVotings } from '../mongoModel.js';
import { getQuestes } from '../wolvesVille/WolvesVilleRequests.js';

export const getLastVoting = async (clanId) => {
	return QuestVotings.findOne({ votingForClan: clanId }).sort({ votingStarted: -1 }).populate('questOptions.votings.clanMemberId').exec().then(d => {
		return d;
	}).catch(e => {
		throw new Error(e);
	},
	);
};
export const getLastVotingWeek = async (clanId, week) => {
	return QuestVotings.findOne({
		votingForClan: clanId,
		calenderWeek: week,
	}).sort({ votingStarted: -1 }).populate('questOptions.votings.clanMemberId').exec().then(d => {
		return d;
	}).catch(e => {
		throw new Error(e);
	});
};
Date.prototype.getWeekNumber = () => {
	const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export const createVoting = async (wolvesVilleClanId, clanId) => {
	getQuestes(wolvesVilleClanId).then(d => {
		const questOptions = [];
		for (const quest of d.body) {
			questOptions.push({
				id: quest.id,
				purchasableWithGems: quest.purchasableWithGems,
				promoImagePrimaryColor: quest.promoImagePrimaryColor,
				promoImageUrl: quest.promoImageUrl,
				questParticipants: [],
				votings: [],
			});
		}
		const voting = new QuestVotings({
			votingForClan: clanId,
			calenderWeek: new Date().getWeekNumber(),
			questOptions: questOptions,
		});
		voting.save();
	});
};
export const addUpdateVoting = async (voteId, userId, option, voting) => {
	return QuestVotings.findById(voteId).exec().then(foundVoting => {
		for (const questOption of foundVoting.questOptions) {
			if (questOption.id == option) {
				let found = false;
				for (const givenVoting of questOption.votings) {
					if (givenVoting.clanMemberId.toString() == userId.toString()) {
						found = true;
						if (voting.participation == null) {
							voting.participation = givenVoting.participation;
						}
						if (voting.votedFor == null) {
							voting.votedFor = givenVoting.votedFor;
						}
						givenVoting.votedFor = voting.votedFor;
						givenVoting.participation = voting.participation;
						if (givenVoting.participation == false) {
							givenVoting.votedFor = false;
						}
						if (givenVoting.votedFor == true) {
							givenVoting.participation = true;
						}
						break;
					}

				if (!found) {
					if (voting.votedFor == null) {
						voting.votedFor = false;
					}
					if (voting.participation == null) {
						voting.participation = false;
					}
					if (voting.votedFor == true) {
						voting.participation = true;
					}
					questOption.votings.push(voting);
				}
				break;
			}
		}
		return foundVoting.save();
	});
};
export const endVoting = (voting_id) => {
	return QuestVotings.findById(voting_id).exec().then(quest => {
		quest.votingEnded = new Date();
		quest.votingActive = false;
		return quest.save();
	});
};
export const setQuestStarted = (voting_id, wonIndex) => {
	return QuestVotings.findById(voting_id).exec().then(quest => {
		quest.questWon = wonIndex;
		quest.questStarted = true;
		quest.questStartedDate = new Date();
		return quest.save();
	});
};