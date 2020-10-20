import dotenv from 'dotenv';
import Discord from 'discord.js';
import fs from 'fs';
import path from 'path';
import logger from './logger.mjs';
import * as database from './database/main.mjs';

dotenv.config();
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

client.login('NTE1NTEzMDE4MTEzNzIwMzMx.W_f66Q.3nShb3vsCMmtnKUXKAEHlHlo__8');

async function InitServer() {
  database.init();
  const game = await database.checkPlayerInGame('696138838967320626');
  logger.info(game);
  // const guild = client.guilds.cache.get('758372773923258399');

  // const game = await database.findActiveGameByOwnerId('177001826321825792');
  // console.log(game.members.length);

}

setTimeout(InitServer, 5000);
