/* eslint-disable no-await-in-loop */
import * as database from '../database/main.mjs';
import * as ranked from '../ranked/index.mjs';

const win = {
  name: 'win',
  description: 'Результат матча',
  aliases: ['lose'],
  async execute(message) {
    const config = await database.getConfigByGuildID(message.guild.id);
    if (message.channel.id === config.rating_commands_chat_id) {
      const command = message.content.slice(config.prefix.length).trim().split(/ +/);
      const result = command.shift().toLowerCase();
      const game = await database.findActiveGameByOwnerId(message.author.id);

      if (game) {
        if (message.mentions.members.size === 2) {
          const traitors = message.mentions.members.map((member) => member.id);
          // ID трейторов должны быть в массиве members
          if (traitors.every((t) => game.members.includes(t))) {
            if (result === 'win') {
              // Победили трейторы
              const obj = await ranked.checkChargePoints(game, traitors, 'lose', 'win');
              const embed = await ranked.generateEmbedGameResult(message, game, obj, 'lose', 'win');
              message.channel.send({ embed });
            } else if (result === 'lose') {
              // Победил экипаж
              const obj = await ranked.checkChargePoints(game, traitors, 'win', 'lose');
              const embed = await ranked.generateEmbedGameResult(message, game, obj, 'win', 'lose');
              message.channel.send({ embed });
            }
            const members = game.members.filter((m) => !traitors.includes(m));
            // Обновляем статус игры на завершена, записываем трейторов и результат
            await database.updateGame(game.game_id, {
              members, traitors, status: 'completed', result,
            });
          } else {
            message.reply('Некорректный ввод трейторов');
          }
        } else {
          message.reply('Вы должны указать обоих трейтеров. `!win (!lose) @Трейтор @Трейтор`');
        }
      } else {
        message.reply('Активной игры не найдено!');
      }
    }
  },
};

export default win;
