const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema({
  student: String,
  subject: String,
  marks: Number
});

module.exports = mongoose.model("Result", ResultSchema);