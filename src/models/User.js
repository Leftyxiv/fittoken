const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  discordId: {
    type: String,
    required: true
  },
  lastActivity: {
    type: Date,
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;