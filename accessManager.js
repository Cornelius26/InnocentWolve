import { getMember, getMemberByDiscordId } from './MongoRequests/clanMembers.js';
import { getClanMembers, getWolvesvilleClan } from './wolvesVille/WolvesVilleRequests.js';


export const checkAccessRight = async (interaction) => {
	return getMemberByDiscordId(interaction.user.id).then(userData => {
		console.log(userData)
		if (userData === null) return ['noAccess', null, userData];
		return getClanMembers(userData.clanId.clanId).then(clanMembers => {
			//console.log(clanMembers)
			return getWolvesvilleClan(userData.clanId.clanId).then(wolvesVilleClan => {
				//console.log(wolvesVilleClan)
				if (interaction.guildId != userData.clanId.guildId) {
					return ['clanNotRegistered', false, userData];
				}
				else {
					const coleaderAccess = userData.clanId.settings.allowCoLeaderAccess;
					if (wolvesVilleClan.body.leaderId == userData.wolvesvilleId) {
						return ['leader', coleaderAccess, userData];
					}
					for (const clanMember of clanMembers.body) {
						if (clanMember.playerId == userData.wolvesvilleId) {
							if (clanMember.isCoLeader) {
								return ['coLeader', coleaderAccess, userData];
							}
							else {
								return ['member', coleaderAccess, userData];
							}
						}
					}

					return ['noAccess', coleaderAccess, userData];

				}
			});
		});
	});
};
