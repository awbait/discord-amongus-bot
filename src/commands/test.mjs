import * as database from '../database/main.mjs';

const test = {
  name: 'test',
  description: 'Игра проиграна. Победа предателей.',
  aliases: ['лидеры'],
  async execute(message) {
    const leaders = await database.getLeaders('754411317942681672');
    const fields = [];
    for (let i = 0; i < leaders.length; i++) {
      const player = leaders[i];
      const member = message.guild.members.cache.get(player.player_id);
      const obj = {
        name: `**#${i + 1} - ${member.nickname}`,
        value: `**Игр:** ${player.game_played} | **Поинтов:** ${player.points}`,
      };
      fields.push(obj);
    }
    const iseeyouEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'iseeyou');
    const exampleEmbed = {
      color: 3049170,
      description: `${iseeyouEmoji.toString()} **Рейтинг сезона**`,
      author: {
        name: `${message.author.username}`,
        icon_url: `${message.author.displayAvatarURL()}`,
      },
      fields,
      timestamp: new Date(),
      footer: {
        text: 'AmongUs Ratings',
      },
    };

    message.channel.send({ embed: exampleEmbed });
  },
};

export default test;
