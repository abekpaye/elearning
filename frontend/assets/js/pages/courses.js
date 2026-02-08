import { apiRequest } from "../api.js";
import { isLoggedIn } from "../auth.js";
import { getRole } from "../auth.js";

const instructorActions = document.getElementById("instructorActions");
const list = document.getElementById("coursesList");
const msg = document.getElementById("msg");

let enrolledIds = [];

function show(text, ok=false){
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

function escapeHtml(s=""){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

async function loadEnrollments() {
  if (!isLoggedIn()) return [];
  const data = await apiRequest("/enrollments/my", { auth:true });
  return data.map(e => e.courseId?._id || e.courseId);
}

async function enroll(courseId) {
  await apiRequest("/enrollments", {
    method:"POST",
    body:{ courseId },
    auth:true
  });
  window.location.href = `course.html?id=${courseId}`;
}

function render(courses) {
  const role = getRole();
  const isInstructor = role === "instructor";

  list.innerHTML = courses.map(c => {
    const id = c._id || c.id;
    const enrolled = enrolledIds.includes(id);

    const action = isInstructor || enrolled ? "open" : "enroll";
    const label = isInstructor || enrolled ? "Open course" : "Enroll";

    return `
      <section class="courseHero">
        <div>
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.description)}</p>

          <button class="btn"
            data-id="${id}"
            data-action="${action}">
            ${label}
          </button>
        </div>
      </section>
    `;
  }).join("");

  document.querySelectorAll("button[data-id]").forEach(btn => {
    const id = btn.dataset.id;

    if (btn.dataset.action === "open") {
      btn.onclick = () =>
        window.location.href = `/course?id=${id}`;
    } else {
      btn.onclick = () => enroll(id);
    }
  });
}

async function loadCourses() {
  try {
    show("Loading...", true);
    const data = await apiRequest("/courses", { auth: true });
    const courses = data.courses || data;
    const role = getRole();
if (instructorActions) {
  instructorActions.style.display = role === "instructor" ? "block" : "none";
}

    enrolledIds = await loadEnrollments();
    render(courses);
    show("");
  } catch (e) {
    show(e.message || "Failed to load courses");
  }
}

loadCourses();
