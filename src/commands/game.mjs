import * as database from '../database/main.mjs';
import logger from '../logger.mjs';

const kick = {
  name: 'game',
  description: 'Начать игру',
  async execute(message) {
    const config = await database.getConfigByGuildID(message.guild.id);
    if (message.channel.id === config.rating_commands_chat_id
      && message.member.voice.channel.parentID === config.rating_voice_category_id) {
      // Создать игру
      // Проверить нет ли активных игр у того кто начинает игру
      const owner = message.author.id;
      const activeGame = await database.findActiveGameByOwnerId(owner);
      if (activeGame) {
        // У вас есть не законченная игра
        message.reply('У вас есть не законченная игра').then((msg) => msg.delete(5000)).catch((error) => logger.error(error));
      } else {
        if (message.member.voice.channel.members.size !== 10) {
          message.reply('Количество игроков должно быть: 10').then((msg) => msg.delete(5000)).catch((error) => logger.error(error));
          return;
        }
        let memberString1 = '';
        let memberString2 = '';
        const members = message.member.voice.channel.members.map((member) => member.id);
        const membersInGame = [];

        for (let i = 0; i < members.length; i++) {
          const member = members[i];
          // eslint-disable-next-line no-await-in-loop
          if (await database.checkPlayerInGame(member)) {
            membersInGame.push(member);
          }
          if (i <= 4) {
            memberString1 += `<@${member}>\n`;
          } else {
            memberString2 += `<@${member}>\n`;
          }
        }
        if (membersInGame.length > 0) {
          let memberInGameStr = 'Игрок(и): ';
          for (let i = 0; i < membersInGame.length; i++) {
            const member = membersInGame[i];
            memberInGameStr += `<@${member}> `;
          }
          memberInGameStr += 'уже участвуют в другой игре.';
          message.reply(memberInGameStr)
            .then((msg) => msg.delete(5000)).catch((error) => logger.error(error));
          return;
        }

        const map = 1;
        const createdGame = await database.createGame(
          message.author.id, message.guild.id, members, map,
        );

        const playEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Tplay');
        const playersEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Tplayers');

        const embed = {
          color: 3049170,
          description: `${playEmoji.toString()} **Матч #${createdGame.game_id} начат**`,
          author: {
            name: `${message.author.username}`,
            icon_url: `${message.author.displayAvatarURL()}`,
          },
          fields: [
            {
              name: `${playersEmoji.toString()} Список игроков`,
              value: memberString1,
              inline: true,
            },
            {
              name: '\u200b',
              value: memberString2,
              inline: true,
            },
          ],
          timestamp: new Date(),
          footer: {
            text: 'AmongUs Ratings',
          },
        };
        message.channel.send({ embed });
      }
    } else {
      message.reply('Не соблюдены правила.').then((msg) => msg.delete(5000)).catch((error) => logger.error(error));
    }
  },
};

export default kick;
