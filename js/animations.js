/* =========================================================
   ANIMATIONS.JS
   Scroll-triggered reveal + animated counters
   ========================================================= */
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Scroll reveal ---
  const revealEls = document.querySelectorAll('[data-reveal]');
  const peaksGroup = document.querySelector('.peaks');

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    if (peaksGroup) peaksGroup.classList.add('is-visible');
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
    if (peaksGroup) observer.observe(peaksGroup);
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // --- Animated counters ---
  const counters = document.querySelectorAll('[data-counter]');
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    const duration = 1600;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(step);
  }

  if (counters.length) {
    if (prefersReducedMotion) {
      counters.forEach((el) => (el.textContent = el.getAttribute('data-target')));
    } else if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => counterObserver.observe(el));
    } else {
      counters.forEach((el) => (el.textContent = el.getAttribute('data-target')));
    }
  }
})();
