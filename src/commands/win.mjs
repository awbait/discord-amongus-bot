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
      const matchResult = command.shift().toLowerCase();
      const game = await database.findActiveGameByOwnerId(message.author.id);

      if (game) {
        if (message.mentions.members.size === 2) {
          const traitors = message.mentions.members.map((member) => member.id);
          if (matchResult === 'win') {
            // Победили трейторы
            const obj = await ranked.checkChargePoints(game, traitors, 'lose', 'win');
            const embed = await ranked.generateEmbedGameResult(message, game, obj, 'lose', 'win');
            message.channel.send({ embed });
            /*
            if (traitors.some((e) => e === message.author.id)) {
              // Победили трейторы
              const obj = await ranked.checkChargePoints(game, traitors, 'lose', 'win');
              const embed = await ranked.generateEmbedGameResult(message, game, obj, 'lose', 'win');
              message.channel.send({ embed });
            } else {
              // Победил экипаж
              const obj = await ranked.checkChargePoints(game, traitors, 'win', 'lose');
              const embed = await ranked.generateEmbedGameResult(message, game, obj, 'win', 'lose');
              message.channel.send({ embed });
            }
            */
          } else if (matchResult === 'lose') {
            // Победил экипаж
            const obj = await ranked.checkChargePoints(game, traitors, 'win', 'lose');
            const embed = await ranked.generateEmbedGameResult(message, game, obj, 'win', 'lose');
            message.channel.send({ embed });
            /*
            if (traitors.some((e) => e === message.author.id)) {
              // Трейторы проиграли
              const obj = await ranked.checkChargePoints(game, traitors, 'win', 'lose');
              const embed = await ranked.generateEmbedGameResult(message, game, obj, 'win', 'lose');
              message.channel.send({ embed });
            } else {
              // Проиграл экипаж
              const obj = await ranked.checkChargePoints(game, traitors, 'lose', 'win');
              const embed = await ranked.generateEmbedGameResult(message, game, obj, 'lose', 'win');
              message.channel.send({ embed });
            }
            */
          }
          // Обновляем статус игры на завершена
          await database.updateGame(game.game_id, { status: 'completed' });
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
