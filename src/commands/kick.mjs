const kick = {
  name: 'kick',
  description: 'Kick player',
  execute(message) {
    if (message.channel.parentID === process.env.DISCORD_CATEGORY_TEXT_ID) {
      const user = message.mentions.members.first();

      if (user && user.voice.channelID === message.member.voice.channelID) {
        let yes = -1;
        let no = -1;

        message.channel.send(`Начато голосование за исключение <@${user.id}>!`)
          .then((msg) => {
            msg.react('✅').then(() => msg.react('❌'));
            const filter = (reaction) => ['✅', '❌'].includes(reaction.emoji.name);
            const collector = msg.createReactionCollector(filter, { time: 60000 });

            collector.on('collect', (reaction) => {
              if (reaction.emoji.name === '✅') {
                yes += 1;
              } else if (reaction.emoji.name === '❌') {
                no += 1;
              }
            });
            collector.on('end', () => {
              const members = message.member?.voice.channel?.members.size
                ? user?.voice.channel?.members.size : null;

              const ejectedRole = message.member.guild.roles.cache.get(
                process.env.DISCORD_EJECTED_ROLE,
              );
              const ejectedChannel = message.guild.channels.cache.get(
                process.env.DISCORD_EJECTED_CHAT,
              );
              if (members) {
                const percentYes = (yes * 100) / members;
                const percentNo = (no * 100) / members;
                if (percentYes >= 60) {
                  // Kick player
                  message.channel.send(`<@${user.id}> Был выброшен в космос!`);
                  const channelName = user.voice.channel.name;
                  user.roles.add(ejectedRole.id);
                  ejectedChannel.send(`<@${user.id}> Вы были были выброшены в космос со станции «${channelName}». И были парализованы на 30 минут!`);
                  user.voice.kick('Вы были исключены из голосового канала. Вы сможете продолжить играть через 5 минут!');
                  setTimeout(() => user.roles.remove(ejectedRole.id), 1800000);
                } else if (percentNo >= 60) {
                  // Stayout player
                  message.channel.send(`Игроки решили оставить <@${user.id}>!`);
                } else {
                  // Не решили
                  message.channel.send('Игроки не смогли прийти к соглашению.');
                }
              }
            });
          });
      } else {
        message.reply('Пользователь не указан!');
      }
    }
  },
};

export default kick;
