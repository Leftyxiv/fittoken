const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['walk', 'run', 'hiit', 'weights', 'other']
  },
  time: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;