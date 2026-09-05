/* =========================================================
   NAVBAR.JS
   Sticky navbar background + mobile menu toggle
   ========================================================= */
(function () {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMobileMenu() {
    if (!mobileMenu || !navToggle) return;
    mobileMenu.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function updateNavbarState() {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  }

  updateNavbarState();
  window.addEventListener('scroll', updateNavbarState, { passive: true });

  if (navToggle && mobileMenu) {
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'mobile-menu__close';
    closeButton.setAttribute('aria-label', 'Close menu');
    closeButton.innerHTML = '<span aria-hidden="true">›</span>';
    closeButton.addEventListener('click', closeMobileMenu);

    mobileMenu.prepend(closeButton);

    navToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        closeMobileMenu();
      }
    });
  }
})();
