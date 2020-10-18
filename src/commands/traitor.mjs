import * as database from '../database/main.mjs';

const traitor = {
  name: 'traitor',
  description: 'Игра проиграна. Победа предателей.',
  aliases: ['трейтор'],
  async execute(message) {
    message.delete();
    const config = await database.getConfigByGuildID(message.guild.id);
    const ratingChannel = message.guild.channels.cache.get(config.rating_commands_chat_id);
    const searchChannel = message.guild.channels.cache.get(config.lobby_search_channel_id);
    const bot = message.guild.members.cache.get('756933858288599041');

    const profileStr = '`!profile` - Посмотреть свою статистику игр.';
    const gameStr = `${'`!game`'} - Начать рейтинговую игру. Работает в специальном чате для рейтинговых игр ${ratingChannel.toString()}. Игрок должен находится в голосовом канале для рейтинговых игр. Начать игру должен только **ОДИН** игрок в лобби.\n`;
    const resultStr = 'Подвести результат игры (Команду вводит игрок который начал рейтинговую игру):\n`!win @Трейтор @Трейтор` - Победа предателей\n`!lose @Трейтор @Трейтор` - Победа членов экипажа\n';
    const cancelStr = '`!cancel` - Отменить начатую рейтинговую игру.';
    const embed = {
      color: 3092790,
      title: 'AmongUs бот',
      description: 'Создан, чтобы упростить вам игру. Что он умеет?',
      author: {
        name: bot.user.username,
        icon_url: bot.user.displayAvatarURL(),
      },
      fields: [
        {
          name: '\u200B',
          value: '> **Поиск уже созданной игры**\nЗайдите в голосовой канал «Поиск игры»‎.\nБот сам переместит вас в игру, где максимальное колличество игроков.',
        },
        {
          name: '\u200B',
          value: '> **Создание новой игры**\nЗайдите в голосовой канал «Создать игру»‎.\n Чтобы бот вам создал пустую голосовую комнату и переместил вас туда.',
        },
        {
          name: '\u200B',
          value: '> **Список команд**',
        },
        {
          name: '\u200B',
          value: `${'`!invite CODE`'} - Пригласить игроков в ваш голосовой канал! Доступна только в текстовом канале ${searchChannel.toString()}`,
        },
        {
          name: '\u200B',
          value: '`!kick @Игрок` - Исключить игрока из голосового канала голосованием. Для результата требуется 60% голосов от количества игроков в голосовом канале. Команда доступна только в текстовом приватном чате голосового канала.',
        },
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
