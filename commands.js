/**
 * This is the file where the bot commands are located
 *
 * @license MIT license
 */

var http = require('http');
var sys = require('sys');

var pollON = false;
var pollRoom = '';
var pollTimer = {};
var pollNoms = [];
var RPOpts = ['freeroam', 'goodvsevil', 'conquest', 'trainer', 'pokehigh', 'prom', 'cruise', 'murdermystery', 'pokemonmysterydungeon', 'dungeonsndragonites', 'kingdom'];
var rpcaps = ['Freeroam', 'Good vs Evil', 'Conquest', 'Trainer', 'PokeHigh', 'Prom', 'Cruise', 'Murder Mystery', 'Pokemon Mystery Dungeon', 'Dungeons \'n Dragonites', 'Kingdom'];

var goodvsevilNom = [];
var conquestNom = [];
var trainerNom = [];
var pokehighNom = [];
var cruiseNom = [];
var murdermysteryNom = [];
var pokemonmysterydungeonNom = [];
var dungeonsndragonitesNom = [];
var kingdomNom = [];
var customPriorityFlag = false;

function splitDoc(voided) {
	if (!/docs\./.test(voided)) return voided;
	voided = voided.replace(/(doc.*)?(https?:\/\/)?docs.*/i, '').replace(/[^a-z0-9]*$/i, '');
	return voided;
};

exports.commands = {
	/**
	 * Help commands
	 *
	 * These commands are here to provide information about the bot.
	 */

	credits: 'about',
	about: function(arg, by, room) {
		if (this.hasRank(by, '#~') || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		text += '**Roleplaying Bot**: fork of **Pokemon Showdown Bot** by Quinella and TalkTakesTime, with custom roleplaying commands by Morfent.';
		this.say(room, text);
	},
	git: function(arg, by, room) {
		if (this.hasRank(by, '#~') || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		
//		var text = config.excepts.indexOf(toId(by)) < 0 ? '/pm ' + by + ', ' : '';
		text += '**Pokemon Showdown Bot** source code: ' + config.fork;
		this.say(room, text);
	},
	help: 'guide',
	guide: function(arg, by, room) {
		if (this.hasRank(by, '#~') || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		if (config.botguide) {
			text += 'A guide on how to use this bot can be found here: ' + config.botguide;
		} else {
			text += 'There is no guide for this bot. PM the owner with any questions.';
		}
		this.say(room, text);
	},
	usage: 'usagestats',
	usagestats: function (arg, by, room) {
		if (this.hasRank(by, '#~') || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		text += 'http://www.smogon.com/stats/2015-11/';
		this.say(room, text);
	},

	/**
	 * Dev commands
	 *
	 * These commands are here for highly ranked users (or the creator) to use
	 * to perform arbitrary actions that can't be done through any other commands
	 * or to help with upkeep of the bot.
	 */

	reload: function(arg, by, room) {
		if (!this.hasRank(by, '#~')) return false;
		try {
			this.uncacheTree('./commands.js');
			global.Commands = require('./commands.js').commands;
			this.say(room, 'Commands reloaded.');
		} catch (e) {
			error('failed to reload: ' + sys.inspect(e));
		}
	},
	custom: function(arg, by, room) {
		if (!this.hasRank(by, '~')) return false;
		// Custom commands can be executed in an arbitrary room using the syntax
		// ".custom [room] command", e.g., to do !data pikachu in the room lobby,
		// the command would be ".custom [lobby] !data pikachu". However, using
		// "[" and "]" in the custom command to be executed can mess this up, so
		// be careful with them.
		if (arg.indexOf('[') === 0 && arg.indexOf(']') > -1) {
			var tarRoom = arg.slice(1, arg.indexOf(']'));
			arg = arg.substr(arg.indexOf(']') + 1).trim();
		}
		this.say(tarRoom || room, arg);
	},
	js: function(arg, by, room) {
		if (config.excepts.indexOf(toId(by)) === -1) return false;
		try {
			var result = eval(arg.trim());
			this.say(room, JSON.stringify(result));
		} catch (e) {
			this.say(room, e.name + ": " + e.message);
		}
	},
	uptime: function (arg, by, room) {
		var text = config.excepts.indexOf(toId(by)) < 0 ? '/pm ' + by + ', **Uptime:** ' : '**Uptime:** ';
		var divisors = [52, 7, 24, 60, 60];
		var units = ['week', 'day', 'hour', 'minute', 'second'];
		var buffer = [];
		var uptime = ~~(process.uptime());
		do {
			var divisor = divisors.pop();
			var unit = uptime % divisor;
			buffer.push(unit > 1 ? unit + ' ' + units.pop() + 's' : unit + ' ' + units.pop());
			uptime = ~~(uptime / divisor);
		} while (uptime);

		switch (buffer.length) {
		case 5:
			text += buffer[4] + ', ';
			/* falls through */
		case 4:
			text += buffer[3] + ', ';
			/* falls through */
		case 3:
			text += buffer[2] + ', ' + buffer[1] + ', and ' + buffer[0];
			break;
		case 2:
			text += buffer[1] + ' and ' + buffer[0];
			break;
		case 1:
			text += buffer[0];
			break;
		}

		this.say(room, text);
	},

	/**
	 * Room Owner commands
	 *
	 * These commands allow room owners to personalise settings for moderation and command use.
	 */
	 
	"join": function (arg, by, room, cmd) {
		if (!this.isRanked('admin')) return false;
		if (!arg) return;
		arg = arg.split(',');
		var cmds = [];
		for (var i = 0; i < arg.length; i++) {
			cmds.push('|/join ' + arg[i]);
		}
		this.sclog();
		this.send(cmds);
	},
	settings: 'set',
	set: function(arg, by, room) {
		if (!this.hasRank(by, '%@&#~') || room.charAt(0) === ',') return false;

		var settable = {
			joke: 1,
			'8ball': 1,
			autoban: 1,
			regexautoban: 1,
			banword: 1,
			setrp: 1,
			vab: 1,
			vbw: 1,
		};
		var modOpts = {
			flooding: 1,
			caps: 1,
			stretching: 1,
			bannedwords: 1
		};

		var opts = arg.split(',');
		var cmd = toId(opts[0]);
		if (cmd === 'mod' || cmd === 'm' || cmd === 'modding') {
			if (!opts[1] || !toId(opts[1]) || !(toId(opts[1]) in modOpts)) return this.say(room, 'Incorrect command: correct syntax is ' + config.commandcharacter + 'set mod, [' +
				Object.keys(modOpts).join('/') + '](, [on/off])');

			if (!this.settings['modding']) this.settings['modding'] = {};
			if (!this.settings['modding'][room]) this.settings['modding'][room] = {};
			if (opts[2] && toId(opts[2])) {
				if (!this.hasRank(by, '#~')) return false;
				if (!(toId(opts[2]) in {on: 1, off: 1}))  return this.say(room, 'Incorrect command: correct syntax is ' + config.commandcharacter + 'set mod, [' +
					Object.keys(modOpts).join('/') + '](, [on/off])');
				if (toId(opts[2]) === 'off') {
					this.settings['modding'][room][toId(opts[1])] = 0;
				} else {
					delete this.settings['modding'][room][toId(opts[1])];
				}
				this.writeSettings();
				this.say(room, 'Moderation for ' + toId(opts[1]) + ' in this room is now ' + toId(opts[2]).toUpperCase() + '.');
				return;
			} else {
				this.say(room, 'Moderation for ' + toId(opts[1]) + ' in this room is currently ' +
					(this.settings['modding'][room][toId(opts[1])] === 0 ? 'OFF' : 'ON') + '.');
				return;
			}
		} else {
			if (!Commands[cmd]) return this.say(room, config.commandcharacter + '' + opts[0] + ' is not a valid command.');
			var failsafe = 0;
			while (!(cmd in settable)) {
				if (typeof Commands[cmd] === 'string') {
					cmd = Commands[cmd];
				} else if (typeof Commands[cmd] === 'function') {
					if (cmd in settable) {
						break;
					} else {
						this.say(room, 'The settings for ' + config.commandcharacter + '' + opts[0] + ' cannot be changed.');
						return;
					}
				} else {
					this.say(room, 'Something went wrong. PM Lux (Lucario) or Starbloom here or on Smogon with the command you tried.');
					return;
				}
				failsafe++;
				if (failsafe > 5) {
					this.say(room, 'The command "' + config.commandcharacter + '' + opts[0] + '" could not be found.');
					return;
				}
			}

			var settingsLevels = {
				off: false,
				disable: false,
				'+': '+',
				'%': '%',
				'@': '@',
				'&': '&',
				'#': '#',
				'~': '~',
				on: true,
				enable: true
			};
			if (!opts[1] || !opts[1].trim()) {
				var msg = '';
				if (!this.settings[cmd] || (!this.settings[cmd][room] && this.settings[cmd][room] !== false)) {
					msg = '' + config.commandcharacter + '' + cmd + ' is available for users of rank ' + ((cmd === 'autoban' || cmd === 'banword') ? '#' : config.defaultrank) + ' and above.';
				} else if (this.settings[cmd][room] in settingsLevels) {
					msg = '' + config.commandcharacter + '' + cmd + ' is available for users of rank ' + this.settings[cmd][room] + ' and above.';
				} else if (this.settings[cmd][room] === true) {
					msg = '' + config.commandcharacter + '' + cmd + ' is available for all users in this room.';
				} else if (this.settings[cmd][room] === false) {
					msg = '' + config.commandcharacter + '' + cmd + ' is not available for use in this room.';
				}
				this.say(room, msg);
				return;
			} else {
				if (!this.hasRank(by, '#~')) return false;
				var newRank = opts[1].trim();
				if (!(newRank in settingsLevels)) return this.say(room, 'Unknown option: "' + newRank + '". Valid settings are: off/disable, +, %, @, &, #, ~, on/enable.');
				if (!this.settings[cmd]) this.settings[cmd] = {};
				this.settings[cmd][room] = settingsLevels[newRank];
				this.writeSettings();
				this.say(room, 'The command ' + config.commandcharacter + '' + cmd + ' is now ' +
					(settingsLevels[newRank] === newRank ? ' available for users of rank ' + newRank + ' and above.' :
					(this.settings[cmd][room] ? 'available for all users in this room.' : 'unavailable for use in this room.')));
			}
		}
	},
	blacklist: 'autoban',
	ban: 'autoban',
	ab: 'autoban',
	autoban: function(arg, by, room) {
		if (!this.canUse('autoban', room, by) || room.charAt(0) === ',') return false;
		if (!this.hasRank(this.ranks[room] || ' ', '@&#~')) return this.say(room, config.nick + ' requires rank of @ or higher to (un)blacklist.');

		arg = arg.split(',');
		var added = [];
		var illegalNick = [];
		var alreadyAdded = [];
		if (!arg.length || (arg.length === 1 && !arg[0].trim().length)) return this.say(room, 'You must specify at least one user to blacklist.');
		for (var i = 0; i < arg.length; i++) {
			var tarUser = toId(arg[i]);
			if (tarUser.length < 1 || tarUser.length > 18) {
				illegalNick.push(tarUser);
				continue;
			}
			if (!this.blacklistUser(tarUser, room)) {
				alreadyAdded.push(tarUser);
				continue;
			}
			this.say(room, '/roomban ' + tarUser + ', Blacklisted user');
			this.say(room, '/modnote ' + tarUser + ' was added to the blacklist by ' + by + '.');
			added.push(tarUser);
		}

		var text = '';
		if (added.length) {
			text += 'User(s) "' + added.join('", "') + '" added to blacklist successfully. ';
			this.writeSettings();
		}
		if (alreadyAdded.length) text += 'User(s) "' + alreadyAdded.join('", "') + '" already present in blacklist. ';
		if (illegalNick.length) text += 'All ' + (text.length ? 'other ' : '') + 'users had illegal nicks and were not blacklisted.';
		this.say(room, text);
	},
	unblacklist: 'unautoban',
	unban: 'unautoban',
	unab: 'unautoban',
	unautoban: function(arg, by, room) {
		if (!this.canUse('autoban', room, by) || room.charAt(0) === ',') return false;
		if (!this.hasRank(this.ranks[room] || ' ', '@&#~')) return this.say(room, config.nick + ' requires rank of @ or higher to (un)blacklist.');

		arg = arg.split(',');
		var removed = [];
		var notRemoved = [];
		if (!arg.length || (arg.length === 1 && !arg[0].trim().length)) return this.say(room, 'You must specify at least one user to unblacklist.');
		for (var i = 0; i < arg.length; i++) {
			var tarUser = toId(arg[i]);
			if (tarUser.length < 1 || tarUser.length > 18) {
				notRemoved.push(tarUser);
				continue;
			}
			if (!this.unblacklistUser(tarUser, room)) {
				notRemoved.push(tarUser);
				continue;
			}
			this.say(room, '/roomunban ' + tarUser);
			this.say(room, '/modnote ' + tarUser + ' was removed from the blacklist by ' + by + '.');
			removed.push(tarUser);
		}

		var text = '';
		if (removed.length) {
			text += 'User(s) "' + removed.join('", "') + '" removed from blacklist successfully. ';
			this.writeSettings();
		}
		if (notRemoved.length) text += (text.length ? 'No other ' : 'No ') + 'specified users were present in the blacklist.';
		this.say(room, text);
	},
	rab: 'regexautoban',
	regexautoban: function(arg, by, room) {
		if (config.regexautobanwhitelist.indexOf(toId(by)) < 0 || !this.canUse('autoban', room, by) || room.charAt(0) === ',') return false;
		if (!this.hasRank(this.ranks[room] || ' ', '@&#~')) return this.say(room, config.nick + ' requires rank of @ or higher to (un)blacklist.');
		if (!arg) return this.say(room, 'You must specify a regular expression to (un)blacklist.');

		try {
			new RegExp(arg, 'i');
		} catch (e) {
			return this.say(room, e.message);
		}

		arg = '/' + arg + '/i';
		if (!this.blacklistUser(arg, room)) return this.say(room, '/' + arg + ' is already present in the blacklist.');

		this.writeSettings();
		this.say(room, '/' + arg + ' was added to the blacklist successfully.');
	},
	unrab: 'unregexautoban',
	unregexautoban: function(arg, by, room) {
		if (config.regexautobanwhitelist.indexOf(toId(by)) < 0 || !this.canUse('autoban', room, by) || room.charAt(0) === ',') return false;
		if (!this.hasRank(this.ranks[room] || ' ', '@&#~')) return this.say(room, config.nick + ' requires rank of @ or higher to (un)blacklist.');
		if (!arg) return this.say(room, 'You must specify a regular expression to (un)blacklist.');

		arg = '/' + arg.replace(/\\\\/g, '\\') + '/i';
		if (!this.unblacklistUser(arg, room)) return this.say(room,'/' + arg + ' is not present in the blacklist.');

		this.writeSettings();
		this.say(room, '/' + arg + ' was removed from the blacklist successfully.');
	},
	viewbans: 'viewblacklist',
	vab: 'viewblacklist',
	viewautobans: 'viewblacklist',
	viewblacklist: function(arg, by, room) {
		if (!this.canUse('autoban', room, by) || room.charAt(0) === ',') return false;

		var text = '';
		if (!this.settings.blacklist || !this.settings.blacklist[room]) {
			text = 'No users are blacklisted in this room.';
		} else {
			if (arg.length) {
				var nick = toId(arg);
				if (nick.length < 1 || nick.length > 18) {
					text = 'Invalid nickname: "' + nick + '".';
				} else {
					text = 'User "' + nick + '" is currently ' + (nick in this.settings.blacklist[room] ? '' : 'not ') + 'blacklisted in ' + room + '.';
				}
			} else {
				var nickList = Object.keys(this.settings.blacklist[room]);
				if (!nickList.length) return this.say(room, '/pm ' + by + ', No users are blacklisted in this room.');
				this.uploadToHastebin('The following users are banned in ' + room + ':\n\n' + nickList.join('\n'), function (link) {
					this.say(room, "/pm " + by + ", Blacklist for room " + room + ": " + link);
				}.bind(this));
				return;
			}
		}
		this.say(room, '/pm ' + by + ', ' + text);
	},
	bw: 'banword',
	banphrase: 'banword',
	banword: function(arg, by, room) {
		if (!this.canUse('banword', room, by)) return false;
		if (!this.settings.bannedphrases) this.settings.bannedphrases = {};
		arg = arg.trim().toLowerCase();
		if (!arg) return false;
		var tarRoom = room;

		if (room.charAt(0) === ',') {
			if (!this.hasRank(by, '~')) return false;
			tarRoom = 'global';
		}

		if (!this.settings.bannedphrases[tarRoom]) this.settings.bannedphrases[tarRoom] = {};
		if (arg in this.settings.bannedphrases[tarRoom]) return this.say(room, "Phrase \"" + arg + "\" is already banned.");
		this.settings.bannedphrases[tarRoom][arg] = 1;
		this.writeSettings();
		this.say(room, "Phrase \"" + arg + "\" is now banned.");
	},
	ubw: 'unbanword',
	unbanphrase: 'unbanword',
	unbanword: function(arg, by, room) {
		if (!this.canUse('banword', room, by)) return false;
		arg = arg.trim().toLowerCase();
		if (!arg) return false;
		var tarRoom = room;

		if (room.charAt(0) === ',') {
			if (!this.hasRank(by, '~')) return false;
			tarRoom = 'global';
		}

		if (!this.settings.bannedphrases || !this.settings.bannedphrases[tarRoom] || !(arg in this.settings.bannedphrases[tarRoom])) 
			return this.say(room, "Phrase \"" + arg + "\" is not currently banned.");
		delete this.settings.bannedphrases[tarRoom][arg];
		if (!Object.size(this.settings.bannedphrases[tarRoom])) delete this.settings.bannedphrases[tarRoom];
		if (!Object.size(this.settings.bannedphrases)) delete this.settings.bannedphrases;
		this.writeSettings();
		this.say(room, "Phrase \"" + arg + "\" is no longer banned.");
	},
	viewbannedphrases: 'viewbannedwords',
	vbw: 'viewbannedwords',
	viewbannedwords: function(arg, by, room) {
		if (!this.canUse('banword', room, by)) return false;
		arg = arg.trim().toLowerCase();
		var tarRoom = room;

		if (room.charAt(0) === ',') {
			if (!this.hasRank(by, '~')) return false;
			tarRoom = 'global';
		}

		var text = "";
		if (!this.settings.bannedphrases || !this.settings.bannedphrases[tarRoom]) {
			text = "No phrases are banned in this room.";
		} else {
			if (arg.length) {
				text = "The phrase \"" + arg + "\" is currently " + (arg in this.settings.bannedphrases[tarRoom] ? "" : "not ") + "banned " +
					(room.charAt(0) === ',' ? "globally" : "in " + room) + ".";
			} else {
				var banList = Object.keys(this.settings.bannedphrases[tarRoom]);
				if (!banList.length) return this.say(room, "No phrases are banned in this room.");
				this.uploadToHastebin("The following phrases are banned " + (room.charAt(0) === ',' ? "globally" : "in " + room) + ":\n\n" + banList.join('\n'), function (link) {
					this.say(room, (room.charAt(0) === ',' ? "" : "/pm " + by + ", ") + "Banned Phrases " + (room.charAt(0) === ',' ? "globally" : "in " + room) + ": " + link);
				}.bind(this));
				return;
			}
		}
		this.say(room, text);
	},

	/**
	 * General commands
	 *
	 * Add custom commands here.
	 */

	joke: function(arg, by, room) {
		if (!this.canUse('joke', room, by) || room.charAt(0) === ',') return false;
		var self = this;

		var reqOpt = {
			hostname: 'api.icndb.com',
			path: '/jokes/random',
			method: 'GET'
		};
		var req = http.request(reqOpt, function(res) {
			res.on('data', function(chunk) {
				try {
					var data = JSON.parse(chunk);
					self.say(room, data.value.joke.replace(/&quot;/g, "\""));
				} catch (e) {
					self.say(room, 'Sorry, couldn\'t fetch a random joke... :(');
				}
			});
		});
		req.end();
	},
	seen: function(arg, by, room) { // this command is still a bit buggy //I think it's fixed now
		var text = (room.charAt(0) === ',' ? '' : '/pm ' + by + ', ');
		arg = toId(arg);
		if (!arg || arg.length > 18) return this.say(room, text + 'Invalid username.');
		if (arg === toId(by)) {
			text += 'Have you looked in the mirror lately?';
		} else if (arg === toId(config.nick)) {
			text += 'You might be either blind or illiterate. Might want to get that checked out.';
		} else if (!this.chatData[arg] || !this.chatData[arg].seenAt) {
			text += 'The user ' + arg + ' has never been seen.';
		} else {
			text += arg + ' was last seen ' + this.getTimeAgo(this.chatData[arg].seenAt) + ' ago' + (
				this.chatData[arg].lastSeen ? ', ' + this.chatData[arg].lastSeen : '.');
		}
		this.say(room, text);
	},
	'8ball': function(arg, by, room) {
		if (this.canUse('8ball', room, by) || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}

		var rand = ~~(20 * Math.random()) + 1;

		switch (rand) {
	 		case 1: text += "Signs point to yes."; break;
	  		case 2: text += "Yes."; break;
			case 3: text += "Reply hazy, try again."; break;
			case 4: text += "Without a doubt."; break;
			case 5: text += "My sources say no."; break;
			case 6: text += "As I see it, yes."; break;
			case 7: text += "You may rely on it."; break;
			case 8: text += "Concentrate and ask again."; break;
			case 9: text += "Outlook not so good."; break;
			case 10: text += "It is decidedly so."; break;
			case 11: text += "Better not tell you now."; break;
			case 12: text += "Very doubtful."; break;
			case 13: text += "Yes - definitely."; break;
			case 14: text += "It is certain."; break;
			case 15: text += "Cannot predict now."; break;
			case 16: text += "Most likely."; break;
			case 17: text += "Ask again later."; break;
			case 18: text += "My reply is no."; break;
			case 19: text += "Outlook good."; break;
			case 20: text += "Don't count on it."; break;
		}
		this.say(room, text);
	},

	// Roleplaying commands
	sr: "setrp",
	rpset: "setrp",
	setrp: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host))) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by)) return false;
		}
		if (!arg) return this.say(room, 'Please enter an RP.');

		if(!this.RP[room]) this.RP[room] = {};
		this.RP[room].plot = arg;
		this.writeSettings();
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + 'The RP was set to ' + splitDoc(arg) + '.');
		if (this.RP[room].setAt) return this.say(room, 'The RP was set to ' + arg + '.');
		this.say(room, 'The RP was set to ' + arg + '. Use .start to start the RP.');
//		if (room === 'rustyrp') this.say(room, '/modchat off');
	},
	sd: 'setdoc',
	docset: 'setdoc',
	setdoc: function(arg, by, room) {
		if (!(room in this.RP) || !this.RP[room].plot) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host))) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by)) return false;
		}
		if (!arg) return this.say(room, 'Please enter a doc.');
		this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'setrp ' + splitDoc(this.RP[room].plot) + ' || Doc: ' + arg);
	},
	startrp: 'start',
	rpstart: 'start',
	start: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (!!this.RP[room].host) {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host)) || this.RP[room].setAt) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || this.RP[room].setAt) return false;
		}
		if (!this.RP[room].plot) {
			if (!arg) return this.say(room, 'Please set an RP before using .start, or specify an RP with .start to start one immediately.');
			this.RP[room].plot = arg;
		}

		
		if (toId(this.RP[room].plot) === 'freeroam' || toId(this.RP[room].plot) === 'prom'){
			if (this.freeroamTimeouts) {
				this.freeroamTimeouts[room] = setTimeout(function() {
					this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'endrp');
					delete this.freeroamTimeouts[room];
				}.bind(this), 2 * 60 * 60 * 1000);
			}
		} else {
			if (this.staffAnnounceEndTimeouts) {
				this.staffAnnounceEndTimeouts[room] = setTimeout(function() {
					this.say(room, "/wall The RP has been in progress for **Three Hours**. Any Moderator or Driver may now end the RP. The RP will auto-end in **One Hour**");
					delete this.staffAnnounceEndTimeouts[room];
				}.bind(this), 3 * 60 * 60 * 1000);
			}
			if (this.autoTimeOut) {
				this.autoTimeOut[room] = setTimeout(function() {
					this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'endrp');
					this.say(room, "/wall The RP has reached its time limit of 4 hours. Consider scheduling a time in Rusty to continue the RP with the same players.");
					this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'rustyrp');
					delete this.autoTimeOut[room];
				}.bind(this), 4 * 60 * 60 * 1000);
			}
		}
		
		if (toId(this.RP[room].plot) === 'pokehigh' ||  toId(this.RP[room].plot) === 'goodvsevil') {
			this.say(room, "/modchat off");
		}
		
		if (toId(this.RP[room].plot) === 'freeroam' || toId(this.RP[room].plot) === 'prom') {
			this.say(room, '/wall Please note that this RP will not end after two hours. However, any staff member may decide to end it at any time after the first two hours are up.');
		}
		
		if (this.conquestTimeouts && /conquest/i.test(toId(this.RP[room].plot))){
			this.conquestTimeouts[room] = setTimeout(function() {
				this.say(room, '**Grace Period has ended.**');
				delete this.conquestTimeouts[room];
			}.bind(this), 10 * 60 * 1000);
		}
		if (this.conquestLockouts && /conquest/i.test(toId(this.RP[room].plot))){
			this.conquestLockouts[room] = setTimeout(function() {
					this.say(room, '**Types are now locked.**');
					delete this.conquestLockouts[room];
			}.bind(this), 2 * 60 * 60 * 1000);
		}
		
		if (this.RP[room].endpollCalled) {
			delete this.RP[room].endpollCalled;
		}

		if (/conquest/i.test(toId(this.RP[room].plot))) {
				this.say(room, '**Arceus, Darkrai, Mewtwo, Mega-Rayquaza, and Primal forms are banned. A kingdom may have up to two knights and only three kingdoms are allowed in an alliance.**');
				this.say(room, "__Please battle in the Ubers format. Warlords have a THREE minute grace period if the survive a Conquest attempt.  Knights/wanderers may have one mega. However, Mega Kanga, Gengar, Mawile, Lucario, Slowbro, Salamence, and Metagross are banned.__");
				this.say(room, "**Blaziken, Greninja, Aegislash (for Steel ONLY), and Talonflame count as a legendary spot. The Evasion Clause is in effect, and Geomancy, Soul Dew, Damp Rock, and Smooth Rock are banned. Ghost cannot have both Giratina-A and Aegislash on the same team.  Types are locked at two hours.**");
				this.say(room, "__Only ONE person may battle a defending kingdom at a time. For example, a lord cannot take their knight to fight the lord's while they themselves battle the lord. If there is more than one kingdom trying to attack, the defending kingdom chooses whose challenge to accept.__");
				this.say(room, "**Wanderers may challenge a Kingdom for knightship. This can't be declined, but if the Wanderer loses, they either die or cannot challenge the same kingdom again. They either fight the lone knight if there is only one, one of the knights of the Lord's choice if two, or the Lord himself.**");
				this.say(room, "__If the Wanderer wins, they replace the defeated Knight. If they battle the Lord because the Lord had no knights, they become the knight. Wanderers who become knights in this manner CANNOT coup against the Lord. The wanderer must battle with a mono team of the type he's challenging.__");
				this.say(room, "**All participants within the RP may only have ONE chance to coup any kingdom. PM the host any alliances, name changes, leaving, Conquests and cheating.  Post battle links in the chat.  There will be a 10 minute grace period at the start of the RP, and types will be locked at 2 hours.**");
				this.say(room, "__Warlords may trade one Pokemon with each of their allies, up to a maximum of two trades. The Pokemon must be part of your original party and cannot be a legend or mega. The two Pokemon must be agreed upon by both warlords and reported to the host.__");
				this.say(room, "**Trades may be canceled, but you may never trade with that kingdom again. If your ally is defeated, the trade isn't reversed. You can't trade a banned Pokemon to that type (e.g Aegislash to Steel). Lastly, if a kingdom gets a new Warlord, the trades are only reset for THAT kingdom.**");
				this.say(room, "__Finally, a reminder that, if you do not RP properly, you are liable to be ignored by the person you are challenging.__");
				this.say(room, "/modchat off");

		}
		
		if (config.serverid == 'showdown' && !(room == "amphyrp")){
			if (/conquest/i.test(toId(this.RP[room].plot)) || /poke?high/i.test(toId(this.RP[room].plot)) || /goodvsevil/i.test(toId(this.RP[room].plot))){
				this.say(room, '/modchat off');
			}
		}
		this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'voidpoll');
		if (customPriorityFlag && room == 'amphyrp') {
			this.say(room, '/modnote ' + this.RP[room].host + ' has started the custom RP ' + splitDoc(this.RP[room].plot));
			customPriorityFlag = false;
		}
		var now = new Date();
		this.RP[room].setAt = now;
		this.writeSettings();
		if (this.hasRank(this.ranks[room] || ' ', '%@#&~')) {
			this.say(room, '/wall The RP (' +  splitDoc(this.RP[room].plot) + ') has started.');
		} else {
			this.say(room, '**The RP (' +  splitDoc(this.RP[room].plot) + ') has started.**');
		}
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + splitDoc(this.RP[room].plot) + " has started.");
	},
	pause: 'rppause',
	pauserp: 'rppause',
	rppause: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host)) || !this.RP[room].setAt || this.RP[room].pause) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || !this.RP[room].setAt || this.RP[room].pause) return false;
		}

		this.RP[room].pause = new Date();
		if (this.freeroamTimeouts && (toId(this.RP.plot) === 'freeroam' || toId(this.RP.plot) === 'prom')) {
			clearTimeout(this.freeroamTimeouts);
			delete this.freeroamTimeouts;
		}
		
		if (toId(this.RP[room].plot) === 'freeroam' || toId(this.RP[room].plot) === 'prom'){
			if (this.freeroamTimeouts) {
				clearTimeout(this.freeroamTimeouts);
				delete this.freeroamTimeouts;
			}
		} else {
			if (this.staffAnnounceEndTimeouts) {
				clearTimeout(this.staffAnnounceEndTimeouts);
				delete this.staffAnnounceEndTimeouts;
			}
			if (this.autoTimeOut) {
				clearTimeout(this.autoTimeOut);
				delete this.autoTimeOut;
			}
		}
		
		if (/conquest/i.test(toId(this.RP[room].plot))) {
			if (this.conquestTimeouts[room]){
				clearTimeout(this.conquestTimeouts[room]);
				delete this.conquestTimeouts[room];
			}
			if (this.conquestLockouts[room]){
				clearTimeout(this.conquestLockouts[room]);
				delete this.conquestLockouts[room];
			}
		}
		
		if (this.RP[room].endpollCalled) {
			delete this.RP[room].endpollCalled;
		}
		
		this.writeSettings();

		if (this.hasRank(this.ranks[room] || ' ', '%@#&~')) {
			this.say(room, '/wall RP pause');
		} else {
			this.say(room, '**RP pause**');
		}
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + splitDoc(this.RP[room].plot) + " has been paused.");
	},
	'continue': 'rpcontinue',
	'resume': 'rpcontinue',
	'rpresume': 'rpcontinue',
	continuerp: 'rpcontinue',
	rpcontinue: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host)) || !this.RP[room].setAt || !this.RP[room].pause) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || !this.RP[room].setAt || !this.RP[room].pause) return false;
		}
		
		var paused = new Date(this.RP[room].pause); //Time it was paused at.
		var setAt = new Date(this.RP[room].setAt); //Time it was originally set at.
		var diff = new Date(); //Now
		diff.setTime(diff.getTime() - paused.getTime()); //Time elapsed since it was paused
		setAt.setTime(setAt.getTime() + diff.getTime()); //Time it was originally set at + paused time elapsed.
		this.RP[room].setAt = setAt;
		var timeLeft =  2 * 60 * 60 * 1000 - ((new Date()).getTime() - setAt.getTime());
		var conquestTimeLeft = 10 * 60 * 1000 - ((new Date()).getTime() - setAt.getTime());
		var announceTimeLeft  = 3 * 60 * 60 * 1000 - ((new Date()).getTime() - setAt.getTime());
		var autoEndTimeLeft  = 4 * 60 * 60 * 1000 - ((new Date()).getTime() - setAt.getTime());
		
		if (!this.conquestTimeouts && /conquest/i.test(toId(this.RP.plot))){
			if (conquestTimeLeft > 0) {
				this.conquestTimeouts = setTimeout(function() {
					this.say(room, '**Grace Period has ended.**');
					delete this.conquestTimeouts;
				}.bind(this), conquestTimeLeft);
			}
			if (timeLeft > 0){
				this.conquestLockouts = setTimeout(function() {
					this.say(room, '**Types are now locked.**');
					delete this.conquestLockouts;
				}.bind(this), timeLeft);
			}
		}

		if (toId(this.RP[room].plot) === 'freeroam' || toId(this.RP[room].plot) === 'prom') {
			if (!this.freeroamTimeouts) {
				this.freeroamTimeouts = setTimeout(function() {
					this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'endrp');
					delete this.freeroamTimeouts;
				}.bind(this), timeLeft);
			}
		} else {
			if (this.staffAnnounceEndTimeouts && announceTimeLeft > 0) {
				this.staffAnnounceEndTimeouts = setTimeout(function() {
					this.say(room, "/wall The RP has been in progress for **Three Hours**. Any Moderator or Driver may now end the RP. The RP will auto-end in **One Hour**");
					delete this.staffAnnounceEndTimeouts[room];
				}.bind(this), announceTimeLeft);
			}
			if (this.autoTimeOut && autoEndTimeLeft > 0) {
				this.autoTimeOut = setTimeout(function() {
					this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'endrp');
					this.say(room, "/wall The RP has reached its time limit of 4 hours. Consider scheduling a time in Rusty to continue the RP with the same players.");
					this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'rustyrp');
					delete this.autoTimeOut[room];
				}.bind(this), autoEndTimeLeft);
			}
		}

		delete this.RP[room].pause;
		this.writeSettings();
		if (this.hasRank(this.ranks[room] || ' ', '%@#&~')) {
			this.say(room, '/wall RP continue');
		} else {
			this.say(room, '**RP continue**');
		}
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + splitDoc(this.RP[room].plot) + " has been resumed.");
	},
	sh: 'sethost',
	sethost: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host)) || !this.RP[room].plot) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || !this.RP[room].plot) return false;
		}
		if (!arg) return this.say(room, 'Please enter a host.');

		if (config.serverid == 'showdown' && !(room == "amphyrp")){
			if (this.RP[room].host){
				if (config.voiceList.indexOf(toId(this.RP[room].host)) == -1) {
						this.say(room, '/roomdevoice '+ this.RP[room].host);
				}
			}
			if (!(this.RP[room].setAt)) {
				if ((/conquest/i.test(toId(this.RP[room].plot)) || /poke?high/i.test(toId(this.RP[room].plot)) || /goodvsevil/i.test(toId(this.RP[room].plot))) && !this.RP[room].host){
					this.say(room, '/modchat +');
					this.say(room, '/wall A reminder for newcomers that Modchat + is only up temporarily. After the RP is set up modchat will come down and everyone can talk again.');
				}
			}
		}

		this.RP[room].host = arg;
		this.writeSettings();
		if (!(room == "amphyrp")){ 
			this.say(room, '/roomvoice '+ arg);
		}
		this.say(room, 'The host was set to ' + arg + '.');
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "The host was set to " + arg + ".");
		this.RP[room].setUpAt = new Date;
		
		if (toId(this.RP[room].plot) === 'conquest' || toId(this.RP[room].plot) === 'pokehigh' ||  toId(this.RP[room].plot) === 'goodvsevil') {
			this.say(room, "/modchat +");
			this.say(room, "/wall A reminder for newcomers that Modchat + is only up temporarily. After the RP is set up modchat will come down and everyone can talk again.");
		}
	},
	sch: 'setcohost',
	setcohost: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host)) || !this.RP[room].plot) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || !this.RP[room].plot) return false;
		}
		if (!arg) return this.say(room, 'Please enter a cohost.');
				
		this.RP[room].cohost = arg;
		this.writeSettings();
		this.say(room, 'The cohost(s) was/were set to ' + arg + '.');
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "The cohost(s) was/were set to " + arg + ".");
	},
	rh: 'rmhost',
	rmhost: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host)) || !this.RP[room].plot) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || !this.RP[room].plot) return false;
		}
		if (!this.RP[room].host) return this.say(room, 'There is no host to remove.');
		if (config.serverid == 'showdown' && !(room == "amphyrp")){
			if (room == 'rustyrp' || (config.voiceList.indexOf(toId(this.RP[room].host)) == -1)) {
				this.say(room, '/roomdevoice '+ this.RP[room].host);
				}
			if (!(this.RP[room].setAt)){
				if (/conquest/i.test(toId(this.RP[room].plot)) || /poke?high/i.test(toId(this.RP[room].plot)) || /goodvsevil/i.test(toId(this.RP[room].plot))){
					this.say(room, '/modchat off');
				}
			}
		}

		delete this.RP[room].host;
		this.writeSettings();
		this.say(room, 'The host has been removed.');
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "The host has been removed.");
	},
	rch: 'rmcohost',
	rmcohost: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host)) || !this.RP[room].plot) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || !this.RP[room].plot) return false;
		}
		if (!this.RP[room].cohost) return this.say(room, 'There are no cohosts to remove.');

		delete this.RP[room].cohost;
		this.writeSettings();
		this.say(room, 'The cohost(s) has/have been removed.');
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "The cohost(s) has/have been removed.");
	},
	rpend: 'endrp',
	endrp: function(arg, by, room) {
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host)) || !this.RP[room].plot) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || !this.RP[room].plot) return false;
		}
		if (this.RP[room].setAt) {
			nextVoid = splitDoc(this.RP[room].plot);
			if (room == 'roleplaying') {
				if (this.RP.void === 3) this.RP.void.shift();
			} else {
				if (this.RP.void[room].length === 2) this.RP.void[room].shift();
			}


			if (toId(this.RP[room].plot) === 'freeroam' || toId(this.RP[room].plot) === 'prom') {
				clearTimeout(this.freeroamTimeouts);
				delete this.freeroamTimeouts;
			} else {
				clearTimeout(this.staffAnnounceEndTimeouts);
				delete this.staffAnnounceEndTimeouts;
				clearTimeout(this.autoTimeOut);
				delete this.autoTimeOut;
			}

			if (/conquest/i.test(toId(this.RP[room].plot))){
				clearTimeout(this.conquestTimeouts);
				delete this.conquestTimeouts;
				clearTimeout(this.conquestLockouts);
				delete this.conquestLockouts;
			}
		}
		
		// How long it's been going for when it ends.
		var start = new Date(this.RP[room].setAt);
		var now = (this.RP[room].pause) ? new Date(this.RP[room].pause) : new Date();
		var diff = (now.getTime() - start.getTime()) / 1000;
		var seconds = Math.floor(diff % 60);
		diff /= 60;
		var minutes = Math.floor(diff % 60);
		diff /= 60;
		var hours = Math.floor(diff % 24);
		var progress = hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);

		if (this.RP[room].setAt) {
			console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + splitDoc(this.RP[room].plot) + " has ended after "+ progress + ".");
		} else {
			console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + splitDoc(this.RP[room].plot) + " has ended.");
		}
		if (!(room == "amphyrp")){
			if (this.RP[room].host){
				if (room == 'rustyrp' || (config.voiceList.indexOf(toId(this.RP[room].host)) == -1)) {
					this.say(room, '/roomdevoice '+ this.RP[room].host);
					}
				if (!(this.RP[room].setAt)){
					if (/conquest/i.test(toId(this.RP[room].plot)) || /poke?high/i.test(toId(this.RP[room].plot)) || /goodvsevil/i.test(toId(this.RP[room].plot))){
						this.say(room, '/modchat off');
					}
				}
			}
		}

		if (customPriorityFlag && room == 'amphyrp' && !this.RP[room].setAt) {
			this.say(room, '/modnote ' + this.RP[room].host + ' failed to run the CPed custom RP ' + splitDoc(this.RP[room].plot) + '.');
			customPriorityFlag = false;
		}
		if (this.RP[room].setAt) {
			if (this.hasRank(this.ranks[room] || ' ', '%@#&~')) {
				this.say(room, '/wall The RP has ended after ' + progress + '.');
			} else {
				this.say(room, '**The RP has ended after ' + progress + '.**');
			}
		} else {
			if (this.hasRank(this.ranks[room] || ' ', '%@#&~')) {
				this.say(room, '/wall The RP has ended.');
			} else {
				this.say(room, '**The RP has ended.**');
			}
		}
		
		for (var i in this.RP[room]) {
			delete this.RP[room][i];
		}
		this.writeSettings();
//		if (room === 'rustyrp') this.say(room, '/modchat +');
		this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'void');
		this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'rppoll');
	},
	vr: 'voidreset',
	voidreset: function(arg, by, room) {
		if (room == "roleplaying") {
			this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'setvoid Void, Reset, Thing');
		} else {
			this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'setvoid Void, Reset');
		}
	},
	sv: 'setvoid',
	setvoid: function(arg, by, room) {
		if (!(room in this.RP) || this.RP[room].plot || !arg || !this.hasRank(by, '%@#&~')) return false;
		var spl = arg.split(', ');
		console.log(spl);
		if (room == 'roleplaying') {
			if (spl.length !== 3) return this.say(room, 'Void only accepts 3 arguments for main.');
			this.RP.void[room] = spl;
		} else {
			if (spl.length !== 2) return this.say(room, 'Void only accepts 2 arguments.');
			this.RP.void[room] = spl;
		}
		this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'void');
	},
	void: function(arg, by, room) {
		if (!(room in this.RP) || this.RP[room].plot) return false;
		var text = '';


		var voided = this.RP.void;
		switch (voided) {
			case 3:
				text += voided[0] + ', ' + voided[1] + ' and ' + voided[2] + ' are void';
				break;
			case 2:
				text += voided[0] + ' and ' + voided[1] + ' are void';
				break;
			case 1:
				text += voided[0] + ' is void. The second-last RP in this room is unknown';
				break;
			case 0:
				text += 'The last 2 RPs in this room are unknown.';
				break;
			default:
				return this.say(room, 'Something went wrong with how void RPs are stored');
		}
		
		if (room === 'rustyrp' && config.serverid === 'showdown'){
			if (this.RP['roleplaying'].plot) {
				text += ". The RP in Roleplaying is " + splitDoc(this.RP['roleplaying'].plot) + ".";
			}
			if (this.RP['amphyrp'].plot) {
				if (this.RP['roleplaying'].plot) {
					text += ' ';
				} else {
					text += '. ';
				}
				text += "The RP in AmphyRP is " + splitDoc(this.RP['amphyrp'].plot) + ".";
			}
			if (!this.RP['roleplaying'].plot && !this.RP['amphyrp'].plot) {
				text += ". No RPs are void.";
			}
		} else {
			if (config.serverid === 'showdown') {
				var concurrent = (room === 'roleplaying') ? splitDoc(this.RP['amphyrp'].plot) : splitDoc(this.RP['roleplaying'].plot);
				var currentRust = (this.RP['rustyrp']) ? splitDoc(this.RP['rustyrp'].plot) : '';
				if (concurrent) text += '. The RP in ' + ((room === 'roleplaying') ? 'AmphyRP' : 'Roleplaying') + ' is ' + concurrent;
				if (currentRust) text+= ', and the RP in RustyRP is ' + currentRust;
				if(text.charAt(text.length - 1) !== '.') text += '.';
			}
		}

		if (!this.canUse('setrp', room, by) || this.RP[room].voidCalled) {
			this.say(room, '/pm ' + by + ', ' + text + " (" + room + ")");
		} else {
			this.say(room, '**' + text + '**');
			this.RP[room].voidCalled = true;
			setTimeout(function() {
				delete this.RP[room].voidCalled;
			}.bind(this), 60 * 1000);
		}
	},
	roleplay: 'rp',
	arpee: 'rp',
	rp: function(arg, by, room) {
		if (room.charAt(0) === ','){
			var text = '';
			var roomArray = (config.serverid === 'showdown') ? ['Roleplaying','AmphyRP','RustyRP'] : config.rprooms;
			for (i = 0; i < roomArray.length; i ++) {
				if (this.RP[toId(roomArray[i])].plot) {
					text += " The RP in " + roomArray[i] + " is " + splitDoc(this.RP[toId(roomArray[i])].plot);
					if (this.RP[toId(roomArray[i])].setAt) {
						var start = new Date(this.RP[toId(roomArray[i])].setAt);
						var now = (this.RP[toId(roomArray[i])].pause) ? new Date(this.RP[toId(roomArray[i])].pause) : new Date();
						var diff = (now.getTime() - start.getTime()) / 1000;
						var seconds = Math.floor(diff % 60);
						diff /= 60;
						var minutes = Math.floor(diff % 60);
						diff /= 60;
						var hours = Math.floor(diff % 24);
						var progress = hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
						text += ', in progress for ' + progress + '.';
					} else {
						text += '.';
					}
				}
			}
			for (i = 0; i < roomArray.length; i ++) {
				if (this.RP[toId(roomArray[i])].plot) {
					if (toId(this.RP[toId(roomArray[i])].plot) == 'freeroam') {
						this.say(room, text);
						return this.say(room, 'Check out the new RP Map: http://psroleplaying.forumotion.com/t1555-the-new-real-world-map');
					}
				}
			}
			return this.say(room, text);
		}
		if (!(room in this.RP)) return false;
		if (this.RP[room].called) {
			var text = '/pm ' + by + ', ';
		} else {
			var text = '';
			this.RP[room].called = true;
			setTimeout(function() {
				delete this.RP[room].called;
			}.bind(this), 60 * 1000);
		}
		if (!this.RP[room].plot) return this.say(room, text + 'There is no RP.');
		if (!this.RP[room].setAt) return this.say(room, text + 'The RP is ' + this.RP[room].plot + ', but it has not started yet. (Use .start when it is ready)');

		var start = new Date(this.RP[room].setAt);
		var now = (this.RP[room].pause) ? new Date(this.RP[room].pause) : new Date();
		var diff = (now.getTime() - start.getTime()) / 1000;
		var seconds = Math.floor(diff % 60);
		diff /= 60;
		var minutes = Math.floor(diff % 60);
		diff /= 60;
		var hours = Math.floor(diff % 24);
		var progress = hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);

		if (this.RP[room].pause) return this.say(room, text + 'The RP is ' + this.RP[room].plot + ', but it is paused. Paused at: ' + progress);
		this.say(room, text + 'The RP is ' + this.RP[room].plot + ', in progress for ' + progress + '.');
		if (!this.RP[room].host) return this.say(room, text + 'There is no host.');
		if (this.RP[room].host && this.RP[room].cohost) return this.say(room, text + 'The host is ' + this.RP[room].host + ', with ' + this.RP[room].cohost + ' as cohost(s).');
		this.say(room, text + 'The host is ' + this.RP[room].host + '.');
		if (toId(this.RP[room].plot) === 'freeroam') this.splitMessage('>' + room + '\n|c|~' + by + '|' + config.commandcharacter + 'mapassist');
		
	},
	host: function(arg, by, room) {
		if (room.charAt(0) === ','){
			var text = '';
			var roomArray = (config.serverid === 'showdown') ? ['Roleplaying','AmphyRP','RustyRP'] : config.rprooms;
			for (i = 0; i < roomArray.length; i ++) {
				if (this.RP[toId(roomArray[i])].plot && this.RP[toId(roomArray[i])].host) {
					text += " " + this.RP[toId(roomArray[i])].host + " is hosting in " + roomArray[i];
					if (this.RP[toId(roomArray[i])].cohost) {
						text += ', with ' + this.RP[toId(roomArray[i])].cohost + ' as cohost(s).';
					} else {
						text += '.';
					}
				}
			}
			return this.say(room, text);
		}
		if (!(room in this.RP)) return false;
		if (!this.RP[room].host) return false;
		if (this.RP[room].hostCalled) {
			var text = '/pm ' + by + ', ';
		} else {
			var text = '';
			this.RP[room].hostCalled = true;
			setTimeout(function() {
				delete this.RP[room].hostCalled;
			}.bind(this), 60 * 1000);
		}
		if (!this.RP[room].host) return this.say(room, text + 'There is no host.');
		if (this.RP[room].host && this.RP[room].cohost) return this.say(room, text + 'The host is ' + this.RP[room].host + ', with ' + this.RP[room].cohost + ' as cohost(s).');
		this.say(room, text + 'The host is ' + this.RP[room].host + '.');
	},
    rppoll: function(arg, by, room) {
        if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || this.RP[room].plot || !(room in this.RP)) return false; //setrp perms? is this RP room?
		if (pollON) { //if there's a poll already
			return this.say(room, '/msg ' + by + ', A RP poll cannot be started, as one is in progress already in ' + pollRoom);
		}
		pollRoom = room;
		//No poll on
		pollON = true; //There's a poll on now.
		var now = new Date(); //Good to know what time it is now
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "RP poll has been has been created by " + by + ".");
		this.say(room, '/wall **PM RPBot5516** with .nom [RP] to nominate the RP you want to be next. **Remember to only PM RPs you can host** and PM staff your customs. Ends at xx:' + ((((now.getMinutes()+3)%60) < 10) ? '0' + (((now.getMinutes()+3)%60).toString()) : ((now.getMinutes()+3)%60).toString()) + ':' + (((now.getSeconds() < 10)) ? '0' + now.getSeconds().toString() : now.getSeconds().toString()));
		pollTimer[room] = setTimeout(function() {
		    console.log(new Date().toString() + " Suggestion period has ended.");
		    if(pollNoms.length == 1) {
		    	pollON = false;
		    	if (RPOpts.indexOf(toId(pollNoms[0])) > -1){
		    		this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'setrp ' + rpcaps[RPOpts.indexOf(toId(pollNoms[0]))]);
		    	} else {
		    		this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'setrp ' + pollNoms[0]);
		    	}
		       	if (toId(pollNoms[0]) == 'freeroam' || toId(pollNoms[0]) == 'prom') {
		       		pollNoms = [];
					return this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'start');
		       	}
		    	this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'nominators ' + pollNoms[0]);
		    	pollON = false;
		    	pollNoms = [];
		    	pollroom = ''
		    	return false;
		    }
		    if(pollNoms.length > 1) { //If there are enough options to make a poll?
		    	pollON = true; //There's still a poll in progress marker from earlier on? I'm not sure why you're restating this.
		    	for(var y = 0; y < pollNoms.length; y++) { // y is which poll option you are at.
		    		if(RPOpts.indexOf(toId(pollNoms[y])) > -1) { //If it's in the offical RP list
		    			pollNoms[y] = rpcaps[RPOpts.indexOf(toId(pollNoms[y]))]; //Translate it to the properly capitalised version.
		    		}
		    		pollNoms[y].capitalize(true);
		    	}
		    	var now = new Date();
		        if(pollNoms.length > 8) {
		            pollNoms = pollNoms.slice(0, 8);
                    this.say(room, '/poll create Next RP? Ends at xx:' + ((((now.getMinutes()+3)%60) < 10) ? '0' + (((now.getMinutes()+3)%60).toString()) : ((now.getMinutes()+3)%60).toString()) + ':' + (((now.getSeconds() < 10)) ? '0' + now.getSeconds().toString() : now.getSeconds().toString()) + ", " + pollNoms.join(', '));
		            this.say(room, '/poll timer 3');
		        } else {
		            this.say(room, '/poll create Next RP? Ends at xx:' + ((((now.getMinutes()+3)%60) < 10) ? '0' + (((now.getMinutes()+3)%60).toString()) : ((now.getMinutes()+3)%60).toString()) + ':' + (((now.getSeconds() < 10)) ? '0' + now.getSeconds().toString() : now.getSeconds().toString()) + ', ' + pollNoms.join(', '));
		            this.say(room, '/poll timer 3');
		        }
		        this.RP[room].rppollProgress = true;
			    setTimeout(function() {
			    	this.say(room, '!poll display');
			    }.bind(this), 60 * 1000);
		    	setTimeout(function() {
			    	this.say(room, '!poll display');
		    	}.bind(this), 2 * 60 * 1000);
		    	setTimeout(function() {
		    		pollON = false;
	 				pollNoms = [];  // Maybe?  I dunno.  Clear poll noms after a poll has failed.
	 				delete this.RP[room].rppollProgress;
		    	}.bind(this), 3 * 60 * 1000);
		    } else {
		        this.say(room, '/wall There were not enough nominations.');
		        console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "The RP poll failed due to lack of suggestions.");
		        pollON = false;
		       	pollNoms = [];  // Maybe?  I dunno.  Clear poll noms after a poll has failed.
		       	pollroom = '';
		    }
		}.bind(this), 3 * 60 * 1000);
    },
    nom: "nominate",
    nominate: function(arg, by, room) {
    	if(room.charAt(0) !== ',') return false; //Making it PM only to prevent changes.  Making these edits at 2 AM, feel free to like...  fix them if I screwed up.
        if (!pollON) {
            return this.say(room, 'There is no RP poll in progress.');
        } //  Why not an if else?
        switch (toId(arg)) {
        	case 'fr':
        	case 'prom':
        		arg = 'Freeroam';
        		break;
        	case 'cq':
        		arg = "Conquest";
        		break;
        	case 'mm':
        		arg = 'Murder Mystery';
        		break;
        	case 'gve':
        		arg = 'Good vs Evil';
        		break;
        	case 'uni': case 'pokeUni':
        		arg = 'PokeHigh';
        		break;
        	case 'ph':
        		arg = 'PokeHigh';
        		break;
        	case 'dungeonsanddragonites':
        	case 'dungeonsanddragons':
        	case 'dungeonsanddruddigons':
        	case 'dnd':
        	case 'dungeonsndragons':
        	case 'dungeonsndruddigons':
        		arg = 'Dungeons \'n Dragonites';
        		break;
        	case 'pmd':
        	case 'pokmonmysterydungeon':
        		arg = 'Pokemon Mystery Dungeon';
        		break;
        	case 'hg':
        		arg = 'Hunger Games';
        		break;
        	case 'za':
        		arg = 'zombie apocalypse';
        		break;
        	default:
        		break;
        }
        for (i = 0; i < config.rprooms.length; i++) {
			if (this.RP[config.rprooms[i]]) {
				if(toId(arg) == toId(splitDoc(this.RP[config.rprooms[i]].plot))) {
					return this.say(room, 'That RP is currently ongoing in ' + config.rprooms[i])
				}
			}
		}
    	if (pollRoom == 'amphyrp' && toId(arg) == 'freeroam'){
    	    return this.say(room, "Freeroam and its variants cannot be run in AmphyRP.");
    	}
    	if (pollRoom == 'amphyrp' && toId(arg) == 'prom'){
    		return this.say(room, "Prom cannot be run in AmphyRP");
    	}
        if(RPOpts.indexOf(toId(arg)) == -1 && !((this.hasRank(by, '+%@#&~')) || (config.voiceList.indexOf(toId(by)) > -1) || (config.staffList.indexOf(toId(by)) > -1))) {
            return this.say(room, 'Check your spelling, or if it\'s a custom, please suggest them to a voice or above.');
        }
 /*       if(toId(arg) == 'freeroam' || toId(arg) == 'prom') {
        	if((toId(this.RP.void[pollRoom].toString()).indexOf('freeroam') > -1 || toId(this.RP.void[pollRoom].toString()).indexOf('prom') > -1)/* && pollRoom != 'rustyrp'*//*) return this.say('That RP is void.');
        }*/
        if (toId(arg) == 'freeroam' || toId(arg) == 'prom'){
	        if (toId(pollNoms.toString()).indexOf(toId('freeroam')) > -1 || toId(pollNoms.toString()).indexOf(toId('freeroam')) > -1) {
	        	return this.say(room, 'That RP has already been suggested.');
	        }
	        
        }
/*        if(toId(arg) == 'freeroam' || toId(arg) == 'cruise' || toId(arg) == 'prom' || toId(arg) == 'kingdom') {
        	if((toId(this.RP.void[pollRoom].toString()).indexOf('freeroam') > -1 || toId(this.RP.void[pollRoom].toString()).indexOf('cruise') > -1 || toId(this.RP.void[pollRoom].toString()).indexOf('prom') > -1 || toId(this.RP.void[pollRoom].toString()).indexOf('kingdom') > -1) && pollRoom != 'rustyrp') return this.say(room, 'That RP is void.');
        }*/
       	if(toId(arg) == 'pokemonmysterydungeon') {
        	
		    for (i = 0; i < config.rprooms.length; i++) {
				if (this.RP[config.rprooms[i]]) {
					if(toId((this.RP[config.rprooms[i]]).toString()).indexOf('pokmonmysterydungeon') > -1) {
						if(toId(arg) == toId(splitDoc(this.RP[config.rprooms[i]]))) {
							return this.say(room, 'That RP is currently ongoing in ' + config.rprooms[i])
						}
					}
				}
			}    			
        }
        if(toId(arg) == 'pokehigh') {
        	
		    for (i = 0; i < config.rprooms.length; i++) {
				if (this.RP[config.rprooms[i]]) {
					if(toId((this.RP[config.rprooms[i]]).toString()).indexOf('pokhigh') > -1) {
						if(toId(arg) == toId(splitDoc(this.RP[config.rprooms[i]]))) {
							return this.say(room, 'That RP is currently ongoing in ' + config.rprooms[i])
						}
					}
				}
			}    			
        }
    	if(toId(arg) == 'dungeonsndragonites' || toId(arg) == 'dungeonsndragons' || toId(arg) == 'dungeonsndruddigons') {
        	
		    for (i = 0; i < config.rprooms.length; i++) {
				if (this.RP[config.rprooms[i]]) {
					if(toId((this.RP[config.rprooms[i]]).toString()).indexOf('dungeonsnd') > -1 || toId((this.RP[config.rprooms[i]].plot).toString()).indexOf('dungeonsandd') > -1) {
/*						if(toId(arg) == toId(splitDoc(this.RP[config.rprooms[i]].))) {
							return this.say(room, 'That RP is currently ongoing in ' + config.rprooms[i])
						}*/
					}
				}
			}
        }
        /*if (toId(this.RP.void[pollRoom].toString()).indexOf(toId(arg)) > -1/* && pollRoom != 'rustyrp'*//*) {
        	return this.say(room, 'That RP is void.');
        }*/
        switch (toId(arg)) {
		    case 'goodvsevil':
		    	if (goodvsevilNom.indexOf(by) == -1) goodvsevilNom.push(by);
		        break;
		    case 'conquest':
		    	if (conquestNom.indexOf(by) == -1) conquestNom.push(by);
		        break;
		    case 'trainer':
		    	if (trainerNom.indexOf(by) == -1) trainerNom.push(by);
		        break;
		    case 'pokehigh':
		    	if (pokehighNom.indexOf(by) == -1) pokehighNom.push(by);
		        break;
		    case 'murdermystery':
		    	if (murdermysteryNom.indexOf(by) == -1) murdermysteryNom.push(by);
		        break;
		    case 'pokemonmysterydungeon':
		    	if (pokemonmysterydungeonNom.indexOf(by) == -1) pokemonmysterydungeonNom.push(by);
		        break;
		    case 'dungeonsndragonites':
		    	if (dungeonsndragonitesNom.indexOf(by) == -1) dungeonsndragonitesNom.push(by);
		        break;
		    case 'kingdom':
		    	if (kingdomNom.indexOf(by) == -1) kingdomNom.push(by);
		        break;
		    default:
		    break;
		}
        if (toId(pollNoms.toString()).indexOf(toId(arg)) > -1) {
			pollNoms.push(arg);
    	    this.say(room, 'Thank you for your suggestion! Please note that not all RPs may be added to poll.');
        } else {
    	    pollNoms.push(arg);
    	    if (RPOpts.indexOf(toId(arg)) == -1) this.say(pollRoom, 'Custom: ' + arg + ' has been added to the poll.');
    	    this.say(room, 'Thank you for your suggestion! Please note that not all RPs may be added to poll.');
        }
    },
    nominators: function (arg, by, room) {
		if (config.serverid !== 'showdown' || !this.hasRank(by, '~') || !(room in this.RP)) return false;
		if (RPOpts.indexOf(toId(arg)) > -1) {
			switch (toId(arg)) {
				case 'goodvsevil':
				    this.say(room, 'Nominators for ' + arg + ' were ' + goodvsevilNom.join(', '));
				    break;
				case 'conquest':
				    this.say(room, 'Nominators for ' + arg + ' were ' + conquestNom.join(', '));
				    break;
				case 'trainer':
				    this.say(room, 'Nominators for ' + arg + ' were ' + trainerNom.join(', '));
				    break;
				case 'pokehigh':
				    this.say(room, 'Nominators for ' + arg + ' were ' + pokehighNom.join(', '));
				    break;
				case 'cruise':
				    this.say(room, 'Nominators for ' + arg + ' were ' + cruiseNom(', '));
				    break;
				case 'murdermystery':
				    this.say(room, 'Nominators for ' + arg + ' were ' + murdermysteryNom.join(', '));
				    break;
				case 'pokemonmysterydungeon':
				    this.say(room, 'Nominators for ' + arg + ' were ' + pokemonmysterydungeonNom.join(', '));
				    break;
				case 'dungeonsndragonites':
				    this.say(room, 'Nominators for ' + arg + ' were ' + dungeonsndragonitesNom.join(', '));
				    break;
				case 'kingdom':
				    this.say(room, 'Nominators for ' + arg + ' were ' + kingdomNom.join(', '));
				    break;
				default:
				break;
				}
		}
		goodvsevilNom = [];
		conquestNom = [];
		trainerNom = [];
		pokehighNom = [];
		cruiseNom = [];
		murdermysteryNom = [];
		pokemonmysterydungeonNom = [];
		dungeonsndragonitesNom = [];
		kingdomNom = [];
	},
	ep: "endpoll",
	endpoll: function(arg, by, room) {
		if (!this.canUse('endpoll', room, by) || !(room in this.RP) || !this.RP[room].setAt) return false;
//		if (!arg) return this.say(room, 'Please specify the requester of the poll.');
		if (this.RP[room].endpollCalled) return this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'lastendpoll');
			
                var now = new Date();
		if (arg && toId(arg) !== 'requested' && toId(arg).length < 19) {
		        this.say(room, '/poll create End Poll: ends at xx:' + ((((now.getMinutes()+3)%60) < 10) ? '0' + (((now.getMinutes()+3)%60).toString()) : ((now.getMinutes()+3)%60).toString()) + ':' + (((now.getSeconds() < 10)) ? '0' + now.getSeconds().toString() : now.getSeconds().toString()) + ". Requested by " + arg + " , Continue, End");
			console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "End poll has been has been created by " + by + " upon request by " + arg + ".");
			return this.say(room, '/modnote ' + by + ' created an end poll upon request by ' + arg + "");
		}

	        this.say(room, '/poll create End Poll: ends at xx:' + ((((now.getMinutes()+3)%60) < 10) ? '0' + (((now.getMinutes()+3)%60).toString()) : ((now.getMinutes()+3)%60).toString()) + ':' + (((now.getSeconds() < 10)) ? '0' + now.getSeconds().toString() : now.getSeconds().toString()) + ", Continue, End");
		console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "End poll has been has been created by " + by + ".");
		this.say(room, '/modnote ' + by + ' created an end poll.');

		this.say(room, '/poll timer 3');
		this.RP[room].endpollCalled = true;
		this.RP[room].endpollProgress = true;
		setTimeout(() => {
			this.say(room, '!poll display');
                        setTimeout(() => {
                                this.say(room, '!poll display');
                                this.RP[room].endPollTimerSet = setTimeout(() => {
                                        delete this.RP[room].endPollProgress;
                                        this.RP[room].lastEndPoll = new Date();
                                        delete this.RP[room].endPollTimerSet;
                                        setTimeout(() => (delete this.RP[room].endPollCalled), 15 * 60 * 1000);
                                }, 1 * 60 * 1000);
                        }, 1 * 60 * 1000);
                }, 1 * 60 * 1000);
	},
	lep: "lastendpoll",
	lastendpoll: function(arg, by, room) {
		if (room.charAt(0) === ','){
			var text = '';
			var roomArray = (config.serverid === 'showdown') ? ['Roleplaying','AmphyRP','RustyRP'] : config.rprooms;
			for (i = 0; i < roomArray.length; i ++) {
				if (this.RP[toId(roomArray[i])].setAt) { // If an RP is set
					if (this.RP[toId(roomArray[i])].lastEndPoll) { // Check if an endpoll has been done
						var start = new Date(this.RP[toId(roomArray[i])].lastEndPoll);
						var now = new Date();
						var diff = (now.getTime() - start.getTime()) / 1000;
						var seconds = Math.floor(diff % 60);
						diff /= 60;
						var minutes = Math.floor(diff % 60);
						diff /= 60;
						var hours = Math.floor(diff % 24);
						if (hours == 0) {
							var timeleft = ((minutes < 10) ? '0' + minutes : minutes) + ' minutes and ' + ((seconds < 10) ? '0' + seconds : seconds);
						} else {
							var timeleft = (hours == 1) ?  hours + ' hour, ' +  (((minutes < 10) ? '0' + minutes : minutes) + ' minutes and ' + ((seconds < 10) ? '0' + seconds : seconds)) :( hours + ' hours, ' + ((minutes < 10) ? '0' + minutes : minutes) + ' minutes and ' + ((seconds < 10) ? '0' + seconds : seconds));
						}
						text += 'The last endpoll was made ' + timeleft + ' seconds ago, in ' + roomArray[i] + '. ';
					} else {
						text += 'No endpoll has run since the RP was started in ' + roomArray[i] + '. ';
					}
				}
			}
			return this.say(room, text);
		}
		if (!this.canUse('endpoll', room, by) || !(room in this.RP) || !this.RP[room].setAt) return false; 
		if (this.RP[room].lastEndPoll) {
			var text = '';
			var start = new Date(this.RP[room].lastEndPoll);
			var now = new Date();
			var diff = (now.getTime() - start.getTime()) / 1000;
			var seconds = Math.floor(diff % 60);
			diff /= 60;
			var minutes = Math.floor(diff % 60);
			diff /= 60;
			var hours = Math.floor(diff % 24);
			if (hours == 0) {
				var timeleft = ((minutes < 10) ? '0' + minutes : minutes) + ' minutes and ' + ((seconds < 10) ? '0' + seconds : seconds);
			} else {
				var timeleft = (hours == 1) ?  hours + ' hour, ' +  (((minutes < 10) ? '0' + minutes : minutes) + ' minutes and ' + ((seconds < 10) ? '0' + seconds : seconds)) :( hours + ' hours, ' + ((minutes < 10) ? '0' + minutes : minutes) + ' minutes and ' + ((seconds < 10) ? '0' + seconds : seconds));
			}
			text += 'The last endpoll was made ' + timeleft + ' seconds ago';
			if (this.RP[room].lastPollVoided) text += ', but was voided';
				this.say(room, '/w ' + by + ', ' + text + '.');
			} else {
				this.say(room, '/w ' + by +', No endpoll has run since the RP was started.');
		}
	},
	cp: 'customPriority',
	customPriority: function (arg, by, room) {
		if (!this.hasRank(by, '%@#&~') || room != 'amphyrp' || typeof this.RP[room].setAt != 'undefined' || config.serverid != 'showdown') return false;
		if (!arg || toId(arg).length > 19 || toId(arg) == 'requested') return this.say(room, 'Please specify the person claiming custom priority.');
		if (pollRoom == 'amphyrp') this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'voidpoll');
		this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'setrp CP');
		this.splitMessage('>' + room + '\n|c|~luxlucario|' + config.commandcharacter + 'sethost ' + arg);
		customPriorityFlag = true;
		this.say(room, '/modnote ' + arg + ' has claimed custom priority.');
	},
	vp: 'voidpoll',
	voidpoll: function(arg, by, room) {
		if (room.charAt(0) === ',' && (config.staffList.indexOf(toId(by)) > -1)) room = pollRoom;
		if (!(room in this.RP) || !pollON || !this.hasRank(by, '%@#&~') || pollRoom != room) return false;
			pollON = false;
			this.splitMessage('>' + pollRoom + '\n|c|~luxlucario|' + config.commandcharacter + 'nominators boop');
			pollNoms = [];
			clearTimeout(pollTimer[pollRoom]);
			delete pollTimer[pollRoom];
			if (this.RP[room].rppollProgress) {
				this.voidpoll[room] = true;
				this.say(room, "/poll end");
				delete this.RP[room].rppollProgress;
			}
			console.log(new Date().toString() + " "+ room.cyan + ': '.cyan + "The RP poll has been voided.");
			return this.say(room, 'RP Poll voided.');
	},
	vep: 'voidendpoll',
	voidendpoll: function(arg, by, room) {
		if (!this.RP[room].endpollProgress || !this.hasRank(by, '%@#&~')) return false;
		delete this.RP[room].endpollCalled;
		delete this.RP[room].endpollProgress;
		clearTimeout(this.endpollTimerSet);
		delete this.endpollTimerSet;
		this.voidpoll = true;
		this.say(room, "/poll end");
		return this.say(room, 'Endpoll voided.');
	},
	timer: function(arg, by, room){
		if (!(room in this.RP)) return false;
		if (typeof this.RP[room].host != 'undefined') {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) && !(toId(by) == toId(this.RP[room].host))  || !this.RP[room].host || this.RP[room].setAt) return false;
		} else {
			if (config.voiceList.indexOf(toId(by)) == -1 && !this.canUse('setrp', room, by) || !this.RP[room].host || this.RP[room].setAt) return false;
		}

		var start = new Date(this.RP[room].setUpAt);
		var now = new Date();
		if (/conquest/i.test(toId(this.RP[room].plot))) {
			var diff = (15 * 60 * 1000 - (now.getTime() - start.getTime())) / 1000;
		} else {
			var diff = (30 * 60 * 1000 - (now.getTime() - start.getTime())) / 1000;
		}
		var seconds = Math.floor(diff % 60);
		diff /= 60;
		var minutes = Math.floor(diff % 60);
		diff /= 60;
		var timeleft = ((minutes < 10) ? '0' + minutes : minutes) + ' minutes and ' + ((seconds < 10) ? '0' + seconds : seconds);
		// If timeleft is less than 0, give a warning that there is no more time left.
		if (diff > 0) {
			this.say (room, "The host has " + timeleft + " seconds left to set up.");
		} else {
			this.say (room, "The host has exhausted the time allotted for set up.  Highlighting mods.");
		}
	},
	psa: 'publicserviceannouncement',
	publicserviceannouncement: function(arg, by, room) {
		if (config.serverid == 'showdown' && room.charAt(0) === ',') {
			return this.say(room, config.publicSeviceAnnouncement);
		}
		if (config.serverid !== 'showdown' || !this.hasRank(by, '%@#&~') || !(room in this.RP)) {
			var text = '/w '+ by + ',';
		} else {
			var text = '';
			if (this.RP[room].setAt && !this.RP[room].pause) {
				return this.say(room, text + ' ((' + config.publicSeviceAnnouncement + '))');
			}
		}
		this.say(room, text + ' ' + config.publicSeviceAnnouncement);
	},
	botissue: 'botsuggestions',
	botissues: 'botsuggestions',
	botsuggest: 'botsuggestions',
	botsuggestions: function(arg, by, room) {
		if (config.serverid == 'showdown' && room.charAt(0) === ',') {
			return this.say(room, 'Any issues I have go here!  N-not that I have any! ' + config.fork + '/issues');
		}
		if (config.serverid !== 'showdown' || !this.hasRank(by, '%@#&~') || !(room in this.RP))
		{
			var text = '/w '+ by + ',';
		} else {
			var text = '';
			if (this.RP[room].setAt && !this.RP[room].pause) {
				return this.say(room, text + ' ((Any issues I have go here!  N-not that I have any! ' + config.fork + '/issues))');
			}
		}
		this.say(room, text + ' Any issues I have go here!  N-not that I have any! ' + config.fork + '/issues');
	},
	legend: 'legends',
	legends: function(arg, by, room) {
		if (config.serverid == 'showdown' && room.charAt(0) === ',') {
			if (arg) {
				if (config.legendtoIdList.indexOf(toId(arg)) > -1) {
					var legendNum = config.legendtoIdList.indexOf(toId(arg))
					return this.say(room, ' Legend: ' + config.legendList[legendNum] + ', Owner: ' + config.legendOwnerList[legendNum] + ', Name: ' + config.legendOCList[legendNum] + '.')
				}
			} else {
				return this.say(room, 'Legend Permission Spreadsheet: https://docs.google.com/spreadsheets/d/1eiZH3aGMrWognbhCYOdTOV7ZvgoYgN-V0MYGp_6SkQo/edit');
			}
		}
		if (config.serverid !== 'showdown' || !this.hasRank(by, '%@#&~') || !(room in this.RP))
		{
			var text = '/w '+ by + ',';
		} else {
			var text = '';
		}
		if (arg) {
			if (config.legendtoIdList.indexOf(toId(arg)) > -1) {
				var legendNum = config.legendtoIdList.indexOf(toId(arg))
				 return this.say(room, text + ' Legend: ' + config.legendList[legendNum] + ', Owner: ' + config.legendOwnerList[legendNum] + ', Name: ' + config.legendOCList[legendNum] + '.')
			}
		} else {
		this.say(room, text + ' Legend Permission Spreadsheet: https://docs.google.com/spreadsheets/d/1eiZH3aGMrWognbhCYOdTOV7ZvgoYgN-V0MYGp_6SkQo/edit');
		}
	},
	site: function(arg, by, room) {
		if (config.serverid !== 'showdown') return false;
		if ((this.hasRank(by, '+%@#~') && config.rprooms.indexOf(room) !== -1) || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		this.say(room, text + 'Roleplaying\'s Website: http://psroleplaying.forumotion.com/t1165-rp-room-rules-and-guidelines');
	},
	forum: function(arg, by, room) {
		if (config.serverid !== 'showdown') return false;
		if ((this.hasRank(by, '+%@#~') && config.rprooms.indexOf(room) !== -1) || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		this.say(room, text + 'Roleplaying\'s Forum: http://psroleplaying.forumotion.com/');
	},
	rustyrp: function(arg, by, room) {		
	if (config.serverid !== 'showdown' ||  !(room in this.RP)) return false;
		if ((this.hasRank(by, '+%@#~') && config.rprooms.indexOf(room) !== -1) || room.charAt(0) === ',') {		
			var text = '';		
		} else {		
			var text = '/pm ' + by + ', ';		
		}
		this.say(room, text + 'http://psroleplaying.forumotion.com/t1599-rustyrp-rebirth#36632');		
	},
	worldmap: 'map',
	map: function(arg, by, room) {		
	if (config.serverid !== 'showdown') return false;
		if ((this.hasRank(by, '+%@#~') && config.rprooms.indexOf(room) !== -1) || room.charAt(0) === ',') {		
			var text = '';		
		} else {		
			var text = '/pm ' + by + ', ';		
		}
		this.say(room, text + 'Check out the new RP Map: http://psroleplaying.forumotion.com/t1555-the-new-real-world-map');		
	},
	mapassist: function(arg, by, room) {
		if (config.serverid !== 'showdown' || !this.hasRank(by, '~') || !(room in this.RP) || toId(this.RP[room].plot) !== 'freeroam') return false;
		if (this.RP[room].mapcalled) {
			var text = '/pm ' + by + ', ';
		} else {
			var text = '';
			this.RP[room].mapcalled = true;
			setTimeout(function() {
				delete this.RP[room].mapcalled;
			}.bind(this), 60 * 1000);
		}
		this.say(room, text + 'Check out the new RP Map: http://psroleplaying.forumotion.com/t1555-the-new-real-world-map');
	},
	defaultDoc: function (arg, by, room) {
		if (config.serverid !== 'showdown' || !this.hasRank(by, '~') || !(room in this.RP)) return false;
		if (RPOpts.indexOf(toId(arg)) > -1) {
			switch (toId(arg)) {
				case 'cruise':
				    	this.splitMessage('>' + room + '\n|c|' + by + '|' + config.commandcharacter + 'setdoc https://docs.google.com/document/d/1BWKfcir8fCSROEId4r1hqxe1DnAETkbdv2pKBxapgcI');
					break;
				default:
				break;
				}
		}
	}
};