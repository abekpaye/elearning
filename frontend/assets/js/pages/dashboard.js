import { apiRequest } from "../api.js";
import { getRole, isLoggedIn } from "../auth.js";

const msg = document.getElementById("msg");
const roleLine = document.getElementById("roleLine");

const studentBox = document.getElementById("studentBox");
const instructorBox = document.getElementById("instructorBox");
const mentorBox = document.getElementById("mentorBox");
const adminBox = document.getElementById("adminBox");

function show(text, ok=false){
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

function esc(s=""){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function requireLogin(){
  if (!isLoggedIn()){
    window.location.href = "login.html?next=dashboard.html";
    return false;
  }
  return true;
}

function showPanel(role){
  studentBox.style.display = role === "student" ? "block" : "none";
  instructorBox.style.display = role === "instructor" ? "block" : "none";
  mentorBox.style.display = role === "mentor" ? "block" : "none";
  adminBox.style.display = role === "admin" ? "block" : "none";
}

(function init(){
  if (!requireLogin()) return;
  const role = getRole();
  roleLine.textContent = `Logged in role: ${role}`;
  showPanel(role);
})();

/* STUDENT: update progress */
document.getElementById("btnProgress")?.addEventListener("click", async () => {
  const courseId = document.getElementById("studentCourseId").value.trim();
  const progress = Number(document.getElementById("studentProgress").value);

  try{
    show("");
    await apiRequest("/enrollments/progress", {
      method:"PATCH",
      body:{ courseId, progress },
      auth:true
    });
    show("Progress updated!", true);
  }catch(e){
    show(e.message || "Progress update failed");
  }
});

/* INSTRUCTOR: create course */
document.getElementById("createCourseForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("cTitle").value.trim();
  const description = document.getElementById("cDesc").value.trim();
  const price = Number(document.getElementById("cPrice").value);
  const mentorId = document.getElementById("cMentorId").value.trim();

  try{
    show("");
    const data = await apiRequest("/courses", {
      method:"POST",
      body:{ title, description, price, mentorId },
      auth:true
    });
    show(`Course created! ID: ${data._id || data.id}`, true);
    e.target.reset();
  }catch(err){
    show(err.message || "Create course failed");
  }
});

/* INSTRUCTOR: add lesson */
document.getElementById("addLessonForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const courseId = document.getElementById("lCourseId").value.trim();
  const title = document.getElementById("lTitle").value.trim();
  const content = document.getElementById("lContent").value.trim();

  try{
    show("");
    await apiRequest(`/courses/${courseId}/lessons`, {
      method:"POST",
      body:{ title, content },
      auth:true
    });
    show("Lesson added!", true);
    e.target.reset();
  }catch(err){
    show(err.message || "Add lesson failed");
  }
});

/* INSTRUCTOR: add quiz */
document.getElementById("addQuizForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const courseId = document.getElementById("qCourseId").value.trim();
  const title = document.getElementById("qTitle").value.trim();
  const tasksRaw = document.getElementById("qTasks").value.trim();

  try{
    show("");
    const tasks = JSON.parse(tasksRaw); // teacher-friendly: shows you handle structure
    await apiRequest(`/courses/${courseId}/quizzes`, {
      method:"POST",
      body:{ title, tasks },
      auth:true
    });
    show("Quiz added!", true);
    e.target.reset();
  }catch(err){
    show(err.message || "Add quiz failed (check JSON tasks)");
  }
});

/* MENTOR: answer */
document.getElementById("answerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const courseId = document.getElementById("mCourseId").value.trim();
  const questionId = document.getElementById("mQuestionId").value.trim();
  const answerText = document.getElementById("mAnswerText").value.trim();

  try{
    show("");
    await apiRequest(`/questions/course/${courseId}/question/${questionId}/answer`, {
      method:"POST",
      body:{ answerText },
      auth:true
    });
    show("Answer sent!", true);
    e.target.reset();
  }catch(err){
    show(err.message || "Answer failed");
  }
});

/* ADMIN: delete user */
document.getElementById("deleteUserForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = document.getElementById("delUserId").value.trim();

  try{
    show("");
    await apiRequest(`/users/${userId}`, { method:"DELETE", auth:true });
    show("User deleted!", true);
    e.target.reset();
  }catch(err){
    show(err.message || "Delete user failed");
  }
});

/* ADMIN: delete low attempts */
document.getElementById("btnDeleteLow")?.addEventListener("click", async () => {
  try{
    show("");
    const data = await apiRequest("/quizzes/attempts/low", { method:"DELETE", auth:true });
    show(data.message || "Low attempts deleted!", true);
  }catch(err){
    show(err.message || "Delete low attempts failed");
  }
});

/* ADMIN: analytics */
document.getElementById("btnAnalytics")?.addEventListener("click", async () => {
  const box = document.getElementById("analyticsBox");
  try{
    show("");
    const data = await apiRequest("/analytics/course-engagement", { auth:true });

    const rows = Array.isArray(data) ? data : (data.data || data);
    box.innerHTML = `
      <div class="small">Results:</div>
      ${(rows || []).map(r => `
        <div class="listItem">
          <b>${esc(r.courseTitle || "Course")}</b><br/>
          Students: ${r.studentsCount ?? "-"} |
          Avg progress: ${r.averageProgress ?? "-"} |
          Active: ${r.activeStudents ?? "-"}
        </div>
      `).join("")}
    `;
    show("Analytics loaded!", true);
  }catch(err){
    show(err.message || "Analytics failed");
  }
});