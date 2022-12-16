import superagent from 'superagent';
import routes from './wolvesVilleRoutes.js';
import superagentRetryDelay from 'superagent-retry-delay';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

superagentRetryDelay(superagent);

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
console.log('directory-name 👉️', __dirname);

dotenv.config({ path: `${__dirname}/../.env` });

const API_KEY = 'Bot ' + process.env.WOLVESVILL_API_KEY;
const URL = 'https://api.wolvesville.com';
let requestCount = 0;
const waiter = (time) => {
	requestCount += 1;
	console.log('Number of Requests: ' + requestCount.toString());
	return new Promise(resolve => {
		setTimeout(() => {
			resolve('resolved');
		}, time);
	});
};

export const getAuthorizedClans = async () => {
	// await waiter(0);
	return superagent
		.get(URL + routes.clans.get.authorized)
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);


};

export const getClanChat = async (clanId) => {
	// await waiter(0);

	return superagent
		.get(URL + routes.clans.get.chat.replace(':0', clanId))
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);
};
export const sendClanMessage = async (clanId, message) => {
	// await waiter(0);
	return superagent
		.post(URL + routes.clans.post.chat.replace(':0', clanId))
		.body({ message: message })
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);
};

export const getClanMembers = async (id) => {
	// await waiter(0);

	return superagent
		.get(URL + routes.clans.get.members.replace(':0', id))
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);

};
export const getWolvesvilleClan = async (id) => {
	// await waiter(0);
	return superagent
		.get(URL + routes.clans.get.info.replace(':0', id))
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);
};
export const getUserByName = async (username) => {
	// await waiter(0);
	return superagent
		.get(URL + routes.players.get.byUsername.replace(':0', username))
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);
};
export const getUserById = async (id) => {
	// await waiter(0);
	return superagent
		.get(URL + routes.players.get.byId.replace(':0', id))
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);

};
export const getQuestes = async (clanId) => {
	// await waiter(0);
	return superagent
		.get(URL + routes.clans.get.available.replace(':0', clanId))
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);
};
export const getLedger = async (clanId) => {
	// await waiter(0);
	return superagent
		.get(URL + routes.clans.get.ledger.replace(':0', clanId))
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);
};
export const getLogs = async (clanId) => {
	// await waiter(0);
	return superagent
		.get(URL + routes.clans.get.logs.replace(':0', clanId))
		.send() // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);
};
export const setClanMemberParticipation = async (clanId, clanMemberId, participation) => {
	return superagent
		.put(URL + routes.clans.put.participateInQuest.replace(':0', clanId).replace(':1', clanMemberId))
		.send({ participateInQuests: participation }) // sends a JSON post body
		.set('Authorization', API_KEY)
		.set('Accept', 'application/json')
		.retry(10, [1000, 2000, 3000, 5000], [401, 404]);
};