/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
import * as database from '../database/main.mjs';

export async function chargeImposterPoints(player, status) {
  let {
    points, game_played, game_win, game_traitor, game_win_traitor,
  } = player;
  let check = '';

  if (status === 'win') {
    points += 20;
    game_played += 1;
    game_win += 1;
    game_traitor += 1;
    game_win_traitor = +1;
    const updateObject = {
      points,
      game_played,
      game_win,
      game_traitor,
      game_win_traitor,
    };
    await database.updatePlayerProfile(player.player_id, updateObject);
    check = `${points} (+${20})\n`;
  } else {
    points -= 4;
    game_played += 1;
    game_traitor += 1;
    const updateObject = {
      points,
      game_played,
      game_traitor,
    };
    await database.updatePlayerProfile(player.player_id, updateObject);
    check = `${points} (-${4})\n`;
  }
  return check;
}

export async function chargeCrewmatePoints(player, status) {
  let {
    points, game_played, game_win,
  } = player;
  let check = '';

  if (status === 'win') {
    points += 10;
    game_played += 1;
    game_win += 1;
    const updateObject = {
      points,
      game_played,
      game_win,
    };
    await database.updatePlayerProfile(player.player_id, updateObject);
    check = `${points} (+${10})\n`;
  } else {
    points -= 8;
    game_played += 1;
    const updateObject = {
      points,
      game_played,
    };
    await database.updatePlayerProfile(player.player_id, updateObject);
    check = `${points} (-${8})\n`;
  }
  return check;
}

export async function checkChargePoints(game, traitorArr, crewmates, imposters) {
  let impostersList = '';
  let impostersPoints = '';
  let crewmatesList = '';
  let crewmatesPoints = '';

  for (let i = 0; i < game.members.length; i++) {
    const memberID = game.members[i];
    let player = await database.getPlayerByID(memberID);

    if (!player) {
      player = await database.createPlayer(memberID, game.guild_id);
    }
    if (traitorArr.some((e) => e === memberID)) {
      // Начисляем трейтору очки
      const stat = await chargeImposterPoints(player, imposters);
      impostersList += `<@${memberID}>\n`;
      impostersPoints += stat;
    } else {
      // Начисляем члену экипажа очки
      const stat = await chargeCrewmatePoints(player, crewmates);
      crewmatesList += `<@${memberID}>\n`;
      crewmatesPoints += stat;
    }
  }
  return {
    impostersList, impostersPoints, crewmatesList, crewmatesPoints,
  };
}

export async function generateEmbedGameResult(message, game, objectResult, crewmates) {
  const crewmatesEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Tcrewmates');
  const impostersEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Timposters');
  const playEmoji = message.guild.emojis.cache.find((emoji) => emoji.name === 'Tplay');
  let winnerName = '';

  if (crewmates === 'win') {
    winnerName = '*Экипаж победил***';
  } else {
    winnerName = '*Импостеры победили***';
  }

  const exampleEmbed = {
    color: 3049170,
    description: `${playEmoji.toString()} **Матч #${game.game_id} завершен | ${winnerName}`,
    author: {
      name: `${message.author.username}`,
      icon_url: `${message.author.displayAvatarURL()}`,
    },
    fields: [
      {
        name: `${impostersEmoji.toString()} Imposters`,
        value: `${objectResult.impostersList}`,
        inline: true,
      },
      {
        name: 'Поинтов',
        value: `${objectResult.impostersPoints}`,
        inline: true,
      },
      {
        name: '\u200B',
        value: '\u200B',
        inline: true,
      },
      {
        name: `${crewmatesEmoji.toString()} Crewmates`,
        value: `${objectResult.crewmatesList}`,
        inline: true,
      },
      {
        name: '\u200B',
        value: `${objectResult.crewmatesPoints}`,
        inline: true,
      },
      {
        name: '\u200B',
        value: '\u200B',
        inline: true,
      },
    ],
    timestamp: new Date(),
    footer: {
      text: 'AmongUs Ratings',
    },
  };

  return exampleEmbed;
}
