const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/attandanceApp');

// Workers Collection
const WorkerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rfid: {
    type: String,
    required: true
  },
  attandanceTimestamps: [String]
});

// Managers Collection
const ManagersSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date

});

// my models
const Manager = mongoose.model('Manager', ManagersSchema);
const Worker = mongoose.model('Worker', WorkerSchema);


module.exports = {
  Worker,
  Manager
};