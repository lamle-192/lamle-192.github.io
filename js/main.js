/* ============================================================
   INIT
============================================================ */

// Set current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================================================
   SMOOTH SCROLL — GSAP ScrollSmoother
============================================================ */
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

ScrollSmoother.create({
  wrapper: '#smooth-wrapper',
  content: '#smooth-content',
  smooth: 1.2,
  effects: true,
});

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
   HERO — intro reveal + scroll-driven video unblur
============================================================ */

gsap.registerPlugin(ScrollTrigger);

const heroEl       = document.getElementById('hero');
const heroCurtain  = document.querySelector('.hero__curtain');
const videoWrap    = document.querySelector('.hero__video-wrap');
const videoEl      = document.querySelector('.hero__video');
const videoOverlay = document.querySelector('.hero__video-overlay');
const heroInner    = document.querySelector('.hero__inner');
const heroTitle    = document.querySelector('.hero__title');
const heroSub      = document.querySelector('.hero__sub');

const BLUR_INIT = 42;

if (heroEl) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    if (heroCurtain) heroCurtain.style.display = 'none';
    if (heroTitle)   gsap.set(heroTitle, { opacity: 1, y: 0 });
    if (heroSub)     gsap.set(heroSub,   { opacity: 1, y: 0 });
    if (videoWrap)   { videoWrap.style.opacity = '1'; videoWrap.style.filter = ''; }
    if (videoEl)     videoEl.play().catch(() => {});
  } else {

    // ── INTRO TIMELINE ──────────────────────────────────────────
    if (videoEl) {
      videoEl.play().catch(() => {});
      gsap.set(videoWrap, { filter: `blur(${BLUR_INIT}px)` });
    }

    const intro = gsap.timeline({ delay: 0.15 });

    // 1. Curtain wipes upward — reveals dark-blue hero background
    intro.to(heroCurtain, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.1,
      ease: 'expo.inOut',
      onComplete() { heroCurtain.style.display = 'none'; }
    });

    // 2. Video fades in (still blurred) as curtain finishes
    intro.to(videoWrap, {
      opacity: 1,
      duration: 1.4,
      ease: 'power2.out'
    }, '-=0.55');

    // 3. Title slides up
    intro.to(heroTitle, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out'
    }, '-=0.9');

    // 4. Subtitle
    intro.to(heroSub, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power3.out'
    }, '-=0.65');

    // ── SCROLL-DRIVEN UNBLUR (pinned hero) ──────────────────────
    ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: '+=100%',
      pin: true,
      scrub: 1.8,
      onUpdate(self) {
        const p = self.progress;

        // Text: fade out + rise in first 45% of scroll
        const textAlpha = Math.max(0, 1 - p / 0.45);
        gsap.set(heroInner, {
          opacity: textAlpha,
          y: -55 * (1 - textAlpha)
        });

        // Video: unblur across full scroll range
        const blur = BLUR_INIT * Math.pow(1 - p, 1.6);
        videoWrap.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : '';

        // Overlay fades out in second half
        if (videoOverlay) {
          videoOverlay.style.opacity = Math.max(0, 1 - p * 1.6).toFixed(3);
        }
      }
    });

    // Pause video when hero is off-screen
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (videoEl) e.isIntersecting ? videoEl.play().catch(() => {}) : videoEl.pause();
      });
    }, { threshold: 0 }).observe(heroEl);
  }
}

/* ============================================================
   HERO CIRCULAR TEXT — idle spin + scroll rotation
============================================================ */

const circleEl   = document.getElementById('hero-circle-text');
const circleWrap = document.querySelector('.hero__circle');

if (circleEl && circleWrap && typeof CircleType !== 'undefined') {
  new CircleType(circleEl).radius(68);

  let totalRotation = 0;  // accumulated degrees from both idle + scroll
  let lastScrollY    = 0;
  let isScrolling    = false;
  let idleTween      = null;
  let scrollStopTimer;

  // Idle: slow continuous spin via GSAP ticker
  function startIdle() {
    isScrolling = false;
    idleTween = gsap.to({}, {
      duration: 999,
      onUpdate() {
        totalRotation += 0.03; // ~1.8 deg/frame at 60fps ≈ gentle spin
        gsap.set(circleWrap, { rotation: totalRotation });
      }
    });
  }

  function stopIdle() {
    if (idleTween) { idleTween.kill(); idleTween = null; }
  }

  // Scroll: add rotation proportional to scroll delta so it blends with idle offset
  window.addEventListener('scroll', () => {
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;

    if (!isScrolling) {
      isScrolling = true;
      stopIdle();
    }

    totalRotation += delta * 0.5;

    gsap.to(circleWrap, {
      rotation: totalRotation,
      duration: 0.6,
      ease: 'power3.out',
      overwrite: true
    });

    clearTimeout(scrollStopTimer);
    scrollStopTimer = setTimeout(startIdle, 1200);
  }, { passive: true });

  // Kick off idle spin on load
  startIdle();
}