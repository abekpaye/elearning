import { apiRequest } from "../api.js";
import { isLoggedIn } from "../auth.js";

const list = document.getElementById("coursesList");
const msg = document.getElementById("msg");

function show(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? "green" : "crimson";
}

function escapeHtml(s = "") {
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// ✅ Frontend auto-image mapping (no backend changes needed)
function pickImage(course) {
  const t = (course.title || "").toLowerCase();

  if (t.includes("web") || t.includes("html") || t.includes("css") || t.includes("javascript")) return "assets/img/web.jpg";
  if (t.includes("java")) return "assets/img/java.jpg";
  if (t.includes("c++") || t.includes("cpp")) return "assets/img/cpp.jpg";
  if (t.includes("python")) return "assets/img/python.jpg";
  if (t.includes("database") || t.includes("mongodb") || t.includes("sql")) return "assets/img/db.jpg";

  return "assets/img/default.jpg";
}

function goStart(courseId) {
  if (!isLoggedIn()) {
    // after login we can return user back to the course
    window.location.href = `login.html?next=${encodeURIComponent(`course.html?id=${courseId}`)}`;
    return;
  }
  window.location.href = `course.html?id=${courseId}`;
}

function render(courses) {
  if (!courses.length) {
    list.innerHTML = `<div class="small">No courses available.</div>`;
    return;
  }

  list.innerHTML = courses.map((c) => {
    const id = c._id || c.id;
    const title = escapeHtml(c.title || "Untitled");
    const desc = escapeHtml(c.description || "No description");
    const img = pickImage(c);

    // simple bullets (can be static, looks good for demo)
    const bullets = `
      <ul class="bullets">
        <li>Understand core programming concepts</li>
        <li>Practice with interactive projects</li>
        <li>Learn modern tools and technologies</li>
      </ul>
    `;

    return `
      <section class="courseHero">
        <div class="courseHero__imgWrap">
          <img class="courseHero__img" src="${img}" alt="${title}" />
        </div>

        <div>
          <h3 class="courseHero__title">${title}</h3>
          <p class="courseHero__desc">${desc}</p>
          ${bullets}

          <button class="btn startBtn" data-start="${id}">Start Now</button>
        </div>
      </section>
    `;
  }).join("");

  document.querySelectorAll("[data-start]").forEach(btn => {
    btn.addEventListener("click", () => goStart(btn.dataset.start));
  });
}

async function loadCourses() {
  try {
    show("Loading courses...", true);
    const data = await apiRequest("/courses");
    const courses = Array.isArray(data) ? data : (data.courses || []);
    show("");
    render(courses);
  } catch (err) {
    show(err.message || "Failed to load courses");
  }
}

loadCourses();
