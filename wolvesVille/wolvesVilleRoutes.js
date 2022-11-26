// GET : get information from server
const avatarItems = '/items/avatarItems';
const avatarItemsSet = '/items/avatarItemsSet';
const avatarItemCollections = '/items/avatarItemCollections';
const profileIcons = '/items/profileIcons';
const emojis = '/items/emojis';
const emojiCollections = '/items/emojiCollections';
const backgrounds = '/items/backgrounds';
const loadingScreens = '/items/loadingScreens';
const roleIcons = '/items/roleIcons';
const advancedRoleCardOffers = '/items/advancedRoleCardOffers';
const roses = '/items/roses';
const talismans = '/items/talismans';

const season = '/battlepass/season';
const challenges = '/battlepass/challenges';

const activeOffers = '/shop/activeOffers';

const byId = '/players/:0';
const byUsername = '/players/search?username=:0';

const byName = '/clans/search?name=:0';
const info = '/clans/:0/info';
const members = '/clans/:0/members';
const chatGET = '/clans/:0/chat';
const ledger = '/clans/:0/ledger';
const available = '/clans/:0/quests/available';
const active = '/clans/:0/quests/active';
const history = '/clans/:0/quests/history';
const all = '/clans/quests/all';
const authorized = '/clans/authorized';

// POST : send request to server
const chatPOST = '/clans/:0/chat';
const shuffle = '/clans/:0/quests/shuffle';
const claim = '/clans/:0/quests/claim';
const skipWaitingTime = '/clans/:0/quests/active/skipWaitingTime';
const claimTime = '/clans/:0/quests/active/claimTime';
const cancel = '/clans/:0/quests/active/cancel';

// PUT
const participateInQuest = '/clans/:0/members/:1/participateInQuests';

export default {
	items: {
		get: {
			avatarItems,
			avatarItemsSet,
			avatarItemCollections,
			profileIcons,
			emojis,
			emojiCollections,
			backgrounds,
			loadingScreens,
			roleIcons,
			advancedRoleCardOffers,
			roses,
			talismans,
		},
	}, battlePass: {
		get: {
			season,
			challenges,
		},
	}, shop: {
		get: {
			activeOffers,
		},
	}, players: {
		get: {
			byId, byUsername,
		},
	}, clans: {
		get: {
			byName,
			info,
			members,
			chat: chatGET,
			ledger,
			available,
			active,
			history,
			all,
			authorized,
		}, post: {
			chat: chatPOST,
			shuffle,
			claim,
			skipWaitingTime,
			claimTime,
			cancel,
		}, put: {
			participateInQuest,
		},
	},
};
