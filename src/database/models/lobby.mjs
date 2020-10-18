import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
  lobby_id: {
    type: Number,
    required: true,
    unique: true,
  },
  voice_id: {
    type: String,
    required: true,
  },
  chat_id: {
    type: String,
    required: true,
  },
  role_id: {
    type: String,
    required: true,
  },
  show: {
    type: Boolean,
    required: true,
    default: false,
  },
  type: {
    type: String,
    required: true,
  },
  users: {
    type: [String],
    default: [],
  },
});

export default mongoose.model('Lobby', lobbySchema);
