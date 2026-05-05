const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: String,
  file: String,
  teacher: String
});

module.exports = mongoose.model("Note", noteSchema);