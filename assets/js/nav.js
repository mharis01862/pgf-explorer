document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const topnavLinks = document.getElementById("topnavLinks");

  if (menuToggle && topnavLinks) {
    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("is-active");
      topnavLinks.classList.toggle("is-active");
    });

    // Close menu when clicking a link
    topnavLinks.querySelectorAll(".topnav__link").forEach(link => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("is-active");
        topnavLinks.classList.remove("is-active");
      });
    });
  }
});
