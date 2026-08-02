/* =========================================================
   APP.JS
   Global site behavior: scroll progress bar, back-to-top,
   button ripple, newsletter form validation, scroll indicator,
   scripture-of-the-day rotation.
   ========================================================= */
(function () {

  /* ---- Scroll progress bar ---- */
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress() {
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  /* ---- Back to top button ---- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Scroll indicator (hero) ---- */
  const scrollIndicator = document.getElementById('scrollIndicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      const heroHeight = document.querySelector('.hero')?.offsetHeight || window.innerHeight;
      window.scrollTo({ top: heroHeight - 80, behavior: 'smooth' });
    });
  }

  /* ---- Button ripple effect ---- */
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    });
  });

  /* ---- Newsletter form validation ---- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterMessage = document.getElementById('newsletterMessage');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      const email = emailInput.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        newsletterMessage.textContent = 'Please enter a valid email address.';
        newsletterMessage.style.color = '#f87171';
        emailInput.focus();
        return;
      }

      newsletterMessage.textContent = "You're subscribed. Welcome to the movement.";
      newsletterMessage.style.color = '';
      newsletterForm.reset();
    });
  }

  /* ---- Scripture of the day rotation ---- */
  const scriptures = [
    { text: '"Arise, shine; for thy light is come, and the glory of the LORD is risen upon thee."', ref: 'Isaiah 60:1' },
    { text: '"Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven."', ref: 'Matthew 5:16' },
    { text: '"Thy kingdom come. Thy will be done in earth, as it is in heaven."', ref: 'Matthew 6:10' },
    { text: '"The kingdoms of this world are become the kingdoms of our Lord, and of his Christ."', ref: 'Revelation 11:15' }
  ];
  const scriptureEl = document.getElementById('scriptureText');
  if (scriptureEl) {
    const dayIndex = new Date().getDate() % scriptures.length;
    const pick = scriptures[dayIndex];
    scriptureEl.textContent = `${pick.text} — ${pick.ref}`;
  }

  /* ---- Footer year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
