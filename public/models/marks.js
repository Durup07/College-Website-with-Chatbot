const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentEmail: String,
  subject: String,
  marks: Number,
  teacherName: String
});

module.exports = mongoose.model('Marks', marksSchema);