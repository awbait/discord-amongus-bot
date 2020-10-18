import * as database from '../database/main.mjs';

const profile = {
  name: 'profile',
  description: 'Просмотр профиля',
  aliases: ['профиль'],
  async execute(message, args) {
    const config = await database.getConfigByGuildID(message.guild.id);
    if (message.channel.id === config.rating_commands_chat_id) {
      const member = message.mentions.members.first()
        || message.guild.members.cache.get(args[0]) || message.member;

      let player = await database.getPlayerByID(member.id);
      if (!player) {
        player = await database.createPlayer(message.author.id, message.guild.id);
      }

      const winPercent = (player.game_win * 100) / player.game_played || 0;
      const exampleEmbed = {
        color: 3049170,
        title: '**Статистика игрока**',
        author: {
          name: `${member.displayName}`,
          icon_url: `${member.user.displayAvatarURL()}`,
        },
        thumbnail: {
          url: member.user.displayAvatarURL(),
        },
        fields: [
          {
            name: 'Игр',
            value: `${player.game_played}`,
            inline: true,
          },
          {
            name: 'Побед',
            value: `${Math.round(winPercent)}%`,
            inline: true,
          },
          {
            name: 'Трейтор',
            value: `${player.game_traitor} раз`,
            inline: true,
          },
          {
            name: 'Поинтов',
            value: `${player.points}`,
            inline: true,
          },
        ],
        timestamp: new Date(),
        footer: {
          text: 'AmongUs Ratings',
        },
      };
      message.channel.send({ embed: exampleEmbed });
    }
  },
};

export default profile;
