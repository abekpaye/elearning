document.addEventListener("DOMContentLoaded", () => {
  const navList = document.querySelector(".navbar-nav");
  if (!navList) return;

  const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

  if (loggedUser) {
    const li = navList.querySelector('a[href="page5.html"]')?.closest("li");
    if (li) {
      li.innerHTML = `
        <div class="d-flex align-items-center user-info-nav ms-3">
          <i class="fas fa-user-circle fs-4 me-2 text-white"></i>
          <span class="fw-semibold text-white me-3">Hi, ${loggedUser.firstName}</span>
          <button id="logoutBtn" class="btn btn-sm btn-light fw-semibold">Log Out</button>
        </div>
      `;
    }
  }

  navList.addEventListener("click", (e) => {
    if (e.target.id === "logoutBtn") {
      localStorage.removeItem("loggedUser");
      window.location.reload();
    }
  });
});