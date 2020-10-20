import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const autoIncrement = mongooseSequence(mongoose);

const gameSchema = new mongoose.Schema({
  owner_id: {
    type: String,
    required: true,
  },
  guild_id: {
    type: String,
    required: true,
  },
  game_id: {
    type: Number,
    unique: true,
  },
  members: {
    type: [String],
    required: true,
    default: undefined,
  },
  traitors: {
    type: [String],
    default: undefined,
  },
  map: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'ingame',
  },
  result: {
    type: String,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

gameSchema.plugin(autoIncrement, { inc_field: 'game_id' });

export default mongoose.model('Game', gameSchema);
