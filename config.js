// The WEBSOCKET server and port the bot should connect to.
// Most of the time this isn't the same as the URL, check the `Request URL` of
// the websocket.
// If you really don't know how to do this... Run `node getserver.js URL`.
// Fill in the URL of the client where `URL` is.
// For example: `node getserver.js http://example-server.psim.us/`
exports.server = 'localhost';
exports.port = 8000;

// This is the server id.
// To know this one, you should check where the AJAX call 'goes' to when you
// log in.
// For example, on the Smogon server, it will say somewhere in the URL
// ~~showdown, meaning that the server id is 'showdown'.
// If you really don't know how to check this... run the said script above.
exports.serverid = 'localhost';

// The nick and password to log in with
// If no password is required, leave pass empty
exports.nick = 'RPBot5516';
exports.pass = 'Roleplay';

// The rooms that should be joined.
// Joining Smogon's Showdown's Lobby is not allowed.
exports.rooms = ['Roleplaying'];

// Any private rooms that should be joined.
// Private rooms will be moderated differently (since /warn doesn't work in them).
// The bot will also avoid leaking the private rooms through .seen
exports.privaterooms = [];

// Roleplaying rooms.
// Roleplaying rooms are rooms where the roleplaying commands should be enabled,
// in case the bot moderates rooms where there is none.
exports.rprooms = ['Roleplaying'];

// The character text should start with to be seen as a command.
// Note that using / and ! might be 'dangerous' since these are used in
// Showdown itself.
// Using only alphanumeric characters and spaces is not allowed.
exports.commandcharacter = '.';

// The default rank is the minimum rank that can use a command in a room when
// no rank is specified in settings.json
exports.defaultrank = '%';

// Whether this file should be watched for changes or not.
// If you change this option, the server has to be restarted in order for it to
// take effect.
exports.watchconfig = true;

// Secondary websocket protocols should be defined here, however, Showdown
// doesn't support that yet, so it's best to leave this empty.
exports.secprotocols = [];

// What should be logged?
// 0 = error, ok, info, debug, recv, send
// 1 = error, ok, info, debug, cmdr, send
// 2 = error, ok, info, debug (recommended for development)
// 3 = error, ok, info (recommended for production)
// 4 = error, ok
// 5 = error
exports.debuglevel = 3;

// Users who can use all commands regardless of their rank. Be very cautious
// with this, especially on servers other than main.
exports.excepts = ['zellman01'];

// Whitelisted users are those who the bot will not enforce moderation for.
exports.whitelist = [];

// Users in this list can use the regex autoban commands. Only add users who know how to write regular expressions and have your complete trust not to abuse the commands.
exports.regexautobanwhitelist = [];

// Add a link to the help for the bot here. When there is a link here, .help and .guide
// will link to it.
exports.botguide = '';

// Add a link to the git repository for the bot here for .git to link to.
exports.fork = '';

// This allows the bot to act as an automated moderator. If enabled, the bot will
// mute users who send 6 lines or more in 6 or fewer seconds for 7 minutes. NOTE: THIS IS
// BY NO MEANS A PERFECT MODERATOR OR SCRIPT. It is a bot and so cannot think for itself or
// exercise moderator discretion. In addition, it currently uses a very simple method of 
// determining who to mute and so may miss people who should be muted, or mute those who 
// shouldn't. Use with caution.
exports.allowmute = false;

// The punishment values system allows you to customise how you want the bot to deal with
// rulebreakers. Spamming has a points value of 2, all caps has a points value of 1, etc.
exports.punishvals = {
	1: 'warn',
	2: 'mute',
	3: 'hourmute',
	4: 'roomban',
	5: 'ban'
};

//This allows the bot to log messages sent by main and send them to the console. Off by default.
exports.logmain = false;

//This allows the bot to log PMs sent to it in the console. Off by default.
exports.logpms = false;

//Read everything else in the chat, like ban messages and the start of torunaments.
exports.readElse = false;

//Here, you specify the avatar you want the bot to use. Nice and handy if you don't want it to constantly have the default avatar.
exports.avatarNumber = [];

//This is a list of voices for the main roleplaying room, so the bot does not automatically devoice them.
exports.voiceList = [];

//This is a list of the staff because nom is PMs only.
exports.staffList = ['zellman01'];

//Here, you specify something that the bot announces with .psa.
exports.publicSeviceAnnouncement = '';

//This is a list of the legendaries for matching with indexOf.
exports.legendtoIdList = ['articuno', 'zapdos', 'moltres', 'suicune', 'entei', 'raikou', 'hooh', 'lugia', 'mew', 'mewtwo', 'celebi', 'victini', 'jirachi', 'shaymin', 'meloetta', 'regice', 'regirock', 'registeel', 'regigigas', 'latios', 'latias', 'kyogre', 'groudon', 'rayquaza', 'azelf', 'mespirt', 'uxie', 'dialga', 'palkia', 'giratina', 'cresselia', 'darkrai', 'manaphy', 'phione', 'heatran', 'terrakion', 'cobalion', 'virizion', 'keldeo', 'tornadus', 'thundurus', 'landorus', 'reshiram', 'zekrom', 'kyurem', 'genesect', 'xerneas', 'yveltal', 'zygarde', 'diancie', 'hoopa'];

//This is a list of the legendaries properly capitalised.
exports.legendList = ['Articuno', 'Zapdos', 'Moltres', 'Suicune', 'Entei', 'Raikou', 'Ho-Oh', 'Lugia', 'Mew', 'Mewtwo', 'Celebi', 'Victini', 'Jirachi', 'Shaymin', 'Meloetta', 'Regice', 'Regirock', 'Registeel', 'Regigigas', 'Latios', 'Latias', 'Kyogre', 'Groudon', 'Rayquaza', 'Azelf', 'Mespirt', 'Uxie', 'Dialga', 'Palkia', 'Giratina', 'Cresselia', 'Darkrai', 'Manaphy', 'Phione', 'Heatran', 'Terrakion', 'Cobalion', 'Virizion', 'Keldeo', 'Tornadus', 'Thundurus', 'Landorus', 'Reshiram', 'Zekrom', 'Kyurem', 'Genesect', 'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa'];

//This is a list of the legendaries' owners.  (Legendary names are placeholders )
exports.legendOwnerList = ['zellman01', 'Zapdos', 'Moltres', 'Suicune', 'Entei', 'Raikou', 'Ho-Oh', 'Lugia', 'Mew', 'Mewtwo', 'Celebi', 'Victini', 'Jirachi', 'Shaymin', 'Meloetta', 'Regice', 'Regirock', 'Registeel', 'Regigigas', 'Latios', 'Latias', 'Kyogre', 'Groudon', 'Rayquaza', 'Azelf', 'Mespirt', 'Uxie', 'Dialga', 'Palkia', 'Giratina', 'Cresselia', 'Darkrai', 'Manaphy', 'Phione', 'Heatran', 'Terrakion', 'Cobalion', 'Virizion', 'Keldeo', 'Tornadus', 'Thundurus', 'Landorus', 'Reshiram', 'Zekrom', 'Kyurem', 'Genesect', 'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa'];

//This is a list of the legendary OC's names. (Legendary names are placeholders )
exports.legendOCList = ['Jolt', 'Zapdos', 'Moltres', 'Suicune', 'Entei', 'Raikou', 'Ho-Oh', 'Lugia', 'Mew', 'Mewtwo', 'Celebi', 'Victini', 'Jirachi', 'Shaymin', 'Meloetta', 'Regice', 'Regirock', 'Registeel', 'Regigigas', 'Latios', 'Latias', 'Kyogre', 'Groudon', 'Rayquaza', 'Azelf', 'Mespirt', 'Uxie', 'Dialga', 'Palkia', 'Giratina', 'Cresselia', 'Darkrai', 'Manaphy', 'Phione', 'Heatran', 'Terrakion', 'Cobalion', 'Virizion', 'Keldeo', 'Tornadus', 'Thundurus', 'Landorus', 'Reshiram', 'Zekrom', 'Kyurem', 'Genesect', 'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa'];