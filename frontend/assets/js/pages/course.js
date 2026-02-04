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

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

function escapeHtml(s = "") {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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

  // Student not enrolled -> show enroll button
  if (getRole() === "student" && !isEnrolled) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Enroll";
    btn.onclick = () => enroll(courseId);
    actionsEl.appendChild(btn);
  }

  // If enrolled -> show nothing (as you wanted)
}

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

/* ---------------- QUIZ UI ---------------- */

function renderQuizByIndex(index = 0) {
  const q = currentCourse?.quizzes?.[index];
  if (!q) return;

  const role = getRole();
  const canSubmit = isLoggedIn() && role === "student" && isEnrolled;

  const tasks = Array.isArray(q.tasks) ? q.tasks : [];

  contentArea.innerHTML = `
    <h3>${escapeHtml(q.title)}</h3>
    <p class="small">Questions: ${tasks.length}</p>

    ${
      tasks.length
        ? `
          <form id="quizForm">
            ${tasks
              .map((t, ti) => {
                const opts = Array.isArray(t.options) ? t.options : [];
                return `
                  <div class="qBox" data-task="${t._id}">
                    <div class="qTitle">${ti + 1}. ${escapeHtml(t.question)}</div>
                    <div class="qMeta">Choose one option</div>

                    ${opts
                      .map(
                        (o) => `
                        <label class="listItem" style="display:block; cursor:pointer;">
                          <input
                            type="radio"
                            name="task_${t._id}"
                            value="${o._id}"
                            ${canSubmit ? "" : "disabled"}
                          />
                          ${escapeHtml(o.text)}
                        </label>
                      `
                      )
                      .join("")}

                    <div class="answer" data-result style="display:none;"></div>
                  </div>
                `;
              })
              .join("")}

            ${
              canSubmit
                ? `<button class="btn" type="submit">Submit</button>`
                : `<div class="small" style="margin-top:10px;">
                    ${
                      !isLoggedIn()
                        ? "Login to submit this quiz."
                        : role !== "student"
                        ? "Only students can submit quizzes."
                        : !isEnrolled
                        ? "Enroll to submit this quiz."
                        : "You cannot submit this quiz."
                    }
                  </div>`
            }
          </form>
        `
        : `<div class="small">No tasks in this quiz.</div>`
    }
  `;

  if (!canSubmit) return;

  const form = document.getElementById("quizForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      show("");

      const answers = tasks.map((t) => {
        const selected = form.querySelector(`input[name="task_${t._id}"]:checked`);
        return {
          taskId: t._id,
          selectedOptionId: selected ? selected.value : null
        };
      });

      const hasEmpty = answers.some((a) => !a.selectedOptionId);
      if (hasEmpty) {
        return show("Please answer all questions before submit.");
      }

      const resp = await apiRequest("/quizzes/attempts", {
        method: "POST",
        body: { quizId: q._id, answers },
        auth: true
      });

      show(`Submitted! Score: ${resp.score}. Course progress: ${resp.progress}`, true);

      const resultMap = new Map(resp.results.map((r) => [String(r.taskId), r]));

      document.querySelectorAll(".qBox").forEach((box) => {
        const taskId = String(box.getAttribute("data-task"));
        const r = resultMap.get(taskId);
        if (!r) return;

        const resultEl = box.querySelector('[data-result]');
        resultEl.style.display = "block";

        const task = tasks.find((x) => String(x._id) === taskId);
        const correctText =
          task?.options?.find((o) => String(o._id) === String(r.correctOptionId))?.text ||
          "Correct option";

        if (r.isCorrect) {
          resultEl.textContent = "✅ Correct";
          resultEl.style.border = "1px solid rgba(0,128,0,.25)";
        } else {
          resultEl.textContent = `❌ Wrong. Correct answer: ${correctText}`;
          resultEl.style.border = "1px solid rgba(220,20,60,.25)";
        }
      });

      // lock after submit
      form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
    } catch (err) {
      show(err.message || "Submit failed");
    }
  });
}

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
    el.onclick = () => renderQuizByIndex(Number(el.dataset.quiz));
  });
}

/* ---------------- Load course ---------------- */

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

    if (isEnrolled && course.lessons?.length > 0) {
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