const invite = {
  name: 'invite',
  description: 'Пригласить игроков в игровой голосовой канал',
  aliases: ['инвайт', 'штмшеу', 'bydfqn'],
  execute(message, args) {
    message.delete();
    if (message.channel.id === '756492934538330112') {
      const voiceChannel = message.member.voice.channel;
      if (voiceChannel) {
        voiceChannel.createInvite({
          unique: true,
          maxAge: 600,
        }).then((inv) => {
          const slots = process.env.DISCORD_CHANNEL_USER_COUNT - voiceChannel.members.size;

          const exampleEmbed = {
            color: Math.floor(Math.random() * 16777214) + 1,
            url: `https://discord.gg/${inv.code}`,
            author: {
              name: `${message.author.username} Приглашает в игру!`,
              icon_url: `${message.author.displayAvatarURL()}`,
            },
            description: `[**Нажмите тут, чтобы присоединиться!**](https://discord.gg/${inv.code})`,
            thumbnail: {
              url: 'https://i.imgur.com/gI1OFsK.png',
            },
            fields: [
              {
                name: '\u200b',
                value: 'Присоединитесь к голосовому каналу и введите\n `!invite [код к игре]`, чтобы пригласить игроков в свою игру.',
              },
              {
                name: 'Канал',
                value: `${voiceChannel.name}`,
                inline: true,
              },
              {
                name: 'Свободных Мест',
                value: `${slots}/10`,
                inline: true,
              },
            ],
            timestamp: new Date(),
            footer: {
              text: 'Опубликуйте своё приглашение здесь. Просто введите !invite',
            },
          };

          if (args[0]) {
            if (/^[a-zA-Z0-9]{6}$/.test(args[0])) {
              const code = args[0].toUpperCase();
              const obj = {
                name: 'Код к игре',
                value: code,
                inline: true,
              };
              exampleEmbed.fields.push(obj);
            }
          }

          message.channel.send({ embed: exampleEmbed });
        });
      } else {
        message.reply('Вы должны находиться в голосовом канале!');
      }
    }
  },
};

export default invite;
