/* ============================================================
   INIT
============================================================ */

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

/* ============================================================
   NAV — sticky scroll effect + mobile menu
============================================================ */

const nav = document.getElementById('nav');
const burger = document.querySelector('.nav__burger');

// Add 'scrolled' class when page scrolls down — triggers frosted glass bg
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Mobile menu — inject a simple overlay on first click, then toggle it
let mobileMenu = null;

burger.addEventListener('click', () => {
  const isOpen = burger.getAttribute('aria-expanded') === 'true';

  // Build mobile menu once on first click
  if (!mobileMenu) {
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'nav__mobile';
    mobileMenu.innerHTML = `
      <a href="#work"     class="mobile-link">Work</a>
      <a href="#services" class="mobile-link">Services</a>
      <a href="#about"    class="mobile-link">About</a>
      <a href="#contact"  class="mobile-link">Let's talk</a>
    `;
    document.body.appendChild(mobileMenu);

    // Close when any mobile link is clicked
    mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
});

function openMobileMenu() {
  mobileMenu.classList.add('open');
  burger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  // Animate burger to X
  const spans = burger.querySelectorAll('span');
  spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
  spans[1].style.transform = 'rotate(-45deg) translate(4px, -4px)';
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  // Restore burger lines
  const spans = burger.querySelectorAll('span');
  spans[0].style.transform = '';
  spans[1].style.transform = '';
}

/* ============================================================
   SCROLL REVEAL — IntersectionObserver
============================================================ */

// Select all elements with class 'reveal' and watch when they enter viewport
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Small delay stagger for sibling elements in the same parent
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
      const index = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${index * 60}ms`;

      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target); // Animate once only
    }
  });
}, {
  threshold: 0.12,       // Trigger when 12% of element is visible
  rootMargin: '0px 0px -40px 0px' // Slightly before hitting viewport bottom
});

revealEls.forEach(el => revealObserver.observe(el));

/* ============================================================
   ACTIVE NAV LINK — highlight current section
============================================================ */

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Remove active class from all links
      navLinks.forEach(link => link.removeAttribute('data-active'));
      // Add to the matching link
      const activeLink = document.querySelector(`.nav__links a[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.setAttribute('data-active', 'true');
    }
  });
}, {
  rootMargin: '-40% 0px -40% 0px' // Trigger when section is in the middle 20% of viewport
});

sections.forEach(s => sectionObserver.observe(s));

/* ============================================================
   HERO ROLE SWITCHER — GSAP
============================================================ */

const role1 = document.querySelector('.role-1');
const role2 = document.querySelector('.role-2');

if (role1 && role2 && typeof gsap !== 'undefined') {
  const hold  = 4;
  const slide = 0.65;

  // Set initial positions
  gsap.set(role1, { y: '0%',  opacity: 1 });
  gsap.set(role2, { y: '60%', opacity: 0, skewY: 5 });

  const roleTl = gsap.timeline({ repeat: -1, paused: true });

  roleTl
    // Reset role-2 on each loop
    .set(role2, { y: '60%', opacity: 0, skewY: 5 })
    // Hold, then role-1 rises out while role-2 rises in
    .to(role1, { y: '-25%', opacity: 0,            duration: slide, ease: 'power4.in'  }, `+=${hold}`)
    .to(role2, { y: '0%',   opacity: 1, skewY: 0,  duration: slide, ease: 'power4.out' }, '<')
    // Snap role-1 back below, ready for re-entry
    .set(role1, { y: '60%', opacity: 0, skewY: 5 })
    // Hold, then role-2 rises out while role-1 rises in
    .to(role2, { y: '-25%', opacity: 0,            duration: slide, ease: 'power4.in'  }, `+=${hold}`)
    .to(role1, { y: '0%',   opacity: 1, skewY: 0,  duration: slide, ease: 'power4.out' }, '<');

  const heroVisibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        roleTl.play();
      } else {
        roleTl.pause();
      }
    });
  }, { threshold: 0.1 });

  heroVisibilityObserver.observe(document.getElementById('hero'));
}

/* ============================================================
   HERO VIDEO BACKGROUND — pause off-screen, blur on scroll
============================================================ */

const heroEl      = document.getElementById('hero');
const videoWrap   = document.querySelector('.hero__video-wrap');
const videoEl     = document.querySelector('.hero__video');
const videoOverlay = document.querySelector('.hero__video-overlay');

if (videoEl && videoWrap && heroEl) {
  // Skip scroll effect for users who prefer reduced motion
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pause video when hero is off-screen — saves CPU / battery
  const videoPauseObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, { threshold: 0 });
  videoPauseObserver.observe(heroEl);

  if (!reducedMotion) {
    let rafPending = false;

    function updateVideoScroll() {
      rafPending = false;
      const heroH   = heroEl.offsetHeight;
      // progress: 0 = hero fully in view, 1 = hero fully scrolled past 65% of its height
      const progress = Math.min(1, Math.max(0, window.scrollY / (heroH * 0.65)));

      // Blur the video (oversized wrap hides the blur edge bleed)
      videoWrap.style.filter = progress > 0 ? `blur(${(progress * 20).toFixed(1)}px)` : '';

      // Deepen the overlay as background fades out
      if (videoOverlay) {
        videoOverlay.style.background = `rgba(3, 3, 50, ${(0.45 + progress * 0.45).toFixed(3)})`;
      }
    }

    window.addEventListener('scroll', () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateVideoScroll);
      }
    }, { passive: true });
  }
}