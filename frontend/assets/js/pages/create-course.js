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

(function guard() {
  if (!isLoggedIn()) {
    window.location.href = "/login?next=/create-course";
    return;
  }
  if (getRole() !== "instructor") {
    window.location.href = "/courses";
    return;
  }
})();

let lessonCount = 0;

function lessonBlockHTML(idx) {
  return `
    <div class="card lessonBox" data-lesson="${idx}" style="background:#fff; margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <h4 style="margin:0;">Lesson #${idx + 1}</h4>
        <button class="btn btnSmall" type="button" data-remove-lesson="${idx}">Remove</button>
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
    lessonsWrap.querySelector(`.lessonBox[data-lesson="${idx}"]`)?.remove();
  };
}

let quizCount = 0;

function quizBlockHTML(qIdx) {
  return `
    <div class="card quizBox" data-quiz="${qIdx}" style="background:#fff; margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <h4 style="margin:0;">Quiz #${qIdx + 1}</h4>
        <button class="btn btnSmall" type="button" data-remove-quiz="${qIdx}">Remove</button>
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
    <div class="card questionBox" data-question="${tIdx}" style="background:#fff;margin-top:10px;border:1px solid #eee;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <b>Question #${tIdx + 1}</b>
        <button class="btn btnSmall" type="button" data-remove-question="${qIdx}:${tIdx}">Remove</button>
      </div>

      <div class="form" style="margin-top:10px;">
        <input class="input" data-t-question placeholder="Question text" required />

        <div class="small" style="margin:8px 0 4px;">Options (choose correct):</div>

        ${[0,1,2,3].map(i => `
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

  quizzesWrap.querySelector(`[data-remove-quiz="${qIdx}"]`).onclick = () => {
    quizzesWrap.querySelector(`.quizBox[data-quiz="${qIdx}"]`)?.remove();
  };

  quizzesWrap.querySelector(`[data-add-question="${qIdx}"]`).onclick = () =>
    addQuestion(qIdx);

  addQuestion(qIdx);
}

function addQuestion(qIdx) {
  const quizBox = quizzesWrap.querySelector(`.quizBox[data-quiz="${qIdx}"]`);
  if (!quizBox) return;

  const wrap = quizBox.querySelector("[data-questions]");
  const tIdx = wrap.querySelectorAll(".questionBox").length;

  wrap.insertAdjacentHTML("beforeend", questionHTML(qIdx, tIdx));

  wrap.querySelector(`[data-remove-question="${qIdx}:${tIdx}"]`).onclick = () => {
    wrap.querySelector(`.questionBox[data-question="${tIdx}"]`)?.remove();
  };
}

btnAddLesson.onclick = addLessonBlock;
btnAddQuiz.onclick = addQuizBlock;

addLessonBlock();
addQuizBlock();


function validateBeforePublish() {
  if (!cTitle.value.trim() || !cDesc.value.trim()) {
    show("Course title and description are required.");
    return false;
  }

  for (const l of lessonsWrap.querySelectorAll(".lessonBox")) {
    if (!l.querySelector("[data-l-title]").value.trim()) {
      show("Each lesson must have a title.");
      return false;
    }
  }

  for (const q of quizzesWrap.querySelectorAll(".quizBox")) {
    if (!q.querySelector("[data-q-title]").value.trim()) {
      show("Each quiz must have a title.");
      return false;
    }

    for (const t of q.querySelectorAll(".questionBox")) {
      const question = t.querySelector("[data-t-question]").value.trim();
      const options = [...t.querySelectorAll("[data-opt]")].map(o => o.value.trim());
      const checked = t.querySelector('input[type="radio"]:checked');

      if (!question || options.some(o => !o) || !checked) {
        show("Each question must have text, 4 options and a correct answer.");
        return false;
      }
    }
  }

  return true;
}

btnPublish.onclick = async () => {
  try {
    show("");

    if (!validateBeforePublish()) return;

    btnPublish.disabled = true;
    btnPublish.textContent = "Publishing...";

    const course = await apiRequest("/courses", {
      method: "POST",
      body: {
        title: cTitle.value.trim(),
        description: cDesc.value.trim()
      },
      auth: true
    });

    const courseId = course._id || course.id;
    if (!courseId) throw new Error("Course id missing");

    let order = 1;
    for (const box of lessonsWrap.querySelectorAll(".lessonBox")) {
      await apiRequest(`/courses/${courseId}/lessons`, {
        method: "POST",
        body: {
          title: box.querySelector("[data-l-title]").value.trim(),
          content: box.querySelector("[data-l-content]").value.trim() || "",
          videoUrl: box.querySelector("[data-l-video]").value.trim() || "",
          orderNumber: order++
        },
        auth: true
      });
    }

    for (const qBox of quizzesWrap.querySelectorAll(".quizBox")) {
      const tasks = [...qBox.querySelectorAll(".questionBox")].map(tBox => {
        const checked = tBox.querySelector('input[type="radio"]:checked');
        return {
          question: tBox.querySelector("[data-t-question]").value.trim(),
          options: [0,1,2,3].map(i =>
            tBox.querySelector(`[data-opt="${i}"]`).value.trim()
          ),
          correctIndex: Number(checked.value)
        };
      });

      await apiRequest(`/courses/${courseId}/quizzes`, {
        method: "POST",
        body: {
          title: qBox.querySelector("[data-q-title]").value.trim(),
          tasks
        },
        auth: true
      });
    }

    show("Published successfully!", true);
    window.location.href = "courses";

  } catch (e) {
    show(e.message || "Publish failed");
    btnPublish.disabled = false;
    btnPublish.textContent = "Publish";
  }
};