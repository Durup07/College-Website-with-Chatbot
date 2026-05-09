require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ================= DATABASE =================
mongoose.connect("mongodb+srv://rupesh07:Rupesh%40123@cluster0.wlzse0q.mongodb.net/collegeERP?retryWrites=true&w=majority&appName=Cluster0")
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

// ================= ENSURE NOTES FOLDER =================
const notesDir = path.join(__dirname, "public/notes");

if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}

// ================= MODELS =================
const Result = mongoose.model("Result", {
  student: String,
  subject: String,
  marks: Number
});

const Note = mongoose.model("Note", {
  title: String,
  filename: String,
  uploadedBy: String,
  date: { type: Date, default: Date.now }
});

// ================= FILE UPLOAD =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/notes/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ================= USERS =================
let users = [

  // Teachers
  {
    username: "rahul",
    password: "1234",
    role: "teacher",
    name: "Rahul"
  },

  {
    username: "ajit",
    password: "1234",
    role: "teacher",
    name: "Ajit"
  },

  // Students
  {
    username: "student1",
    password: "1234",
    role: "student"
  },

  {
    username: "rohit",
    password: "1234",
    role: "student"
  }
];

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("🚀 ERP Server Running");
});

// ================= LOGIN =================
app.post("/login", (req, res) => {

  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.json({
      success: false,
      msg: "Invalid Login"
    });
  }

  res.json({
    success: true,
    role: user.role,
    username: user.username,
    name: user.name || user.username
  });

});

// ================= STUDENT REGISTER =================
app.post("/register", (req, res) => {

  const { username, password } = req.body;

  const exist = users.find(u => u.username === username);

  if (exist) {
    return res.json({
      success: false,
      msg: "Username already exists"
    });
  }

  users.push({
    username,
    password,
    role: "student"
  });

  res.json({
    success: true,
    msg: "Student Registered Successfully"
  });

});

// ================= ANNOUNCEMENTS =================
let announcements = [];

app.post("/announcement", (req, res) => {

  if (!req.body.text) {
    return res.json({ success: false });
  }

  announcements.push(req.body.text);

  res.json({ success: true });

});

app.get("/announcement", (req, res) => {
  res.json(announcements);
});

// ================= ADD MARKS =================
app.post("/marks", async (req, res) => {

  try {

    const { student, subject, marks } = req.body;

    if (!student || !subject || !marks) {

      return res.json({
        success: false,
        msg: "Missing Data"
      });

    }

    await new Result({
      student,
      subject,
      marks
    }).save();

    res.json({
      success: true,
      msg: "Marks Added"
    });

  } catch (err) {

    console.log(err);

    res.json({
      success: false
    });

  }

});

// ================= GET STUDENT MARKS =================
app.get("/marks/:student", async (req, res) => {

  try {

    const data = await Result.find({
      student: req.params.student
    });

    res.json(data);

  } catch (err) {

    res.json([]);

  }

});

// ================= UPLOAD NOTES =================
app.post("/upload-note", upload.single("file"), async (req, res) => {

  try {

    if (!req.file) {
      return res.json({ success: false });
    }

    await new Note({
      title: req.body.title || "Untitled",
      filename: req.file.filename,
      uploadedBy: "teacher"
    }).save();

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.json({
      success: false
    });

  }

});

// ================= GET NOTES =================
app.get("/notes", async (req, res) => {

  try {

    const notes = await Note.find();

    res.json(notes);

  } catch (err) {

    res.json([]);

  }

});

// ================= DELETE NOTE =================
app.delete("/delete-note/:id", async (req, res) => {

  await Note.findByIdAndDelete(req.params.id);

  res.json({
    success: true
  });

});

// ================= RESULT PAGE =================
app.get("/result/:student", async (req, res) => {

  const data = await Result.find({
    student: req.params.student
  });

  res.json({
    student: req.params.student,
    results: data
  });

});

// ================= EMAIL =================
app.post("/send", async (req, res) => {

  try {

    const { name, email, phone, course, address } = req.body;

    const transporter = nodemailer.createTransport({

      service: "gmail",

      auth: {
        user: "yourgmail@gmail.com",
        pass: "your_app_password"
      }

    });

    await transporter.sendMail({

      from: email,

      to: "yourgmail@gmail.com",

      subject: "New Admission Application",

      html: `
        <h2>New Admission</h2>

        <p>Name: ${name}</p>

        <p>Email: ${email}</p>

        <p>Phone: ${phone}</p>

        <p>Course: ${course}</p>

        <p>Address: ${address}</p>
      `
    });

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.json({
      success: false
    });

  }

});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 ERP running on port ${PORT}`);
});
require('dotenv').config();

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));
console.log("URI =", process.env.MONGO_URI);
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));