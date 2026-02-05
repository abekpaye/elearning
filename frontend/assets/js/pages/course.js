// frontend/assets/js/pages/course.js
import { apiRequest } from "../api.js";
import { getRole, isLoggedIn } from "../auth.js";

const msg = document.getElementById("msg");

const titleEl = document.getElementById("courseTitle");
const descEl = document.getElementById("courseDesc");
const actionsEl = document.getElementById("actions");

const navLessons = document.getElementById("navLessons");
const navQuizzes = document.getElementById("navQuizzes");
const contentArea = document.getElementById("contentArea");

let currentCourse = null;
let isEnrolled = false;

/* ---------- helpers ---------- */

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
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

async function checkEnrollment(courseId) {
  if (!isLoggedIn() || getRole() !== "student") return false;

  const data = await apiRequest("/enrollments/my", { auth: true });
  if (!Array.isArray(data)) return false;

  return data.some((e) => e.courseId?._id === courseId || e.courseId === courseId);
}

/* ---------- enroll UI ---------- */

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

  if (getRole() === "student" && !isEnrolled) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Enroll";
    btn.onclick = () => enroll(courseId);
    actionsEl.appendChild(btn);
  }
}

/* ---------- lessons ---------- */

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

  navLessons.querySelectorAll("[data-lesson]").forEach((el) => {
    el.onclick = () => openLessonByIndex(Number(el.dataset.lesson));
  });
}

/* ---------- quizzes: stats / lock / submit ---------- */

async function loadQuizStats(quizId) {
  try {
    return await apiRequest(`/quizzes/attempts/my?quizId=${quizId}`, { auth: true });
  } catch {
    return { latestAttempt: null, attemptsCount: 0 };
  }
}

function renderLockedQuizView(q, stats, onRetake) {
  const attempts = Number(stats?.attemptsCount || 0);
  const last = stats?.latestAttempt?.score;

  contentArea.innerHTML = `
    <h3>${escapeHtml(q.title)}</h3>
    <div class="small" style="margin-top:8px;">
      This quiz is already submitted.
      ${typeof last === "number" ? ` Last score: <b>${last}</b>.` : ""}
      ${attempts > 0 ? ` Attempts: <b>${attempts}</b>.` : ""}
    </div>

    <div style="margin-top:14px;">
      <button class="btn" id="btnRetake">Retake</button>
    </div>
  `;

  document.getElementById("btnRetake").onclick = onRetake;
}

function renderQuizForm(q, onSubmit) {
  const tasks = q.tasks || [];

  contentArea.innerHTML = `
    <h3>${escapeHtml(q.title)}</h3>

    <form id="quizForm" style="margin-top:14px;">
      ${tasks
        .map((t, idx) => {
          const opts = (t.options || [])
            .map(
              (o) => `
              <label class="answer" style="display:block; cursor:pointer;">
                <input type="radio" name="q_${t._id}" value="${o._id}" />
                ${escapeHtml(o.text)}
              </label>
            `
            )
            .join("");

          return `
            <div class="qBox" data-task="${t._id}">
              <div class="qTitle">${idx + 1}. ${escapeHtml(t.question)}</div>
              ${opts}
              <div class="small" data-feedback style="margin-top:6px;"></div>
            </div>
          `;
        })
        .join("")}

      <button class="btn" type="submit" id="quizSubmitBtn" style="margin-top:10px;">
  Submit
</button>
      <div class="small" id="quizMsg" style="margin-top:10px;"></div>
    </form>
  `;

  document.getElementById("quizForm").addEventListener("submit", onSubmit);
}

function markQuizResults(results = []) {
  results.forEach((r) => {
    const box = contentArea.querySelector(`.qBox[data-task="${r.taskId}"]`);
    if (!box) return;

    const feedback = box.querySelector("[data-feedback]");
    if (!feedback) return;

    if (r.isCorrect) {
      feedback.textContent = "✅ Correct";
      feedback.style.color = "green";
    } else {
      feedback.textContent = "❌ Wrong";
      feedback.style.color = "crimson";
    }
  });
}

async function openQuizByIndex(index = 0) {
  const q = currentCourse?.quizzes?.[index];
  if (!q) return;

  const canSubmit = isLoggedIn() && getRole() === "student" && isEnrolled;

  if (!canSubmit) {
    contentArea.innerHTML = `
      <h3>${escapeHtml(q.title)}</h3>
      <div class="small">Login as student and enroll to take this quiz.</div>
    `;
    return;
  }

  const stats = await loadQuizStats(q._id);
  const hasAttempts = Number(stats?.attemptsCount || 0) > 0;

  if (hasAttempts) {
    renderLockedQuizView(q, stats, () => {
      renderQuizForm(q, handleSubmit);
    });
    return;
  }

  renderQuizForm(q, handleSubmit);

  async function handleSubmit(e) {
  e.preventDefault();

  const quizMsg = document.getElementById("quizMsg");
  const submitBtn = document.getElementById("quizSubmitBtn");

  quizMsg.textContent = "";
  quizMsg.style.color = "crimson";

  const answers = (q.tasks || []).map((t) => {
    const checked = contentArea.querySelector(`input[name="q_${t._id}"]:checked`);
    return { taskId: t._id, selectedOptionId: checked ? checked.value : null };
  });

  if (answers.some((a) => !a.selectedOptionId)) {
    quizMsg.textContent = "Please answer all questions.";
    return;
  }

  try {
    const resp = await apiRequest("/quizzes/attempts", {
      method: "POST",
      body: { quizId: q._id, answers },
      auth: true
    });

    // ✅ показать правильные / неправильные
    markQuizResults(resp.results || []);

    quizMsg.textContent = `Score: ${resp.score}. Progress: ${resp.progress}.`;
    quizMsg.style.color = "green";

    // 🔒 блокируем варианты
    contentArea
      .querySelectorAll('input[type="radio"]')
      .forEach((i) => (i.disabled = true));

    // 🔁 меняем Submit → Retake
    submitBtn.textContent = "Retake";
    submitBtn.type = "button";

    submitBtn.onclick = () => {
      // очистка ответов
      contentArea
        .querySelectorAll('input[type="radio"]')
        .forEach((i) => {
          i.checked = false;
          i.disabled = false;
        });

      // очистка feedback
      contentArea
        .querySelectorAll("[data-feedback]")
        .forEach((f) => (f.textContent = ""));

      quizMsg.textContent = "";

      // возвращаем Submit
      submitBtn.textContent = "Submit";
      submitBtn.type = "submit";
      submitBtn.onclick = null;
    };

  } catch (err) {
    quizMsg.textContent = err.message || "Submit failed";
  }
}
}

/* ---------- quizzes nav ---------- */

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

  navQuizzes.querySelectorAll("[data-quiz]").forEach((el) => {
    el.onclick = () => openQuizByIndex(Number(el.dataset.quiz));
  });
}

/* ---------- load course ---------- */

async function load() {
  const courseId = getCourseId();
  if (!courseId) return show("No course id");

  try {
    const course = await apiRequest(`/courses/${courseId}`, { auth: true });
    currentCourse = course;

    titleEl.textContent = course.title;
    descEl.textContent = course.description;

    isEnrolled = await checkEnrollment(courseId);

    renderActions(courseId);
    renderNavLessons(course.lessons || []);
    renderNavQuizzes(course.quizzes || []);

    const role = getRole();

const canAutoOpenLesson =
  (role === "student" && isEnrolled) ||
  role === "instructor";

if (canAutoOpenLesson && course.lessons?.length > 0) {
  openLessonByIndex(0);
} else {
  contentArea.innerHTML = `
    <div class="small">
      Select a lesson or quiz from the left menu.
    </div>
  `;
}

  } catch (e) {
    show(e.message || "Failed to load course");
  }
}

load();