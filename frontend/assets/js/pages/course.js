import { apiRequest } from "../api.js";
import { getRole, isLoggedIn } from "../auth.js";

const msg = document.getElementById("msg");

const titleEl = document.getElementById("courseTitle");
const descEl = document.getElementById("courseDesc");
const lessonsEl = document.getElementById("lessonsList");
const quizzesEl = document.getElementById("quizzesList");
const actionsEl = document.getElementById("actions");

const qaInfo = document.getElementById("qaInfo");
const askForm = document.getElementById("askForm");
const qInput = document.getElementById("questionText");
const questionsEl = document.getElementById("questionsList");

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

function escapeHtml(s = "") {
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function getCourseId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function enroll(courseId) {
  try {
    show("");
    await apiRequest("/enrollments", { method:"POST", body:{ courseId }, auth:true });
    show("Enrolled successfully!", true);
  } catch (e) {
    show(e.message || "Enroll failed");
  }
}

async function askQuestion(courseId, text) {
  return apiRequest("/questions", {
    method: "POST",
    body: { courseId, questionText: text },
    auth: true
  });
}

function renderLessons(lessons = []) {
  if (!lessons.length) {
    lessonsEl.innerHTML = `<div class="small">No lessons yet.</div>`;
    return;
  }
  lessonsEl.innerHTML = lessons.map((l, i) => `
    <div class="listItem">
      <b>Lesson ${i+1}:</b> ${escapeHtml(l.title || "Untitled")}
      <div class="small">${escapeHtml(l.content || "")}</div>
    </div>
  `).join("");
}

function renderQuizzes(quizzes = []) {
  if (!quizzes.length) {
    quizzesEl.innerHTML = `<div class="small">No quizzes yet.</div>`;
    return;
  }
  quizzesEl.innerHTML = quizzes.map((q, i) => `
    <div class="listItem">
      <b>Quiz ${i+1}:</b> ${escapeHtml(q.title || "Untitled")}
      <div class="small">Tasks: ${(q.tasks || []).length}</div>
    </div>
  `).join("");
}

function renderQuestions(questions = []) {
  if (!questions.length) {
    questionsEl.innerHTML = `<div class="small">No questions yet.</div>`;
    return;
  }

  questionsEl.innerHTML = questions.map((q) => {
    const qText = escapeHtml(q.questionText || "");
    const studentName = escapeHtml(q.studentId?.name || "Student");
    const answers = q.answers || [];

    return `
      <div class="qBox">
        <p class="qTitle">${qText}</p>
        <p class="qMeta">Asked by: ${studentName}</p>

        ${answers.length ? answers.map(a => {
          const mentor = escapeHtml(a.mentorId?.name || "Mentor");
          const aText = escapeHtml(a.answerText || "");
          return `<div class="answer"><b>${mentor}:</b> ${aText}</div>`;
        }).join("") : `<div class="small">No answers yet.</div>`}
      </div>
    `;
  }).join("");
}

async function load() {
  const courseId = getCourseId();
  if (!courseId) {
    show("No course id in URL. Open from courses page.", false);
    return;
  }

  try {
    show("Loading course...", true);

    // 1) course details (public)
    const course = await apiRequest(`/courses/${courseId}`);
    titleEl.textContent = course.title || "Untitled";
    descEl.textContent = course.description || "";
    renderLessons(course.lessons || []);
    renderQuizzes(course.quizzes || []);

    // 2) actions depending on role
    actionsEl.innerHTML = "";
    const role = getRole();

    if (!isLoggedIn()) {
      actionsEl.innerHTML = `<a class="btn" href="login.html?next=${encodeURIComponent(`course.html?id=${courseId}`)}">Login to enroll</a>`;
    } else {
      if (role === "student") {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = "Enroll";
        btn.addEventListener("click", () => enroll(courseId));
        actionsEl.appendChild(btn);

        askForm.style.display = "grid";
      } else {
        askForm.style.display = "none";
      }
    }

    // 3) Q&A (requires auth)
    if (isLoggedIn()) {
      qaInfo.textContent = "Course questions:";
      const qa = await apiRequest(`/questions/course/${courseId}`, { auth:true });
      renderQuestions(qa.questions || qa || []);
    } else {
      qaInfo.textContent = "Login to view Q&A.";
      renderQuestions([]);
    }

    show("");
  } catch (e) {
    show(e.message || "Failed to load course");
  }
}

// ask form submit
askForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const courseId = getCourseId();
  const text = qInput.value.trim();
  if (!text) return;

  try {
    show("");
    await askQuestion(courseId, text);
    qInput.value = "";
    show("Question submitted!", true);

    // reload Q&A
    const qa = await apiRequest(`/questions/course/${courseId}`, { auth:true });
    renderQuestions(qa.questions || qa || []);
  } catch (err) {
    show(err.message || "Failed to submit question");
  }
});

load();