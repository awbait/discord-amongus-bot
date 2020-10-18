import * as database from '../database/main.mjs';
// import logger from '../logger.mjs';

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
        message.reply('У вас есть не законченная игра');
      } else {
        const { members } = message.member.voice.channel;
        if (members.size !== 10) {
          message.reply('Количество игроков должно быть: 10');
          return;
        }
        let memberString1 = '';
        let mI1 = 0;
        let memberString2 = '';
        const membersArray = [];

        const playEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Tplay');
        // const pauseEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Tpause');
        const playersEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Tplayers');
        // const mapsEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Tmaps');

        members.forEach((member) => {
          if (mI1 <= 4) {
            memberString1 += `<@${member.user.id}>\n`;
            mI1 += 1;
          } else {
            memberString2 += `<@${member.user.id}>\n`;
          }
          membersArray.push(member.user.id);
        });
        const map = 1;
        const createdGame = await database.createGame(
          message.author.id, message.guild.id, membersArray, map,
        );
        const exampleEmbed = {
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
            /*
            {
              name: `${mapsEmoji.toString()} Выберите карту`,
              value: '1️⃣ - Скельд\n2️⃣ - Полюс\n3️⃣ - Мира',
            },
            */
          ],
          timestamp: new Date(),
          footer: {
            text: 'AmongUs Ratings',
          },
        };
        message.channel.send({ embed: exampleEmbed });
        /*
          .then((msg) => {
            msg.react('1️⃣').then(() => msg.react('2️⃣').then(() => msg.react('3️⃣')));
            const filter = (reaction, user) => ['1️⃣', '2️⃣', '3️⃣'].includes(reaction.emoji.name)
            && user.id === message.author.id;
            msg.awaitReactions(filter, { max: 1, time: 15000 })
              // eslint-disable-next-line consistent-return
              .then(async (collected) => {
                const reaction = collected.first();
                if (reaction?.emoji.name === '1️⃣') {
                  map = 1;
                } else if (reaction?.emoji.name === '2️⃣') {
                  map = 2;
                } else if (reaction?.emoji.name === '3️⃣') {
                  map = 3;
                } else {
                  msg.reactions.removeAll();
                  message.channel.send('Карта не выбрана, отмена игры.');
                  return null;
                }
                const nameMap = {
                  1: 'Скельд',
                  2: 'Полюс',
                  3: 'Мира',
                };

                const createdGame = await database.createGame(
                  message.author.id, message.guild.id, membersArray, map,
                );

                const twoEmbed = {
                  color: 3049170,
                  description: `${playEmoji.toString()} Матч #${createdGame.game_id} начат`,
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
                    {
                      name: `${mapsEmoji.toString()} Карта`,
                      value: nameMap[map],
                    },
                  ],
                  timestamp: new Date(),
                  footer: {
                    text: 'AmongUs Ratings',
                  },
                };
                msg.reactions.removeAll();
                msg.edit({ embed: twoEmbed });
              })
              .catch((error) => logger.error(error));
          });
          */
      }
    } else {
      message.reply('Не соблюдены правила.');
    }
  },
};

export default kick;
