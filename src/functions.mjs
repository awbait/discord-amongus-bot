import dotenv from 'dotenv';
import * as database from './database/main.mjs';
import logger from './logger.mjs';

dotenv.config();
/**
 * Получить кол-во голосовых игровых комнат
 */
export function getVoiceChannels(guild) {
  const voiceChannels = guild.channels.cache.filter((ch) => ch.type === 'voice' && ch.parentID === process.env.DISCORD_CATEGORY_VOICE_ID);
  return voiceChannels.size;
}
/**
 * Поиск канала по ID
 * @param  {} guild
 * @param  {} channelId
 */
export function searchChannelByID(guild, channelId) {
  const channel = guild.channels.cache.get(channelId);

  return channel;
}

/**
 * Поиск канала по имени, типу и родителю
 * @param  {} guild
 * @param  {} name
 * @param  {} type
 * @param  {} parentID
 */
export function searchChannelByName(guild, name, type, parentID) {
  const channel = guild.channels.cache.find(
    (ch) => ch.name === name && ch.type === type && ch.parentID === parentID,
  );

  return channel;
}

/**
 * Получить или создать канал поиска игры

export async function getSearchRoom(guild) {
  let channel = searchChannelByName(guild, process.env.DISCORD_SEARCH_GAME_CHANNEL,
    'voice', process.env.DISCORD_CATEGORY_VOICE_ID);

  if (channel) {
    // Комната поиска игры найдена
    return channel.id;
  }
  // Комната поиска игры не найдена, создаём
  channel = await guild.channels.create(process.env.DISCORD_SEARCH_GAME_CHANNEL,
    {
      type: 'voice',
      parent: process.env.DISCORD_CATEGORY_VOICE_ID,
      permissionOverwrites: [
        {
          id: process.env.DISCORD_AUTH_ROLE,
          allow: ['CONNECT', 'VIEW_CHANNEL'],
          deny: ['SPEAK'],
        },
        {
          id: guild.roles.everyone.id,
          deny: ['VIEW_CHANNEL'],
        },
      ],
    });
  return channel.id;
}
 */

/**
 * Получить кол-во игроков в голосовых комнатах
 */
export async function getPlayerInVoiceChannels(guild) {
  const lobbys = await database.getLobbysByType('public');
  let userCount = 0;
  for (let i = 0; i < lobbys.length; i++) {
    const lobby = lobbys[i];
    if (lobby) {
      const voiceChannel = searchChannelByID(guild, lobby.voice_id);
      if (parseInt(voiceChannel?.members.size, 10)) {
        userCount += voiceChannel?.members.size;
      }
    }
  }
  return userCount;
}

/**
 * Установить позицию канала
 * @param  {} channel
 * @param  {} position
 */
export async function setChannelPosition(channel, position) {
  await channel.setPosition(position)
    .then((ch) => {
      logger.trace(`INIT_S:: setChannelPosition: Channel ${channel.id} new position is ${ch.position}!`);
    })
    .catch((error) => {
      logger.error(`INIT_S:: setChannelPosition: ${error}!`);
    });
}

export async function fixChannelPosition(guild) {
  const lobbys = await database.getLobbysByType('public');
  lobbys.sort((a, b) => parseInt(a.lobby_id, 10) - parseInt(b.lobby_id, 10));
  let checkPosition = 0;

  for (let i = 0; i < lobbys.length; i++) {
    const lobby = lobbys[i];
    if (lobby) {
      const channel = searchChannelByID(guild, lobby.voice_id);
      if (channel) {
        // eslint-disable-next-line no-await-in-loop
        await setChannelPosition(channel, checkPosition);
        logger.info(`INIT_S:: fixChannelPosition: Channel ${lobby.lobby_id} new position is ${checkPosition}!`);
        checkPosition += 1;
      }
    }
  }
}

function findMissingNumbers(arr) {
  if (arr.length !== 0) {
    const min = 1;
    const max = Math.max(...arr);
    const all = Array.from(Array(max - min + 1), (e, i) => i + min);
    return all.filter((e) => !arr.includes(e));
  }
  return [1];
}

export async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Создать новую игровую комнату
 */
export async function createNewLobby(guild, type, lobbyID) {
  /* Create game room role */
  const createdLobbyRole = await guild.roles.create({
    data: {
      name: `${process.env.DISCORD_TEMP_ROLE}${lobbyID}`,
    },
  });

  /* Создаём текстовый канал */
  const createdLobbyChat = await guild.channels.create(`${process.env.DISCORD_TEXT_CHANNEL}${lobbyID}`,
    {
      type: 'text',
      parent: process.env.DISCORD_CATEGORY_TEXT_ID,
      position: lobbyID,
      permissionOverwrites: [
        {
          id: createdLobbyRole.id,
          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
        },
        {
          id: guild.roles.everyone.id,
          deny: ['VIEW_CHANNEL'],
        },
      ],
    });
  /* Создаём голосовой канал */
  const createdLobbyVoice = await guild.channels.create(`${process.env.DISCORD_VOICE_CHANNEL}${lobbyID}`,
    {
      type: 'voice',
      parent: process.env.DISCORD_CATEGORY_VOICE_ID,
      userLimit: process.env.DISCORD_CHANNEL_USER_COUNT,
      position: lobbyID,
      permissionOverwrites: [
        {
          id: process.env.DISCORD_EJECTED_ROLE,
          deny: ['CONNECT'],
        },
        {
          id: guild.roles.everyone.id,
          deny: ['VIEW_CHANNEL'],
        },
      ],
    });

  const lobby = await database.createLobby(lobbyID,
    createdLobbyVoice.id,
    createdLobbyChat.id,
    createdLobbyRole.id,
    type);

  return lobby;
}

export async function setupLobbies(guild) {
  // eslint-disable-next-line no-await-in-loop
  await createNewLobby(guild, 'public', 50);
}

export const sklonenie = (number, txt, cases = [2, 0, 1, 1, 1, 2]) => txt[
  (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];

export async function setActivityStatistic(client, guild) {
  const lobbys = await database.getLobbysByTypeShow('public', true);
  const gameCount = lobbys.length;
  const playerCount = await getPlayerInVoiceChannels(guild);

  const game = sklonenie(gameCount, ['игру', 'игры', 'игр']);
  const player = sklonenie(playerCount, ['игрок', 'игрока', 'игроков']);
  client.user.setActivity(`${gameCount} ${game} | ${playerCount} ${player}`, { type: 'WATCHING' });

  const memberCountChannel = guild.channels.cache.get(process.env.DISCORD_MEMBERS_COUNT_CHANNEL);
  const { memberCount } = guild;
  memberCountChannel.setName(`Участников: ${memberCount}`);
}

/**
 * Переместить пользователя в голосовой канал
 * @param  {} state
 * @param  {} voiceChannelId
 */
export function setVoiceChannel(state, voiceChannelId) {
  setTimeout(() => {
    state.setChannel(voiceChannelId);
  }, 2000);
}

/**
 * Поиск свободной комнаты, когда пользователь подключился к каналу поиска игры
 * @param  {object} oldState
 * @param  {object} newState
 */
async function userConnectToSearchChannel(newState) {
  const lobbys = await database.getLobbysByTypeShow('public', true);
  lobbys.sort((a, b) => parseInt(a.lobby_id, 10) - parseInt(b.lobby_id, 10));

  const lobbysMember = new Map();
  for (let i = 0; i < lobbys.length; i++) {
    const lobby = lobbys[i];
    const voiceChannel = newState.guild.channels.cache.find((ch) => ch.id === lobby.voice_id && ch.type === 'voice');
    if (voiceChannel.members.size < 10) {
      lobbysMember.set(lobby.voice_id, voiceChannel.members.size);
    }
  }
  const foundLobbyID = [...lobbysMember.entries()].reduce((a, e) => (e[1] > a[1] ? e : a))[0];
  const lobby = await database.getLobbyByVoiceId(foundLobbyID);
  setVoiceChannel(newState, lobby.voice_id);
  newState.member.roles.add(lobby.role_id);
}

export function sendConnectMessage(guild, lobby, userId) {
  const channel = searchChannelByID(guild, lobby.chat_id);
  channel.send(`Игрок <@${userId}> присоединился к каналу.`);
}

export function updatePermissionsTextChat(state, lobby) {
  const textChannel = state.guild.channels.cache.get(lobby.chat_id);

  const permissions = [
    {
      id: state.guild.roles.everyone.id,
      deny: ['VIEW_CHANNEL'],
    },
  ];
  const users = lobby.users || [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const obj = {
      id: user,
      allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
    };
    permissions.push(obj);
  }
  textChannel.overwritePermissions(permissions);
}

/**
 * Обработка голосовых состояний пользователей
 * @param  {} oldState
 * @param  {} newState
 */
export async function handleVoiceState(oldState, newState) {
  const oldVoice = oldState.channelID;
  const newVoice = newState.channelID;

  const oldLobby = await database.getLobbyByVoiceId(oldVoice);
  const newLobby = await database.getLobbyByVoiceId(newVoice);

  if (oldVoice == null) {
    if (newVoice === process.env.DISCORD_SEARCH_GAME_CHANNEL_ID) {
      logger.info(`SEARCH_CHANNEL:: ${newState.member.user.tag} connected!`);
      userConnectToSearchChannel(newState);
    } else if (newLobby?.voice_id === newVoice) {
      // Подключились сразу к лобби
      logger.info(`CHANNEL_${newLobby.lobby_id}:: ${newState.member.user.tag} connected!`);

      const voiceUsers = newState.channel.members;
      const users = voiceUsers.map((member) => member.user.id);
      const updatedLobby = await database.updateLobby(newLobby.lobby_id, { users });
      updatePermissionsTextChat(newState, updatedLobby);
    }
  } else if (newVoice == null) {
    if (oldLobby?.voice_id === oldVoice) {
      logger.info(`CHANNEL_${oldLobby.lobby_id}:: ${oldState.member.user.tag} disconnected!`);

      const voiceUsers = oldState.channel.members;
      const users = voiceUsers.map((member) => member.user.id);
      const updatedLobby = await database.updateLobby(oldLobby.lobby_id, { users });
      updatePermissionsTextChat(oldState, updatedLobby);
    }
  } else {
    if (oldLobby?.voice_id === oldVoice) {
      logger.info(`CHANNEL_${oldLobby.lobby_id}:: ${oldState.member.user.tag} disconnected! 2`);

      const voiceUsers = oldState.channel.members;
      const users = voiceUsers.map((member) => member.user.id);
      const updatedLobby = await database.updateLobby(oldLobby.lobby_id, { users });
      updatePermissionsTextChat(oldState, updatedLobby);
    }
    if (newLobby?.voice_id === newVoice) {
      logger.info(`CHANNEL_${newLobby.lobby_id}:: ${newState.member.user.tag} connected! 2`);

      const voiceUsers = newState.channel.members;
      const users = voiceUsers.map((member) => member.user.id);
      const updatedLobby = await database.updateLobby(newLobby.lobby_id, { users });
      updatePermissionsTextChat(newState, updatedLobby);
    } else if (newVoice === process.env.DISCORD_SEARCH_GAME_CHANNEL_ID) {
      logger.info(`SEARCH_CHANNEL:: ${newState.member.user.tag} connected!`);
      userConnectToSearchChannel(newState);
    }
  }
}

/**
 * Проверка каналов на заполненность
 */
export async function checkChannels(guild) {
  const showedLobbys = await database.getLobbysByTypeShow('public', true);
  const userCount = await getPlayerInVoiceChannels(guild);
  logger.info(`CHECK_CH:: Users in GC: ${userCount}!`);
  const perUser = userCount / (showedLobbys.length * process.env.DISCORD_CHANNEL_USER_COUNT);
  logger.info(perUser);
  if (perUser > 0.95 || showedLobbys.length === 0) {
    const lobbysArr = showedLobbys.map((a) => a.lobby_id);
    let lobbyID = Math.min(...findMissingNumbers(lobbysArr));
    logger.info(lobbyID);
    if (lobbyID === Infinity) {
      lobbyID = Math.max(...lobbysArr) + 1;
    }
    logger.info(lobbyID);
    const lobby = await database.getLobbyByLobbyId(lobbyID);
    const channel = guild.channels.cache.get(lobby.voice_id);
    channel.overwritePermissions([
      {
        id: process.env.DISCORD_EJECTED_ROLE,
        deny: ['CONNECT'],
      },
      {
        id: guild.roles.everyone.id,
        allow: ['VIEW_CHANNEL'],
      },
    ]);
    await database.updateLobby(lobby.lobby_id, { show: true });
  }
}

export async function checkDeleteLobbys(guild) {
  const lobbys = await database.getLobbysByType('public');
  let userCount = await getPlayerInVoiceChannels(guild);
  const perUser = userCount / (lobbys.length * process.env.DISCORD_CHANNEL_USER_COUNT);

  lobbys.sort((a, b) => parseInt(a.lobby_id, 10) - parseInt(b.lobby_id, 10));
  /* Удаление пустых каналов */
  // Custom Iterator
  let index = lobbys.length;
  const reversedIterator = {
    next() {
      // eslint-disable-next-line no-plusplus
      index--;
      return {
        done: index < 0,
        value: lobbys[index],
      };
    },
  };
  // eslint-disable-next-line func-names
  reversedIterator[Symbol.iterator] = function () {
    return this;
  };

  if (perUser < 0.80) {
    // eslint-disable-next-line no-restricted-syntax
    for (const lobby of reversedIterator) {
      // logger.info(`CHECK_CH:: Need Delete: ${lobby.lobby_id}!`);
      if (lobbys.length > 5) {
        const voiceChannel = guild.channels.cache.find((ch) => ch.id === lobby?.voice_id && ch.type === 'voice' && ch.parentID === process.env.DISCORD_CATEGORY_VOICE_ID);
        if (voiceChannel?.members.size < 1) {
          // Удаляем канал
          logger.info(`DELETE: ${lobby.lobby_id}!`);
          voiceChannel.delete();
          const textChannel = guild.channels.cache.find((ch) => ch.id === lobby?.chat_id && ch.type === 'text' && ch.parentID === process.env.DISCORD_CATEGORY_TEXT_ID);
          textChannel.delete();
          guild.roles.cache.find((role) => role.id === lobby.role_id).delete();
          // eslint-disable-next-line no-await-in-loop
          await database.deleteLobby(voiceChannel.id);
          userCount -= 10;

          // eslint-disable-next-line no-await-in-loop
          const lobbysS = await database.getLobbysByType('public');
          // eslint-disable-next-line no-await-in-loop
          const userCountT = await getPlayerInVoiceChannels(guild);
          const perUserS = userCountT / (lobbysS.length * process.env.DISCORD_CHANNEL_USER_COUNT);
          if (perUserS > 0.80) {
            break;
          }
        }
      }
    }
    fixChannelPosition(guild);
  }
}

export async function updateLeaderboard(guild) {
  const config = await database.getConfigByGuildID(guild.id);
  const channel = guild.channels.cache.get(config.rating_leaderboard_chat_id);

  if (config.rating_leaderboard_message_id !== '') {
    const message = await channel.messages.fetch(config.rating_leaderboard_message_id);

    if (message) {
      const leaders = await database.getLeaders(guild.id);
      const fields = [];
      for (let i = 0; i < leaders.length; i++) {
        const player = leaders[i];
        const member = guild.members.cache.get(player.player_id);
        if (member) {
          let name;
          if (i <= 2) {
            const medalEmoji = guild.emojis.cache.find((emoji) => emoji.name === `medal${i}`);
            name = `${medalEmoji.toString()} ${member.displayName}`;
          } else {
            name = `#${i + 1}. ${member.displayName}`;
          }
          const obj = {
            name,
            value: `**Игр:** ${player.game_played} **| Поинтов:** ${player.points}`,
          };
          fields.push(obj);
        }
      }
      const leadersEmoji = guild.emojis.cache.find((emoji) => emoji.name === 'leaders');
      const bot = guild.members.cache.get('756933858288599041');
      const exampleEmbed = {
        color: 3049170,
        title: `${leadersEmoji.toString()} Рейтинг сезона`,
        author: {
          name: `${bot.user.username}`,
          icon_url: `${bot.user.displayAvatarURL()}`,
        },
        fields,
        timestamp: new Date(),
        footer: {
          text: 'AmongUs Ratings',
        },
      };
      message.edit({ embed: exampleEmbed });
    }
  } else {
    const exampleEmbed = {
      color: 3049170,
      description: 'Leaderboard',
      timestamp: new Date(),
      footer: {
        text: 'AmongUs Ratings',
      },
    };
    const message = await channel.send({ embed: exampleEmbed });
    await database.updateConfig(guild.id, { rating_leaderboard_message_id: message.id });
  }
}
