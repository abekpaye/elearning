import { apiRequest } from "../api.js";
import { getRole, isLoggedIn } from "../auth.js";

const msg = document.getElementById("msg");
const roleLine = document.getElementById("roleLine");
const progressList = document.getElementById("studentProgressList");

const studentBox = document.getElementById("studentBox");
const instructorBox = document.getElementById("instructorBox");
const courseSelect = document.getElementById("courseSelect");
const courseStats = document.getElementById("courseStats");

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
  if (role === "instructor") {
    loadInstructorCourses();
  }

})();

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

  async function loadInstructorCourses() {
  try {
    const courses = await apiRequest("/courses/my", { auth: true });

    if (!courses.length) {
      courseStats.innerHTML =
        `<div class="small">You haven't created any courses yet.</div>`;
      return;
    }

    courseSelect.innerHTML =
      `<option value="">Select course</option>` +
      courses
        .map(
          c => `<option value="${c._id}">${esc(c.title)}</option>`
        )
        .join("");
  } catch (e) {
    show(e.message || "Failed to load instructor courses");
  }
}

courseSelect?.addEventListener("change", async () => {
  const courseId = courseSelect.value;
  if (!courseId) {
    courseStats.innerHTML = "";
    return;
  }

  try {
    courseStats.innerHTML = "Loading...";

    const engagement = await apiRequest(
      `/analytics/course-engagement?courseId=${courseId}`,
      { auth: true }
    );

    const topStudents = await apiRequest(
      `/analytics/courses/${courseId}/top-students`,
      { auth: true }
    );

    renderCourseStats(engagement[0], topStudents);
  } catch (e) {
    courseStats.innerHTML = `
      <div class="small" style="color:crimson;">
        ${e.message || "Failed to load analytics"}
      </div>
    `;
  }
});

function renderCourseStats(stats, topStudents = []) {
  if (!stats) {
    courseStats.innerHTML =
      `<div class="small">No analytics data yet.</div>`;
    return;
  }

  const {
    studentsCount = 0,
    avgProgress = 0,
    activeStudents = 0
  } = stats;

  courseStats.innerHTML = `
    <div class="statBox">
      <div class="statRow">
        <span>Students enrolled</span>
        <b>${studentsCount}</b>
      </div>

      <div class="statRow">
        <span>Average progress</span>
        <b>${avgProgress}%</b>
      </div>

      <div class="statRow">
        <span>Active students</span>
        <b>${activeStudents}</b>
      </div>

      <h5 style="margin:12px 0 6px;">🏆 Top 3 students</h5>

      ${
        Array.isArray(topStudents) && topStudents.length
          ? topStudents
              .map(
                (s, i) => `
                <div class="statRow">
                  <span>#${i + 1} ${esc(s.name)}</span>
                  <b>${s.avgScore}</b>
                </div>
              `
              )
              .join("")
          : `<div class="small">No quiz attempts yet.</div>`
      }
    </div>
  `;
}