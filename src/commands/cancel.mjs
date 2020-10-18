/* eslint-disable no-await-in-loop */
import * as database from '../database/main.mjs';
import logger from '../logger.mjs';

const cancel = {
  name: 'cancel',
  description: 'Отмена матча',
  aliases: ['отмена'],
  async execute(message, args) {
    const config = await database.getConfigByGuildID(message.guild.id);

    if (message.channel.id === config.rating_commands_chat_id) {
      let game;
      logger.info(config);
      const { admins } = config;
      logger.info(admins);
      if (args.length > 0 && admins.some((admin) => admin === message.author.id)) {
        // asd
        game = await database.findActiveGameByGameId(args[0]);
        if (game) {
          await database.updateGame(game.game_id, { status: 'canceled' });
          message.reply(`Матч #${game.game_id} отменён администратором.`);
        } else {
          message.reply('Матч не найден!');
        }
      } else {
        game = await database.findActiveGameByOwnerId(message.author.id);
        if (game) {
          await database.updateGame(game.game_id, { status: 'canceled' });
          message.reply(`Матч #${game.game_id} отменён.`);
        } else {
          message.reply('Матч не найден');
        }
      }
    }
  },
};

export default cancel;
