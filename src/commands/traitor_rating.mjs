import * as database from '../database/main.mjs';

const traitor = {
  name: 'traitor_rating',
  description: 'Игра проиграна. Победа предателей.',
  aliases: ['трейтор_рейтинг'],
  async execute(message) {
    message.delete();
    const config = await database.getConfigByGuildID(message.guild.id);
    const ratingChannel = message.guild.channels.cache.get(config.rating_commands_chat_id);
    const bot = message.guild.members.cache.get('756933858288599041');

    const profileStr = '`!profile` - Посмотреть свою статистику игр.';
    const gameStr = `${'`!game`'} - Начать рейтинговую игру. Работает в специальном чате для рейтинговых игр ${ratingChannel.toString()}. Игрок должен находится в голосовом канале для рейтинговых игр. Начать игру должен только **ОДИН** игрок в лобби.\n`;
    const resultStr = 'Подвести результат игры (Команду вводит игрок который начал рейтинговую игру):\n`!win @Трейтор @Трейтор` - Победа предателей\n`!lose @Трейтор @Трейтор` - Победа членов экипажа\n';
    const cancelStr = '`!cancel` - Отменить начатую рейтинговую игру.';
    const embed = {
      color: 3092790,
      title: 'AmongUs бот',
      description: 'Система рейтинговых игр',
      author: {
        name: bot.user.username,
        icon_url: bot.user.displayAvatarURL(),
      },
      fields: [
        {
          name: '\u200B',
          value: '> **Рейтинговые игры**',
        },
        {
          name: '\u200B',
          value: profileStr,
        },
        {
          name: '\u200B',
          value: gameStr,
        },
        {
          name: '\u200B',
          value: resultStr,
        },
        {
          name: '\u200B',
          value: cancelStr,
        },
      ],
      timestamp: new Date(),
      footer: {
        text: 'AmongUs Rating Bot',
      },
    };

    message.channel.send({ embed });
  },
};

export default traitor;
