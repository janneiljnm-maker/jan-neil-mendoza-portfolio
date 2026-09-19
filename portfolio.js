(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const nav = document.getElementById("main-nav");
  const menu = document.querySelector(".menu-toggle");
  const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = navLinks.map(link => document.querySelector(link.hash));
  const mobile = matchMedia("(max-width: 760px)");

  function setMenu(open, returnFocus = false) {
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", open);
    if (returnFocus) menu.focus();
  }

  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  navLinks.forEach(link => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") setMenu(false, true);
  });
  document.addEventListener("click", event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  header.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      if (!header.contains(document.activeElement)) setMenu(false);
    });
  });
  mobile.addEventListener("change", () => setMenu(false));

  let scheduled = false;
  function updateNavigation() {
    scheduled = false;
    header.classList.toggle("scrolled", scrollY > 35);
    let active = "";
    for (const section of sections) {
      if (section.getBoundingClientRect().top < innerHeight * 0.4) active = section.id;
    }
    navLinks.forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  addEventListener("scroll", () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateNavigation);
    }
  }, { passive: true });
  addEventListener("resize", updateNavigation, { passive: true });
  updateNavigation();

  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("has-js");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });
    document.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
  }

  const copy = document.getElementById("copy-email");
  const status = document.getElementById("copy-status");
  let resetCopy;
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("janneil.jnm@gmail.com");
      copy.textContent = "Copied!";
      status.textContent = "Email address copied to clipboard.";
    } catch {
      copy.textContent = "Select email";
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.email-row > a').firstChild);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Select and copy the highlighted email address.";
    }
    clearTimeout(resetCopy);
    resetCopy = setTimeout(() => { copy.textContent = "Copy email"; }, 2500);
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
