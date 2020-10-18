import dotenv from 'dotenv';
import Discord from 'discord.js';
import fs from 'fs';
import path from 'path';
import * as lib from './functions.mjs';
import logger from './logger.mjs';
import * as database from './database/main.mjs';

dotenv.config();

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.resolve();
const client = new Discord.Client();
client.commands = new Discord.Collection();

async function addCommands() {
  const commandFiles = fs.readdirSync(`${__dirname}/src/commands`).filter((file) => file.endsWith('.mjs'));

  for (let i = 0; i < commandFiles.length; i++) {
    const element = commandFiles[i];
    // eslint-disable-next-line no-await-in-loop
    const command = await import(`./commands/${element}`);
    client.commands.set(command.default.name, command.default);
  }
}

addCommands();
client.on('ready', () => {
  logger.info(`DISCORD:: Бот авторизовался как ${client.user.tag}!`);
});

// eslint-disable-next-line consistent-return
client.on('message', (message) => {
  const prefix = '!';

  if (!message.content.startsWith(prefix) || message.author.bot) return;
  if (message.channel.type === 'dm') {
    logger.trace(`DM:: Новое сообщение в ЛС: ${message.content}!`);
    message.reply('Developed by <@177001826321825792>');
  }
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName)
    || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;
  try {
    command.execute(message, args);
  } catch (error) {
    logger.error(`OnMessage: ${error}`);
    message.reply('Произошла ошибка при вводе этой команды!');
  }
});

/*
client.on('guildMemberAdd', (member) => {
  const role = member.guild.roles.cache.get(process.env.DISCORD_AUTH_ROLE);
  member.roles.add(role.id);
});
*/

/**
 * Инициализация бота
 */
async function InitServer() {
  // client.user.setActivity('Among Us', { type: 'PLAYING' })
  // const gameRooms = await lib.getRooms();
  database.init();
  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);

  client.on('voiceStateUpdate', (oldState, newState) => {
    lib.handleVoiceState(oldState, newState);
  });

  // lib.setupLobbies(guild);
  // lib.fixChannelPosition(guild);

  setInterval(lib.setActivityStatistic, 5000, client, guild);
  setInterval(lib.checkChannels, 60000, guild);
  // setInterval(lib.checkDeleteLobbys, 600000, guild);
  setInterval(lib.updateLeaderboard, 60000, guild);
}

client.login(process.env.DISCORD_TOKEN);
setTimeout(InitServer, 5000);
