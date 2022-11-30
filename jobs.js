import * as clanRequests from './MongoRequests/clans.js';
import {
	getAuthorizedClans,
	getClanChat,
	getClanMembers,
	getLedger,
	setClanMemberParticipation,
} from './wolvesVille/WolvesVilleRequests.js';
import {
	activateMember,
	addDonateGoldAndGemToUser, deleteById,
	getClansMemberByClanObjectID,
	getPendingCodes, removeGoldAndGemFromUser,
} from './MongoRequests/clanMembers.js';
import { updateClanChatCheck, updateLedgerTime } from './MongoRequests/clans.js';
import { createVoting, endVoting, getLastVoting, setQuestStarted } from './MongoRequests/clanVotings.js';


const deactivateClans = (activeClans, authorizedClans, next) => {
	for (let i = 0; i < activeClans.length; i++) {
		const checkMissingClan = (obj) => obj.id === activeClans[i].clanId;
		if (!authorizedClans.some(checkMissingClan)) {
			console.log('Removed ' + activeClans[i].clanId);
			clanRequests.deactivateClan(activeClans[i].clanId);
		}
	}
	next();
};

const activateClans = (inactiveClans, authorizedClans, next) => {
	for (let i = 0; i < inactiveClans.length; i++) {
		const checkMissingClan = (obj) => obj.id === inactiveClans[i].clanId;
		if (authorizedClans.some(checkMissingClan)) {
			console.log('activated ' + inactiveClans[i].clanId);
			clanRequests.activateClan(inactiveClans[i].clanId);
		}
	}
	next();
};

const createClans = (existingClans, authorizedClans, next) => {
	for (let i = 0; i < authorizedClans.length; i++) {
		const checkauthorizedClan = (obj) => obj.clanId === authorizedClans[i].id;
		if (!existingClans.some(checkauthorizedClan)) {
			console.log('clan added ' + authorizedClans[i].id);
			clanRequests.createClan(authorizedClans[i].id);
		}
	}
	next();
};

/**
 * Check if the bot has been added to new Clans or if the bot was removed
 * If the bot was removed -> deactivate the clan in the database
 * @param {[objects]} existingClans Array of Clans
 * @param {callback} next Callback Function
 * saved in InnocentWolvesMongoDB
 */
const checkClanChange = (existingClans, next) => {
	getAuthorizedClans().then(allCurrentClans => {
		// console.log(allCurrentClans)
		const authorizedClans = allCurrentClans.body;
		createClans(existingClans, authorizedClans, () => {
			const activeClans = existingClans.filter(
				(clan) => clan.clanActive == true);
			deactivateClans(activeClans, authorizedClans, () => {
				const inactiveClans = existingClans.filter(
					(clan) => clan.clanActive == false);
				activateClans(inactiveClans, authorizedClans, () => {
					next();
				});
			});
		});
	}).catch(err => {
		console.log(err);
	});
};

const readClanChat = (existingClans) => {
	for (let i = 0; i < existingClans.length; i++) {
		// console.log(existingClans);
		getClanChat(existingClans[i].clanId).then(chatData => {
			chatData = chatData.body;
			getPendingCodes(existingClans[i].clanId).then(pendingClanMembers => {
				for (const pendingClanMember of pendingClanMembers) {
					for (const message of chatData) {
						if (new Date(message.date) < pendingClanMember.authenticationCodeValidUntil) {
							if (new Date(message.date) > existingClans[i].lastCheckChat) {
								if (message.msg == pendingClanMember.authenticationCode) {
									console.log(3);
									if (message.playerId == pendingClanMember.wolvesvilleId) {
										activateMember(pendingClanMember._id);
										console.log(pendingClanMember._id);
									}
								}
							}
						}
					}
				}
				// console.log(pendingClanMembers);
			}).catch(e => {
				console.log(e);
			});
			updateClanChatCheck(existingClans[i]._id);
			// console.log(data.body);
		}).catch(e => {
			console.log(e);
		});
	}
};

Date.prototype.getWeekNumber = function() {
	const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const checkVotingStarts = async (allClans) => {
	let day = new Date().getDay();
	day -= 1;
	if (day == -1) {
		day = 6;
	}
	const hour = new Date().getHours();
	const minute = new Date().getMinutes();
	for (const clan of allClans) {
		if (clan.settings.autoNewVotingEnabled) {
			const clanDay = parseInt(clan.settings.autoVotingTimeStart.slice(0, 1));
			const clanHour = parseInt(clan.settings.autoVotingTimeStart.slice(2, 4));
			const clanMinute = parseInt(clan.settings.autoVotingTimeStart.slice(5, 7)) ;
			getLastVoting(clan._id).then(d => {
				if (d == null || d.votingActive == false) {
					if (d == null || d.calenderWeek < new Date().getWeekNumber()) {

						if (clanDay < day ||
							(clanDay == day &&
								(
									clanHour < hour ||
									(
										clanHour == hour &&
										(clanMinute <= minute)
									)
								)
							)
						) {
							createVoting(clan.clanId, clan._id).then(() => {
								console.log('voting created');
							});
						}
					}
				}
			});
		}
	}
};
const checkVotingEnds = async (allClans) => {
	let day = new Date().getDay();
	day -= 1;
	if (day == -1) {
		day = 6;
	}
	const hour = new Date().getHours();
	const minute = new Date().getMinutes();
	for (const clan of allClans) {
		if (clan.settings.autoNewVotingEnabled) {
			const clanDay = parseInt(clan.settings.autoVotingTimeEnd.slice(0, 1));
			const clanHour = parseInt(clan.settings.autoVotingTimeEnd.slice(2, 4));
			const clanMinute = parseInt(clan.settings.autoVotingTimeEnd.slice(5, 7));
			console.log(clanDay);
			console.log(day);
			getLastVoting(clan._id).then(d => {

				if (d != null && d.votingActive == true) {
					if (d == null || d.calenderWeek <= new Date().getWeekNumber()) {

						if (clanDay < day ||
							(clanDay == day &&
								(
									clanHour < hour ||
									(
										clanHour == hour &&
										(clanMinute <= minute)
									)
								)
							)
						) {
							endVoting(d._id).then(() => {
								console.log('voting ended');
							});
						}
					}
				}
			});
		}
	}
};
const checkLedger = async allClans => {
	for (const clan of allClans) {
		const ledgerTime = new Date();
		getLedger(clan.clanId).then(d => {
			const ledger = d.body;
			try {
				for (const ledgerItem of ledger) {
					const ledgerItemTime = new Date(ledgerItem.creationTime);
					if (ledgerItem.type == 'DONATE' &&
						clan.lastCheckLedger < ledgerItemTime &&
						ledgerItemTime < ledgerTime) {
						addDonateGoldAndGemToUser(clan._id, ledgerItem.playerId, ledgerItem.gold, ledgerItem.gems);
					}
				}
				updateLedgerTime(clan._id, ledgerTime);
			}
			catch (e) {
				console.log(e);
			}
		}).catch(e => {
			console.log(e);
		});
	}
};
const checkQuestStart = async (clan, clanMembers, wolvesvilleClanMembers) => {
	let day = new Date().getDay();
	day -= 1;
	if (day == -1) {
		day = 6;
	}
	const hour = new Date().getHours();
	const minute = new Date().getMinutes();
	if (clan.settings.autoQuestStartEnabled) {
		const clanDay = parseInt(clan.settings.autoQuestStartTime.slice(0, 1));
		const clanHour = parseInt(clan.settings.autoQuestStartTime.slice(2, 4));
		const clanMinute = parseInt(clan.settings.autoQuestStartTime.slice(5, 7)) ;
		getLastVoting(clan._id).then(async voting => {
			if (voting != null && voting.questStarted == false) {
				if (voting == null || voting.calenderWeek <= new Date().getWeekNumber()) {

					if (clanDay < day ||
						(clanDay == day &&
							(
								clanHour < hour ||
								(
									clanHour == hour &&
									(clanMinute <= minute)
								)
							)
						)
					) {
						const numberOfVotes = [];
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
						for (const wolvesvilleClanMember of wolvesvilleClanMembers) {
							if (wolvesvilleClanMember.participateInClanQuests) {
								await setClanMemberParticipation(clan.clanId, wolvesvilleClanMember.playerId, false);
							}
						}
						for (const clanMember of clanMembers) {
							let participates = false;
							for (const voter of voting.questOptions[itemWonIndex].votings) {
								if (clanMember._id == voter.clanMemberId) {
									participates = voter.participation;
								}
							}
							if (voting.questOptions[itemWonIndex].purchasableWithGems) {
								console.log('here');
								await removeGoldAndGemFromUser(clan._id, clanMember.wolvesvilleId, 0, clan.settings.defaultQuestPriceGold);
							}
							else {
								await removeGoldAndGemFromUser(clan._id, clanMember.wolvesvilleId, clan.settings.defaultQuestPriceGold, 0);
							}
							await setClanMemberParticipation(clan.clanId, clanMember.wolvesvilleId, participates);

						}
						// start Quest
						await setQuestStarted(voting._id, itemWonIndex);
					}
				}
			}
		});
	}

};
const checkClanMemberChange = async (allClans, nextTask) => {
	for (const clan of allClans) {
		getClansMemberByClanObjectID(clan._id).then(innocentWolveMembers => {
			getClanMembers(clan.clanId).then(wolvesvilleClanMembers => {
				nextTask(clan, innocentWolveMembers, wolvesvilleClanMembers.body);
				for (const innocentwolveMember of innocentWolveMembers) {
					let foundInClan = false;
					for (const wolvesvilleClanMember of wolvesvilleClanMembers.body) {
						if (wolvesvilleClanMember.playerId == innocentwolveMember.wolvesvilleId) {
							foundInClan = true;
						}
					}
					if (foundInClan == false) {
						console.log('User deleted');
						deleteById(innocentwolveMember._id);
					}

				}
			}).catch(e => {
				console.log(e);
			});
		}).catch(e => {
			console.log(e);
		});
	}

};
/**
 * List of Jobs that are done every
 * five minutes to enable the bot to be up-to-date
 * @param {Date} fireDate
 */
const allJobs = (fireDate) => {
	clanRequests.getAllClans().then(data => {
		checkClanChange(data, () => {
			clanRequests.getAllActiveClans().then(allCurrentClans => {
				readClanChat(allCurrentClans, fireDate);
				checkVotingStarts(allCurrentClans).then(() => {
					checkVotingEnds(allCurrentClans);
				});
				checkLedger(allCurrentClans);
				checkClanMemberChange(allCurrentClans,
					checkQuestStart,
				);
				// remove old clans
			});
		});
	});

};

export default allJobs;
