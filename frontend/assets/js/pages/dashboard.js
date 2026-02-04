import { apiRequest } from "../api.js";
import { getRole, isLoggedIn } from "../auth.js";

const msg = document.getElementById("msg");
const roleLine = document.getElementById("roleLine");
const progressList = document.getElementById("studentProgressList");

const studentBox = document.getElementById("studentBox");
const instructorBox = document.getElementById("instructorBox");

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

function esc(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = "login.html?next=dashboard.html";
    return false;
  }
  return true;
}

function showPanel(role) {
  studentBox.style.display = role === "student" ? "block" : "none";
  instructorBox.style.display = role === "instructor" ? "block" : "none";
}

(function init() {
  if (!requireLogin()) return;
  const role = getRole();
  roleLine.textContent = `Logged in role: ${role}`;
  showPanel(role);
  if (role === "student") {
    loadStudentProgress();
  }
})();

/* ---------- STUDENT ---------- */

document.getElementById("btnProgress")?.addEventListener("click", async () => {
  const courseId = document.getElementById("studentCourseId").value.trim();
  const progress = Number(document.getElementById("studentProgress").value);

  try {
    show("");
    await apiRequest("/enrollments/progress", {
      method: "PATCH",
      body: { courseId, progress },
      auth: true
    });
    show("Progress updated!", true);
  } catch (e) {
    show(e.message || "Progress update failed");
  }
});

async function loadStudentProgress() {
  try {
    const enrollments = await apiRequest("/enrollments/my", { auth: true });

    if (!enrollments.length) {
      progressList.innerHTML =
        `<div class="small">You are not enrolled in any courses yet.</div>`;
      return;
    }

    progressList.innerHTML = enrollments.map(e => `
      <div class="card" style="margin-bottom:14px;">
        <h4 style="margin:0 0 6px;">${esc(e.courseId.title)}</h4>
        <p class="small" style="margin:0 0 10px;">
          ${esc(e.courseId.description || "")}
        </p>

        <div class="progressBar">
          <div class="progressFill" style="width:${e.progress}%">
            ${e.progress}%
          </div>
        </div>

        <a class="btn" style="margin-top:10px;display:inline-block;"
           href="course.html?id=${e.courseId._id}">
          Open course
        </a>
      </div>
    `).join("");

  } catch (e) {
    show(e.message || "Failed to load progress");
  }
}

/* ---------- INSTRUCTOR ---------- */

document
  .getElementById("createCourseForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("cTitle").value.trim();
    const description = document.getElementById("cDesc").value.trim();
    const price = Number(document.getElementById("cPrice").value);

    try {
      show("");
      const data = await apiRequest("/courses", {
        method: "POST",
        body: { title, description, price },
        auth: true
      });
      show(`Course created! ID: ${data._id || data.id}`, true);
      e.target.reset();
    } catch (err) {
      show(err.message || "Create course failed");
    }
  });

document
  .getElementById("addLessonForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const courseId = document.getElementById("lCourseId").value.trim();
    const title = document.getElementById("lTitle").value.trim();
    const content = document.getElementById("lContent").value.trim();

    try {
      show("");
      await apiRequest(`/courses/${courseId}/lessons`, {
        method: "POST",
        body: { title, content },
        auth: true
      });
      show("Lesson added!", true);
      e.target.reset();
    } catch (err) {
      show(err.message || "Add lesson failed");
    }
  });

document
  .getElementById("addQuizForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const courseId = document.getElementById("qCourseId").value.trim();
    const title = document.getElementById("qTitle").value.trim();
    const tasksRaw = document.getElementById("qTasks").value.trim();

    try {
      show("");
      const tasks = JSON.parse(tasksRaw);
      await apiRequest(`/courses/${courseId}/quizzes`, {
        method: "POST",
        body: { title, tasks },
        auth: true
      });
      show("Quiz added!", true);
      e.target.reset();
    } catch (err) {
      show(err.message || "Add quiz failed (check JSON tasks)");
    }
  });