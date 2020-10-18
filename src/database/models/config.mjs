import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  guild_id: {
    type: String,
    required: true,
  },
  prefix: {
    type: String,
  },
  lobby_search_channel_id: {
    type: String,
  },
  private_chat_category_id: {
    type: String,
  },
  rating_voice_category_id: {
    type: String,
  },
  rating_commands_chat_id: {
    type: String,
  },
  rating_leaderboard_chat_id: {
    type: String,
  },
  rating_leaderboard_message_id: {
    type: String,
  },
  admins: {
    type: [String],
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

export default mongoose.model('Config', configSchema);
