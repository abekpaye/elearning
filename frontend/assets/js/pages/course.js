import { apiRequest } from "../api.js";
import { getRole, isLoggedIn } from "../auth.js";

const msg = document.getElementById("msg");

const titleEl = document.getElementById("courseTitle");
const descEl = document.getElementById("courseDesc");
const actionsEl = document.getElementById("actions");

const navLessons = document.getElementById("navLessons");
const navQuizzes = document.getElementById("navQuizzes");
const openQA = document.getElementById("openQA");
const contentArea = document.getElementById("contentArea");

let currentCourse = null;
let isEnrolled = false;

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

function escapeHtml(s = "") {
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function getCourseId() {
  return new URLSearchParams(window.location.search).get("id");
}

async function checkEnrollment(courseId) {
  if (!isLoggedIn() || getRole() !== "student") return false;

  const data = await apiRequest("/enrollments/my", { auth: true });
  return data.some(e => e.courseId?._id === courseId || e.courseId === courseId);
}

async function enroll(courseId) {
  try {
    await apiRequest("/enrollments", {
      method: "POST",
      body: { courseId },
      auth: true
    });

    isEnrolled = true;
    renderActions(courseId);
    show("Enrolled successfully!", true);
  } catch (e) {
    show(e.message || "Enroll failed");
  }
}

function renderActions(courseId) {
  actionsEl.innerHTML = "";

  if (!isLoggedIn()) {
    actionsEl.innerHTML = `
      <a class="btn" href="login.html?next=${encodeURIComponent(`course.html?id=${courseId}`)}">
        Login to enroll
      </a>
    `;
    return;
  }

  if (getRole() === "student") {
    const btn = document.createElement("button");
    btn.className = "btn";

    if (isEnrolled) {
      btn.textContent = "Open course";
      btn.onclick = () => {
        contentArea.innerHTML = `
          <div class="small">Select a lesson, quiz or Q&A from the left menu.</div>
        `;
      };
    } else {
      btn.textContent = "Enroll";
      btn.onclick = () => enroll(courseId);
    }

    actionsEl.appendChild(btn);
  }
}

/* ---------- lessons & quizzes ---------- */

function renderNavLessons(lessons = []) {
  navLessons.innerHTML = lessons.length
    ? lessons.map((l,i)=>`
        <div class="navItem" data-lesson="${i}">
          Lesson ${i+1}: ${escapeHtml(l.title)}
        </div>`).join("")
    : `<div class="small">No lessons</div>`;

  navLessons.querySelectorAll("[data-lesson]").forEach(el=>{
    el.onclick = () => {
      const l = currentCourse.lessons[el.dataset.lesson];
      contentArea.innerHTML = `
        <h3>${escapeHtml(l.title)}</h3>
        <p class="small">${escapeHtml(l.content)}</p>
      `;
    };
  });
}

function renderNavQuizzes(quizzes = []) {
  navQuizzes.innerHTML = quizzes.length
    ? quizzes.map((q,i)=>`
        <div class="navItem" data-quiz="${i}">
          Quiz ${i+1}: ${escapeHtml(q.title)}
        </div>`).join("")
    : `<div class="small">No quizzes</div>`;

  navQuizzes.querySelectorAll("[data-quiz]").forEach(el=>{
    el.onclick = () => {
      const q = currentCourse.quizzes[el.dataset.quiz];
      contentArea.innerHTML = `
        <h3>${escapeHtml(q.title)}</h3>
        <div class="small">Tasks: ${(q.tasks||[]).length}</div>
      `;
    };
  });
}

/* ---------- load ---------- */

async function load() {
  const courseId = getCourseId();
  if (!courseId) return show("No course id");

  try {
    const course = await apiRequest(`/courses/${courseId}`);
    currentCourse = course;

    titleEl.textContent = course.title;
    descEl.textContent = course.description;

    isEnrolled = await checkEnrollment(courseId);

    renderActions(courseId);
    renderNavLessons(course.lessons || []);
    renderNavQuizzes(course.quizzes || []);

    contentArea.innerHTML = `
      <div class="small">Select a lesson, quiz or Q&A from the left menu.</div>
    `;
  } catch (e) {
    show(e.message || "Failed to load course");
  }
}

load();