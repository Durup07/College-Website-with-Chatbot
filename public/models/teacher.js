const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  subject: String
});

module.exports = mongoose.model('Teacher', teacherSchema);