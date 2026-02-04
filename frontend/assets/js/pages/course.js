import { apiRequest } from "../api.js";
import { getRole, isLoggedIn } from "../auth.js";

/* ---------- DOM ---------- */

const msg = document.getElementById("msg");

const titleEl = document.getElementById("courseTitle");
const descEl = document.getElementById("courseDesc");
const actionsEl = document.getElementById("actions");

const navLessons = document.getElementById("navLessons");
const navQuizzes = document.getElementById("navQuizzes");
const contentArea = document.getElementById("contentArea");

/* ---------- STATE ---------- */

let currentCourse = null;
let isEnrolled = false;

/* ---------- HELPERS ---------- */

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getCourseId() {
  return new URLSearchParams(window.location.search).get("id");
}

function getYoutubeEmbed(url) {
  if (!url) return null;

  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
  );

  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

/* ---------- ENROLLMENT ---------- */

async function checkEnrollment(courseId) {
  if (!isLoggedIn() || getRole() !== "student") return false;

  const data = await apiRequest("/enrollments/my", { auth: true });
  return data.some(
    e => e.courseId?._id === courseId || e.courseId === courseId
  );
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
    openLessonByIndex(0);
    show("Enrolled successfully!", true);
  } catch (e) {
    show(e.message || "Enroll failed");
  }
}

/* ---------- ACTIONS ---------- */

function renderActions(courseId) {
  actionsEl.innerHTML = "";

  if (!isLoggedIn()) {
    actionsEl.innerHTML = `
      <a class="btn" href="login.html?next=${encodeURIComponent(
        `course.html?id=${courseId}`
      )}">
        Login to enroll
      </a>
    `;
    return;
  }

  if (getRole() === "student") {
    const btn = document.createElement("button");
    btn.className = "btn";

    if (isEnrolled) {
  return; // 🔥 просто ничего не рендерим
}

btn.textContent = "Enroll";
btn.onclick = () => enroll(courseId);


    actionsEl.appendChild(btn);
  }
}

/* ---------- LESSONS ---------- */

function openLessonByIndex(index = 0) {
  const l = currentCourse?.lessons?.[index];
  if (!l) return;

  const embedUrl = getYoutubeEmbed(l.videoUrl);

  contentArea.innerHTML = `
    <h3>${escapeHtml(l.title)}</h3>

    ${
      embedUrl
        ? `
          <div style="margin:16px 0;">
            <iframe
              width="100%"
              height="400"
              src="${embedUrl}"
              title="Lesson video"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>
        `
        : ""
    }

    <p class="small">${escapeHtml(l.content || "")}</p>
  `;
}

function renderNavLessons(lessons = []) {
  navLessons.innerHTML = lessons.length
    ? lessons
        .map(
          (l, i) => `
        <div class="navItem" data-lesson="${i}">
          Lesson ${i + 1}: ${escapeHtml(l.title)}
        </div>
      `
        )
        .join("")
    : `<div class="small">No lessons</div>`;

  navLessons.querySelectorAll("[data-lesson]").forEach(el => {
    el.onclick = () => openLessonByIndex(Number(el.dataset.lesson));
  });
}

/* ---------- QUIZZES ---------- */

function renderNavQuizzes(quizzes = []) {
  navQuizzes.innerHTML = quizzes.length
    ? quizzes
        .map(
          (q, i) => `
        <div class="navItem" data-quiz="${i}">
          Quiz ${i + 1}: ${escapeHtml(q.title)}
        </div>
      `
        )
        .join("")
    : `<div class="small">No quizzes</div>`;

  navQuizzes.querySelectorAll("[data-quiz]").forEach(el => {
    el.onclick = () => {
      const q = currentCourse.quizzes[el.dataset.quiz];
      contentArea.innerHTML = `
        <h3>${escapeHtml(q.title)}</h3>
        <div class="small">Tasks: ${(q.tasks || []).length}</div>
      `;
    };
  });
}

/* ---------- LOAD ---------- */

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

    // 🔥 AUTO OPEN FIRST LESSON
    if (course.lessons && course.lessons.length > 0) {
      openLessonByIndex(0);
    } else {
      contentArea.innerHTML = `<div class="small">No lessons yet.</div>`;
    }
  } catch (e) {
    show(e.message || "Failed to load course");
  }
}

load();