import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  player_id: {
    type: String,
    required: true,
  },
  guild_id: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
  game_played: {
    type: Number,
    required: true,
    default: 0,
  },
  game_win: {
    type: Number,
    required: true,
    default: 0,
  },
  game_traitor: {
    type: Number,
    required: true,
    default: 0,
  },
  game_win_traitor: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

export default mongoose.model('Player', playerSchema);
