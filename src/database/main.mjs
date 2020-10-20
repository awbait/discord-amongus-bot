/* eslint-disable consistent-return */
import mongoose from 'mongoose';
import Lobby from './models/lobby.mjs';
import Player from './models/player.mjs';
import Game from './models/game.mjs';
import Config from './models/config.mjs';
import logger from '../logger.mjs';

export function init() {
  mongoose.connect('mongodb://among:0K7Un1co@51.75.64.58:27017/among1', {
    useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true,
  }, ((error) => {
    if (error) logger.error(error);
  }));

  const db = mongoose.connection;

  db.once('open', async () => {
    logger.info('DATABASE:: Connected');
  });

  db.on('error', (error) => {
    logger.error('error', error);
  });
}

export const createLobby = async (lobbyID, voiceID, chatID, roleID, type) => {
  try {
    const lobby = new Lobby({
      lobby_id: lobbyID,
      voice_id: voiceID,
      chat_id: chatID,
      role_id: roleID,
      show: false,
      type,
    });
    const lobbyResult = await lobby.save();
    logger.info(`REQUEST: createLobby:: ${lobbyResult}`);
    return lobbyResult;
  } catch (error) {
    logger.error(`REQUEST: createLobby:: ${error}`);
  }
};

export const getLobbysByType = async (type) => {
  try {
    const lobby = await Lobby.find({ type }).exec();
    // logger.info(`REQUEST:: getLobbysByType: ${lobby}`);
    return lobby;
  } catch (error) {
    logger.error(`REQUEST: getLobbysByType:: ${error}`);
  }
};

export const getLobbysByTypeShow = async (type, show) => {
  try {
    const lobby = await Lobby.find({ type, show }).exec();
    // logger.info(`REQUEST:: getLobbysByType: ${lobby}`);
    return lobby;
  } catch (error) {
    logger.error(`REQUEST: getLobbysByType:: ${error}`);
  }
};

export const getLobbyByLobbyId = async (lobbyID) => {
  try {
    const lobby = await Lobby.findOne({ lobby_id: lobbyID });
    return lobby;
  } catch (error) {
    logger.error(`REQUEST: getLobbysByType:: ${error}`);
  }
};

export const deleteLobby = async (voiceID) => {
  try {
    const lobby = await Lobby.deleteOne({ voice_id: voiceID });
    return lobby;
  } catch (error) {
    logger.error(`REQUEST: getLobbysByType:: ${error}`);
  }
};

export const getLobbyByVoiceId = async (voiceID) => {
  try {
    const lobby = await Lobby.findOne({ voice_id: voiceID });
    return lobby;
  } catch (error) {
    logger.error(`REQUEST: getLobbysByType:: ${error}`);
  }
};

export const updateLobby = async (lobbyID, data) => {
  try {
    const lobby = await Lobby.findOneAndUpdate({ lobby_id: lobbyID }, data, { new: true });
    return lobby;
  } catch (error) {
    logger.error(`REQUEST: updateLobby:: ${error}`);
  }
};

/* */

export const getPlayerByID = async (playerID) => {
  try {
    const lobby = await Player.findOne({ player_id: playerID });
    return lobby;
  } catch (error) {
    logger.error(`REQUEST: getPlayerbyID:: ${error}`);
  }
};

export const createPlayer = async (playerID, guildID, points, gamePlayed, gameWin, gameTraitor) => {
  try {
    const player = await Player.create({
      player_id: playerID,
      guild_id: guildID,
      points: points || 0,
      game_played: gamePlayed || 0,
      game_win: gameWin || 0,
      game_traitor: gameTraitor || 0,
    });
    return player;
  } catch (error) {
    logger.error(`REQUEST: createPlayer:: ${error}`);
  }
};

export const checkPlayerInGame = async (playerID) => {
  try {
    const player = await Game.findOne({ members: playerID, status: 'ingame' });
    return !!player;
  } catch (error) {
    logger.error(`REQUEST: checkPlayerInGame:: ${error}`);
  }
};

export const findActiveGameByOwnerId = async (ownerID) => {
  try {
    const game = await Game.findOne({ owner_id: ownerID, status: 'ingame' });
    return game;
  } catch (error) {
    logger.error(`REQUEST: findActiveGameByOwnerId:: ${error}`);
  }
};

export const findActiveGameByGameId = async (gameID) => {
  try {
    const game = await Game.findOne({ game_id: gameID, status: 'ingame' });
    return game;
  } catch (error) {
    logger.error(`REQUEST: findActiveGameByGameId:: ${error}`);
  }
};

export const createGame = async (ownerID, guildID, members, map) => {
  try {
    const game = await Game.create({
      owner_id: ownerID,
      guild_id: guildID,
      completed: false,
      members,
      map,
    });
    return game;
  } catch (error) {
    logger.error(`REQUEST: createGame:: ${error}`);
  }
};

export const getConfigByGuildID = async (guildID) => {
  try {
    const config = await Config.findOne({ guild_id: guildID });
    return config;
  } catch (error) {
    logger.error(`REQUEST: getKeyValueByGuildID:: ${error}`);
  }
};

export const updatePlayerProfile = async (playerID, data) => {
  try {
    const player = await Player.findOneAndUpdate({ player_id: playerID }, data, { upsert: true });
    return player;
  } catch (error) {
    logger.error(`REQUEST: updatePlayerProfile:: ${error}`);
  }
};

export const updateGame = async (gameID, data) => {
  try {
    const game = await Game.findOneAndUpdate({ game_id: gameID }, data);
    return game;
  } catch (error) {
    logger.error(`REQUEST: updateGame:: ${error}`);
  }
};

export const createConfig = async (guildID) => {
  try {
    const config = await Config.create({
      guild_id: guildID,
    });
    return config;
  } catch (error) {
    logger.error(`REQUEST: createConfig:: ${error}`);
  }
};

export const getLeaders = async (guildID) => {
  try {
    const players = await Player.find({ guild_id: guildID }).sort({ points: -1 }).limit(10);
    return players;
  } catch (error) {
    logger.error(`REQUEST: getLeaders:: ${error}`);
  }
};

export const updateConfig = async (guildID, data) => {
  try {
    const config = await Config.findOneAndUpdate({ guild_id: guildID }, data);
    return config;
  } catch (error) {
    logger.error(`REQUEST: updateConfig:: ${error}`);
  }
};
