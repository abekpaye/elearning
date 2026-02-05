import { apiRequest } from "../api.js";
import { getRole, isLoggedIn } from "../auth.js";

const msg = document.getElementById("msg");

const cTitle = document.getElementById("cTitle");
const cDesc = document.getElementById("cDesc");

const lessonsWrap = document.getElementById("lessonsWrap");
const quizzesWrap = document.getElementById("quizzesWrap");

const btnAddLesson = document.getElementById("btnAddLesson");
const btnAddQuiz = document.getElementById("btnAddQuiz");
const btnPublish = document.getElementById("btnPublish");

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

/* ---------- access guard ---------- */
(function guard() {
  if (!isLoggedIn()) {
    window.location.href = "login.html?next=create-course.html";
    return;
  }
  if (getRole() !== "instructor") {
    window.location.href = "courses.html";
    return;
  }
})();

/* ---------- LESSON UI ---------- */
let lessonCount = 0;

function lessonBlockHTML(idx) {
  return `
    <div class="card lessonBox" data-lesson="${idx}" style="background:#fff; margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <h4 style="margin:0;">Lesson #${idx + 1}</h4>
        <button class="btn btnSmall btnRemoveLesson" type="button" data-remove-lesson="${idx}">
          Remove
        </button>
      </div>

      <div class="form" style="margin-top:10px;">
        <input class="input" data-l-title placeholder="Lesson title" required />
        <input class="input" data-l-video placeholder="Video URL (YouTube link)" />
        <textarea class="input" data-l-content placeholder="Lesson content" style="min-height:70px;"></textarea>
      </div>
    </div>
  `;
}

function addLessonBlock() {
  const idx = lessonCount++;
  lessonsWrap.insertAdjacentHTML("beforeend", lessonBlockHTML(idx));

  lessonsWrap.querySelector(`[data-remove-lesson="${idx}"]`).onclick = () => {
    const box = lessonsWrap.querySelector(`.lessonBox[data-lesson="${idx}"]`);
    if (box) box.remove();
  };
}

/* ---------- QUIZ UI ---------- */
let quizCount = 0;

function quizBlockHTML(qIdx) {
  return `
    <div class="card quizBox" data-quiz="${qIdx}" style="background:#fff; margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <h4 style="margin:0;">Quiz #${qIdx + 1}</h4>
        <button class="btn btnSmall btnRemoveQuiz" type="button" data-remove-quiz="${qIdx}">
          Remove
        </button>
      </div>

      <div class="form" style="margin-top:10px; max-width:800px;">
        <input class="input" data-q-title placeholder="Quiz title" required />
      </div>

      <div style="margin-top:10px;">
        <button class="btn btnSmall" type="button" data-add-question="${qIdx}">+ Add question</button>
      </div>

      <div class="questionsWrap" data-questions style="margin-top:10px;"></div>
    </div>
  `;
}

function questionHTML(qIdx, tIdx) {
  return `
    <div class="card questionBox" data-question="${tIdx}" style="background:#fff; margin-top:10px;border:1px solid #eee;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <b>Question #${tIdx + 1}</b>
        <button class="btn btnSmall" type="button" data-remove-question="${qIdx}:${tIdx}">Remove</button>
      </div>

      <div class="form" style="margin-top:10px;">
        <input class="input" data-t-question placeholder="Question text" required />

        <div class="small" style="margin:8px 0 4px;">Options (choose correct):</div>

        ${[0, 1, 2, 3].map(i => `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <input type="radio" name="correct_${qIdx}_${tIdx}" value="${i}" />
            <input class="input" data-opt="${i}" placeholder="Option ${i + 1}" required />
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function addQuizBlock() {
  const qIdx = quizCount++;
  quizzesWrap.insertAdjacentHTML("beforeend", quizBlockHTML(qIdx));

  // remove quiz
  quizzesWrap.querySelector(`[data-remove-quiz="${qIdx}"]`).onclick = () => {
    const box = quizzesWrap.querySelector(`.quizBox[data-quiz="${qIdx}"]`);
    if (box) box.remove();
  };

  // add question
  const addBtn = quizzesWrap.querySelector(`[data-add-question="${qIdx}"]`);
  addBtn.onclick = () => addQuestion(qIdx);

  // start with 1 question by default
  addQuestion(qIdx);
}

function addQuestion(qIdx) {
  const quizBox = quizzesWrap.querySelector(`.quizBox[data-quiz="${qIdx}"]`);
  if (!quizBox) return;

  const wrap = quizBox.querySelector(`[data-questions]`);
  const tIdx = wrap.querySelectorAll(".questionBox").length;

  wrap.insertAdjacentHTML("beforeend", questionHTML(qIdx, tIdx));

  const rm = wrap.querySelector(`[data-remove-question="${qIdx}:${tIdx}"]`);
  rm.onclick = () => {
    const box = wrap.querySelector(`.questionBox[data-question="${tIdx}"]`);
    if (box) box.remove();
  };
}

/* ---------- BUTTONS ---------- */
btnAddLesson.onclick = addLessonBlock;
btnAddQuiz.onclick = addQuizBlock;

// some defaults
addLessonBlock();
addQuizBlock();

/* ---------- PUBLISH ---------- */
btnPublish.onclick = async () => {
  try {
    show("");

    const title = cTitle.value.trim();
    const description = cDesc.value.trim();

    if (!title || !description) {
      show("Course title and description are required.");
      return;
    }

    btnPublish.disabled = true;
    btnPublish.textContent = "Publishing...";

    // 1) create course
    const course = await apiRequest("/courses", {
      method: "POST",
      body: { title, description },
      auth: true
    });

    const courseId = course._id || course.id;
    if (!courseId) {
      throw new Error("Course was created, but id is missing.");
    }

    // 2) lessons
    const lessonBoxes = Array.from(lessonsWrap.querySelectorAll(".lessonBox"));
    let order = 1;

    for (const box of lessonBoxes) {
      const lTitle = box.querySelector("[data-l-title]")?.value?.trim();
      const lContent = box.querySelector("[data-l-content]")?.value?.trim() || "";
      const lVideo = box.querySelector("[data-l-video]")?.value?.trim() || "";

      if (!lTitle) continue; // skip empty blocks

      await apiRequest(`/courses/${courseId}/lessons`, {
        method: "POST",
        body: {
          title: lTitle,
          content: lContent,
          videoUrl: lVideo,
          orderNumber: order++
        },
        auth: true
      });
    }

    // 3) quizzes
    const quizBoxes = Array.from(quizzesWrap.querySelectorAll(".quizBox"));
    for (const qBox of quizBoxes) {
      const qTitle = qBox.querySelector("[data-q-title]")?.value?.trim();
      if (!qTitle) continue;

      const taskBoxes = Array.from(qBox.querySelectorAll(".questionBox"));

      const tasks = taskBoxes.map((tBox) => {
        const question = tBox.querySelector("[data-t-question]")?.value?.trim() || "";

        const options = [0, 1, 2, 3].map((i) => {
          return tBox.querySelector(`[data-opt="${i}"]`)?.value?.trim() || "";
        });

        const checked = tBox.querySelector(`input[type="radio"]:checked`);
        const correctIndex = checked ? Number(checked.value) : -1;

        return { question, options, correctIndex };
      }).filter(t =>
        t.question &&
        t.options.every(o => o) &&
        t.correctIndex >= 0
      );

      if (!tasks.length) {
        // If quiz is empty/invalid, skip it
        continue;
      }

      await apiRequest(`/courses/${courseId}/quizzes`, {
        method: "POST",
        body: { title: qTitle, tasks },
        auth: true
      });
    }

    show("Published successfully!", true);

    // 4) redirect
    window.location.href = "courses.html";

  } catch (e) {
    show(e.message || "Publish failed");
    btnPublish.disabled = false;
    btnPublish.textContent = "Publish";
  }
};