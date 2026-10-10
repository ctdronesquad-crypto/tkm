/* =========================================================
   APP.JS
   Global site behavior: scroll progress bar, back-to-top,
   button ripple, newsletter form validation, scroll indicator,
   scripture-of-the-day rotation.
   ========================================================= */
(function () {

  /* =========================================================
     EMAILJS — auto-reply confirmations sent to form submitters
     =========================================================
     Fill in your own values from the EmailJS dashboard:
     Account -> General (Public Key) and Email Services / Templates
     (Service ID, Template ID). The Public Key is safe to expose in
     client-side code by design — EmailJS is built for this.
     ========================================================= */
  const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
  const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

  if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  // Default "custom_note" copy per form type — matches the {{custom_note}}
  // variable in the auto-reply.html template. Add an entry here whenever
  // a new form is built (e.g. Join, Volunteer).
  const AUTO_REPLY_NOTES = {
    contact: "A member of our team will respond to your message within 1-2 business days.",
    join: "Welcome to the movement! Someone from our team will reach out with next steps shortly.",
    prayer: "A member of our prayer team will be reaching out personally within 48 hours.",
    newsletter: "You're now set to receive sermons, events, and Kingdom teaching in your inbox."
  };

  const FORM_TYPE_LABELS = {
    contact: 'Contact',
    join: 'Join the Movement',
    prayer: 'Prayer Request',
    newsletter: 'Newsletter Signup'
  };

  /**
   * Sends a branded auto-reply confirmation to whoever submitted a form.
   * This is separate from (and in addition to) the admin notification
   * email sent server-side via the Netlify function + Resend.
   *
   * @param {Object} params
   * @param {string} params.name       - submitter's name
   * @param {string} params.email      - submitter's email
   * @param {string} params.formType   - 'contact' | 'join' | 'prayer' | 'newsletter'
   * @returns {Promise} resolves/rejects based on the EmailJS send result
   */
  function sendAutoReply({ name, email, formType }) {
    if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      // EmailJS not configured yet — fail silently so forms still work
      // while setup is in progress. Swap in real keys above to activate.
      console.warn('EmailJS not configured yet; skipping auto-reply email.');
      return Promise.resolve();
    }

    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_name: name || 'Friend',
      to_email: email,
      form_type: FORM_TYPE_LABELS[formType] || 'Website',
      custom_note: AUTO_REPLY_NOTES[formType] || ''
    });
  }

  // Exposed globally so donate.js and future form pages (Join, Contact,
  // Prayer Request) can call TKM.sendAutoReply(...) without duplicating
  // this setup on every page.
  window.TKM = window.TKM || {};
  window.TKM.sendAutoReply = sendAutoReply;

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

  /* ---- Newsletter form: client-side check + real submission via Netlify Function ---- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterMessage = document.getElementById('newsletterMessage');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
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

      const submitBtn = newsletterForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      newsletterMessage.textContent = '';

      try {
        const response = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType: 'newsletter',
            name: 'Newsletter Subscriber',
            email
          })
        });

        if (!response.ok) throw new Error('Request failed');

        // Admin notification (Resend) succeeded. Fire the auto-reply to the
        // subscriber too. This is intentionally non-blocking for the UI —
        // if EmailJS has a hiccup, the subscription itself still succeeded,
        // so we don't want to show an error for what's really a nice-to-have.
        window.TKM.sendAutoReply({
          name: 'Friend',
          email,
          formType: 'newsletter'
        }).catch((err) => console.warn('Auto-reply email failed:', err));

        newsletterMessage.textContent = "You're subscribed. Welcome to the movement.";
        newsletterMessage.style.color = '';
        newsletterForm.reset();
      } catch (err) {
        newsletterMessage.textContent = 'Something went wrong. Please try again shortly.';
        newsletterMessage.style.color = '#f87171';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  /* ---- Scripture of the day ----
     Fetches a random verse from bible-api.com (free, no key required)
     and caches it in localStorage for the current date, so every
     visitor sees the same verse all day and it changes once every
     24 hours. Falls back to a hardcoded list if the API is unreachable. */
  const FALLBACK_SCRIPTURES = [
    { text: 'Arise, shine; for thy light is come, and the glory of the LORD is risen upon thee.', ref: 'Isaiah 60:1' },
    { text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.', ref: 'Matthew 5:16' },
    { text: 'Thy kingdom come. Thy will be done in earth, as it is in heaven.', ref: 'Matthew 6:10' },
    { text: 'The kingdoms of this world are become the kingdoms of our Lord, and of his Christ.', ref: 'Revelation 11:15' }
  ];

  const scriptureEl = document.getElementById('scriptureText');

  function renderScripture(text, ref) {
    if (scriptureEl) scriptureEl.textContent = `"${text.trim()}" — ${ref}`;
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function showFallbackScripture() {
    const dayIndex = new Date().getDate() % FALLBACK_SCRIPTURES.length;
    const pick = FALLBACK_SCRIPTURES[dayIndex];
    renderScripture(pick.text, pick.ref);
  }

  if (scriptureEl) {
    const cacheKey = 'tkm_scripture_of_the_day';
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey));
    } catch (err) {
      cached = null;
    }

    if (cached && cached.date === todayKey() && cached.text && cached.ref) {
      // Already fetched today's verse — reuse it, no network call needed.
      renderScripture(cached.text, cached.ref);
    } else {
      // Need a new verse for today.
      fetch('https://bible-api.com/data/web/random')
        .then((res) => {
          if (!res.ok) throw new Error('Bible API request failed');
          return res.json();
        })
        .then((data) => {
          const verse = data && data.random_verse;
          if (!verse || !verse.text) throw new Error('Unexpected response shape');
          const ref = `${verse.book} ${verse.chapter}:${verse.verse}`;
          renderScripture(verse.text, ref);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ date: todayKey(), text: verse.text, ref }));
          } catch (err) { /* localStorage unavailable — non-fatal, just skip caching */ }
        })
        .catch(() => {
          // API down or blocked — use the hardcoded fallback so the strip never breaks.
          showFallbackScripture();
        });
    }
  }

  /* ---- Footer year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
