document.addEventListener("DOMContentLoaded", () => {
  

  // ================= LOGIN =================
  app.post("/login", async (req,res)=>{
  const {username,password} = req.body;

  const user = await User.findOne({username});
  if(!user) return res.json({success:false,msg:"User not found"});

  const ok = await bcrypt.compare(password,user.password);
  if(!ok) return res.json({success:false,msg:"Wrong password"});

  const token = jwt.sign(
    {name:user.name,role:user.role,username:user.username},
    "secret123"
  );

  res.json({
    success:true,
    token,
    role:user.role,
    name:user.name
  });
});

  // ================= ADD MARKS =================
  window.addMarks = async function(){

    const student = document.getElementById("student")?.value;
    const subject = document.getElementById("subject")?.value;
    const marks = document.getElementById("marks")?.value;

    if(!student || !subject || !marks){
      alert("Fill all fields");
      return;
    }

    try {
      await fetch("http://localhost:3000/marks", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ student, subject, marks })
      });

      alert("Marks Added");

    } catch(err){
      alert("Error saving marks");
    }
  };

  // ================= UPLOAD NOTES =================
  let uploadForm = document.getElementById("uploadForm");

  if(uploadForm){
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      let formData = new FormData(uploadForm);

      try {
        await fetch("http://localhost:3000/upload-note", {
          method: "POST",
          body: formData
        });

        alert("Note Uploaded");

      } catch(err){
        alert("Upload failed");
      }
    });
  }

  // ================= LOAD MARKS =================
  async function loadMarks(){
    let box = document.getElementById("marks");
    if(!box) return;

    let student = localStorage.getItem("user");

    try {
      let res = await fetch(`http://localhost:3000/marks/${student}`);
      let data = await res.json();

      box.innerHTML = data.map(m =>
        `<p><b>${m.subject}</b> : ${m.marks}</p>`
      ).join("") || "No marks found";

    } catch(err){
      box.innerHTML = "Error loading marks";
    }
  }

  // ================= LOAD NOTES =================
  async function loadNotes(){
    let box = document.getElementById("notes");
    if(!box) return;

    try {
      let res = await fetch("http://localhost:3000/notes");
      let data = await res.json();

      box.innerHTML = data.map(n =>
        `<p>📄 <a href="notes/${n.filename}" target="_blank">${n.title}</a></p>`
      ).join("") || "No notes available";

    } catch(err){
      box.innerHTML = "Error loading notes";
    }
  }

  // ================= AUTO LOAD =================
  if(document.getElementById("marks")){
    loadMarks();
  }

  if(document.getElementById("notes")){
    loadNotes();
  }

});


// ================= POPUP LOGIN =================
function openLogin(){
  document.getElementById("loginPopup").style.display = "flex";
}

function closeLogin(){
  document.getElementById("loginPopup").style.display = "none";
}

async function popupLogin(){

  const username = document.getElementById("popupUsername").value;
  const password = document.getElementById("popupPassword").value;

  if(!username || !password){
    alert("Enter username & password");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if(!data.success){
      alert("Invalid Login");
      return;
    }

    localStorage.setItem("user", username);

    if(data.role === "teacher"){
      window.location.href = "teacher.html";
    } else {
      window.location.href = "student.html";
    }

  } catch(err){
    alert("Server not running");
  }
}


// ================= LOGOUT =================
function logout(){
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
app.post("/marks", async (req, res) => {
  const { student, subject, marks } = req.body;
  await new Result({ student, subject, marks }).save();
  res.json({ success: true });
});

app.get("/marks/:student", async (req, res) => {
  const data = await Result.find({ student: req.params.student });
  res.json(data);
});
async function uploadNote(e){
  e.preventDefault();

  const form = document.getElementById("uploadForm");
  const formData = new FormData(form);

  try {
    const res = await fetch("http://localhost:3000/upload-note", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if(data.success){
      alert("Note Uploaded Successfully");
      form.reset();
    } else {
      alert("Upload Failed");
    }

  } catch(err){
    alert("Server not running or error");
    console.log(err);
  }
}
const fs = require("fs");

// DELETE NOTE API
app.delete("/note/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) return res.json({ success: false });

    // delete file from folder
    fs.unlinkSync(`public/notes/${note.filename}`);

    // delete from database
    await Note.findByIdAndDelete(req.params.id);

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});
async function loadStudentResult(){

  let student = localStorage.getItem("user") || "student1";

  const res = await fetch("/result/" + student);
  const data = await res.json();

  let box = document.getElementById("resultCard");

  if(!box) return;

  let html = `
    <div class="pdf-card">
      <h3>📄 Result Card</h3>
      <p><b>Student:</b> ${data.student}</p>
      <hr>
  `;

  data.results.forEach(r => {
    html += `<p>${r.subject} : <b>${r.marks}</b></p>`;
  });

  html += `</div>`;

  box.innerHTML = html;
}

loadStudentResult();
function downloadResult(){
  window.print();
}
async function downloadPDF(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let student = localStorage.getItem("user") || "student1";

  const res = await fetch("/result/" + student);
  const data = await res.json();

  // TITLE
  doc.setFontSize(18);
  doc.text("Student Result Card", 20, 20);

  doc.setFontSize(12);
  doc.text("Student Name: " + data.student, 20, 35);

  let y = 50;

  doc.text("Subjects & Marks:", 20, y);
  y += 10;

  data.results.forEach((r, i) => {
    doc.text(`${i+1}. ${r.subject} : ${r.marks}`, 20, y);
    y += 10;
  });

  doc.save(`${data.student}_result.pdf`);
}
async function loadStudentResult(){

  let student = localStorage.getItem("user") || "student1";

  const res = await fetch("/result/" + student);
  const data = await res.json();

  let box = document.getElementById("resultCard");

  let html = `<h3>📄 Result Card</h3><p><b>${data.student}</b></p><ul>`;

  data.results.forEach(r => {
    html += `<li>${r.subject} - ${r.marks}</li>`;
  });

  html += "</ul>";

  box.innerHTML = html;
}

loadStudentResult();
async function downloadMarksheet(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let student = localStorage.getItem("user") || "student1";

  const res = await fetch("/result/" + student);
  const data = await res.json();

  // ================= HEADER =================
  doc.setFontSize(18);
  doc.text("DAV INSTITUTE OF ENGINEERING & TECHNOLOGY", 20, 20);

  doc.setFontSize(12);
  doc.text("OFFICIAL MARKSHEET", 85, 30);

  doc.line(20, 35, 190, 35);

  // ================= STUDENT INFO =================
  doc.text("Student Name: " + data.student, 20, 45);
  doc.text("Semester: 4th", 20, 55);
  doc.text("Course: B.Tech", 20, 65);

  doc.line(20, 70, 190, 70);

  // ================= TABLE HEADER =================
  doc.text("Subject", 25, 80);
  doc.text("Marks", 150, 80);

  doc.line(20, 85, 190, 85);

  // ================= MARKS =================
  let y = 95;
  let total = 0;

  data.results.forEach(r => {

    doc.text(r.subject, 25, y);
    doc.text(String(r.marks), 150, y);

    total += Number(r.marks);
    y += 10;
  });

  doc.line(20, y, 190, y);

  // ================= TOTAL =================
  y += 10;

  let percentage = (total / (data.results.length * 100)) * 100;

  doc.text("Total Marks: " + total, 25, y);
  doc.text("Percentage: " + percentage.toFixed(2) + "%", 25, y + 10);

  // ================= GRADE SYSTEM =================
  let grade = "F";

  if(percentage >= 90) grade = "A+";
  else if(percentage >= 75) grade = "A";
  else if(percentage >= 60) grade = "B";
  else if(percentage >= 40) grade = "C";

  doc.text("Grade: " + grade, 25, y + 20);

  // ================= SIGNATURE =================
  doc.text("____________________", 140, y + 40);
  doc.text("Controller of Examinations", 140, y + 50);

  // ================= SAVE PDF =================
  doc.save(`${data.student}_marksheet.pdf`);
}
function getBase64Image(imgUrl, callback) {
  const img = new Image();
  img.setAttribute('crossOrigin', 'anonymous');

  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const dataURL = canvas.toDataURL("image/png");
    callback(dataURL);
  };

  img.src = imgUrl;
}
function openLogin(){
  document.getElementById("popup").style.display = "block";
}

function closeLogin(){
  document.getElementById("popup").style.display = "none";
}
// OPEN / CLOSE
function toggleChat(){
let box = document.getElementById("chatbot");
box.style.display = box.style.display === "flex" ? "none" : "flex";
}

// QUICK QUESTIONS
function quickQuestion(type){

let answers = {
admission: "Admission is open for 2026. Visit Admission page.",
fees: "Fees varies by course. Check prospectus.",
hostel: "Hostel available for boys & girls.",
placement: "92% placement with top companies."
};

addMessage("You", type);
addMessage("Bot", answers[type]);
}

// SEND MESSAGE
function sendMessage(){

let input = document.getElementById("userInput");
let msg = input.value.trim();

if(!msg) return;

addMessage("You", msg);

// simple AI reply
let reply = "Sorry, I don't understand.";

if(msg.toLowerCase().includes("admission")){
reply = "Admission is open now.";
}
else if(msg.toLowerCase().includes("fees")){
reply = "Check fees in brochure.";
}

addMessage("Bot", reply);

input.value="";
}

// ADD MESSAGE
function addMessage(sender,text){

let body = document.getElementById("chatBody");

body.innerHTML += `<p><b>${sender}:</b> ${text}</p>`;

body.scrollTop = body.scrollHeight;
}

// VOICE (basic)
function startVoice(){
alert("Voice feature coming soon 🎤");
}