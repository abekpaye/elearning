import { apiRequest } from "../api.js";
import { getRole, isLoggedIn, getUserId } from "../auth.js";

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

function isOwnerInstructor(course) {
  const role = getRole();
  const uid = getUserId();
  if (role !== "instructor" || !uid) return false;

  const instId = course?.instructorId?._id || course?.instructorId;
  return String(instId) === String(uid);
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
      <a class="btn" href="/login?next=${encodeURIComponent(`/course?id=${courseId}`)}">
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
    if (getRole() === "instructor" && isOwnerInstructor(currentCourse)) {
    actionsEl.innerHTML = `
      <button class="btn" id="btnEditCourse">Edit</button>
      <button class="btn" id="btnDeleteCourse" style="background:#fff;border:1px solid #ddd;color:#111;">
        Delete course
      </button>
    `;

    document.getElementById("btnEditCourse").onclick = () => openEditView();
    document.getElementById("btnDeleteCourse").onclick = () => deleteCourse(courseId);
  }
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

    markQuizResults(resp.results || []);

    quizMsg.textContent = `Score: ${resp.score}. Progress: ${resp.progress}.`;
    quizMsg.style.color = "green";

    contentArea
      .querySelectorAll('input[type="radio"]')
      .forEach((i) => (i.disabled = true));

    submitBtn.textContent = "Retake";
    submitBtn.type = "button";

    submitBtn.onclick = () => {
      contentArea
        .querySelectorAll('input[type="radio"]')
        .forEach((i) => {
          i.checked = false;
          i.disabled = false;
        });

      contentArea
        .querySelectorAll("[data-feedback]")
        .forEach((f) => (f.textContent = ""));

      quizMsg.textContent = "";

      submitBtn.textContent = "Submit";
      submitBtn.type = "submit";
      submitBtn.onclick = null;
    };

  } catch (err) {
    quizMsg.textContent = err.message || "Submit failed";
  }
}
}

function editLessonRowHTML(l, idx) {
  return `
    <div class="card" data-lrow="${idx}" style="background:#fff; margin-top:10px; border:1px solid #eee;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <b>Lesson #${idx + 1}</b>
        <button class="btn btnSmall" type="button" data-remove="${idx}">Remove</button>
      </div>

      <input class="input" data-l-id value="${l._id || ""}" style="display:none;" />

      <div class="form" style="margin-top:10px;">
        <input class="input" data-l-title placeholder="Title" value="${escapeHtml(l.title || "")}" />
        <input class="input" data-l-video placeholder="Video URL" value="${escapeHtml(l.videoUrl || "")}" />
        <input class="input" data-l-order placeholder="Order number" value="${l.orderNumber ?? ""}" />
        <textarea class="input" data-l-content placeholder="Content" style="min-height:80px;">${escapeHtml(l.content || "")}</textarea>
      </div>
    </div>
  `;
}

function openEditView() {
  const c = currentCourse;

  const lessons = Array.isArray(c.lessons) ? c.lessons : [];
  const rows = lessons.map((l, i) => editLessonRowHTML(l, i)).join("");

  contentArea.innerHTML = `
    <h3>Edit course</h3>

    <div class="card" style="background:#fff; margin-top:12px;">
      <div class="form" style="max-width:800px;">
        <input class="input" id="editTitle" placeholder="Course title" value="${escapeHtml(c.title || "")}" />
        <textarea class="input" id="editDesc" placeholder="Course description" style="min-height:70px;">${escapeHtml(c.description || "")}</textarea>
      </div>
    </div>

    <div style="margin-top:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <h4 style="margin:0;">Lessons</h4>
        <button class="btn btnSmall" type="button" id="btnAddLessonEdit">+ Add lesson</button>
      </div>
      <div id="lessonsEditWrap">${rows || `<div class="small" style="margin-top:10px;">No lessons yet.</div>`}</div>
    </div>

    <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px;">
      <button class="btn" type="button" id="btnSaveChanges">Save changes</button>
      <button class="btn" type="button" id="btnCancelEdit" style="background:#fff;border:1px solid #ddd;color:#111;">
        Cancel
      </button>
    </div>

    <div class="small" id="editMsg" style="margin-top:10px;"></div>
  `;

  const wrap = document.getElementById("lessonsEditWrap");

  function wireRemoveButtons() {
    wrap.querySelectorAll("[data-remove]").forEach((b) => {
      b.onclick = () => {
        const idx = b.dataset.remove;
        const row = wrap.querySelector(`[data-lrow="${idx}"]`);
        if (row) row.remove();
      };
    });
  }

  wireRemoveButtons();

  document.getElementById("btnAddLessonEdit").onclick = () => {
    const idx = wrap.querySelectorAll("[data-lrow]").length;
    wrap.insertAdjacentHTML("beforeend", editLessonRowHTML({
      _id: "",
      title: "",
      content: "",
      videoUrl: "",
      orderNumber: idx + 1
    }, idx));
    wireRemoveButtons();
  };

  document.getElementById("btnCancelEdit").onclick = () => {
    openLessonByIndex(0);
  };

  document.getElementById("btnSaveChanges").onclick = () => saveChanges();
}

async function saveChanges() {
  const editMsg = document.getElementById("editMsg");
  const courseId = getCourseId();

  editMsg.textContent = "";
  editMsg.style.color = "crimson";

  const title = document.getElementById("editTitle").value.trim();
  const description = document.getElementById("editDesc").value.trim();

  if (!title || !description) {
    editMsg.textContent = "Title and description are required.";
    return;
  }

  try {
    await apiRequest(`/courses/${courseId}`, {
      method: "PATCH",
      body: { title, description },
      auth: true
    });

    const wrap = document.getElementById("lessonsEditWrap");
    const rows = Array.from(wrap.querySelectorAll("[data-lrow]"));

    for (const r of rows) {
      const lessonId = r.querySelector("[data-l-id]").value.trim();
      const lTitle = r.querySelector("[data-l-title]").value.trim();
      const lVideo = r.querySelector("[data-l-video]").value.trim();
      const lOrder = Number(r.querySelector("[data-l-order]").value);
      const lContent = r.querySelector("[data-l-content]").value.trim();

      if (!lTitle) continue;

      const payload = {
        title: lTitle,
        content: lContent,
        videoUrl: lVideo,
        orderNumber: Number.isFinite(lOrder) ? lOrder : undefined
      };

      if (lessonId) {
        await apiRequest(`/courses/${courseId}/lessons/${lessonId}`, {
          method: "PATCH",
          body: payload,
          auth: true
        });
      } else {
        await apiRequest(`/courses/${courseId}/lessons`, {
          method: "POST",
          body: payload,
          auth: true
        });
      }
    }

    editMsg.textContent = "Saved!";
    editMsg.style.color = "green";

    await load();
    openLessonByIndex(0);

  } catch (e) {
    editMsg.textContent = e.message || "Save failed";
  }
}

async function deleteCourse(courseId) {
  if (!confirm("Delete this course? This will remove enrollments and quiz attempts too.")) return;

  try {
    await apiRequest(`/courses/${courseId}`, {
      method: "DELETE",
      auth: true
    });

    window.location.href = "/courses";
  } catch (e) {
    show(e.message || "Delete failed");
  }
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
    el.onclick = () => openQuizByIndex(Number(el.dataset.quiz));
  });
}

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