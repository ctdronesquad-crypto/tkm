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
  const EMAILJS_PUBLIC_KEY = '_WJUX3SOcbkXnt9OE';
  const EMAILJS_SERVICE_ID = 'service_imh6c7p';
  const EMAILJS_TEMPLATE_ID = 'template_9ric7yq';
  const EMAILJS_NOTIFICATION_TEMPLATE_ID = 'template_2uwkj48';
  const MINISTRY_EMAIL = 'torchbearerskingdommovement@gmail.com';

  if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  const AUTO_REPLY_NOTES = {
    contact: 'A member of our team will respond to your message within 1-2 business days.',
    join: 'Welcome to the movement! Someone from our team will reach out with next steps shortly.',
    prayer: 'A member of our prayer team will be reaching out personally within 48 hours.',
    newsletter: 'You\'re now set to receive sermons, events, and Kingdom teaching in your inbox.'
  };

  const FORM_TYPE_LABELS = {
    contact: 'Contact',
    join: 'Join the Movement',
    prayer: 'Prayer Request',
    newsletter: 'Newsletter Signup'
  };

  function sendAutoReply({ name, email, formType }) {
    if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
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

  function buildNotificationDetailsHtml(formType, payload) {
    const fields = [];

    const addField = (label, value) => {
      const normalized = String(value ?? '').trim();
      if (!normalized) return;
      fields.push({ label, value: normalized });
    };

    const formName = payload.name || payload.fullName || '';
    const formEmail = payload.email || payload.contact || '';
    const formMessage = payload.message || payload.notes || payload.request || '';

    addField('Name', formName);
    addField('Email', formEmail);

    if (formType === 'partner') {
      addField('Phone', payload.phone || '');
      addField('Country', payload.country || '');
      addField('Organization', payload.organization || '');
      addField('Partnership Type', payload.partnershipType || '');
      addField('Message', formMessage);
    }

    if (formType === 'prayer') {
      addField('Phone', payload.phone || payload.number || '');
      addField('Country', payload.country || '');
      addField('Prayer Request', formMessage);
      addField('Seed Sowing', payload.seedSowing || '');
    }

    if (formType === 'event') {
      addField('Phone', payload.phone || '');
      addField('Date of Birth', payload.dob || '');
      addField('Location', payload.location || '');
      addField('Church / Ministry', payload.church || '');
      addField('Role at Church', payload.role || '');
      addField('Attendance Type', payload.attendance || '');
      addField('Notes / Prayer Request', formMessage);
    }

    if (formType === 'give') {
      addField('Contact', formEmail);
      addField('Giving Interest', formMessage || 'Giving interest submission');
    }

    if (formType === 'newsletter') {
      addField('Newsletter Email', formEmail);
    }

    if (!fields.length) {
      addField('Details', 'No additional details provided.');
    }

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 24px; background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; overflow:hidden;">
        ${fields.map((field) => `
          <tr>
            <td style="padding:18px 20px; border-bottom:1px solid #E2E8F0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#475569; width:180px; font-weight:bold;">${field.label}</td>
            <td style="padding:18px 20px; border-bottom:1px solid #E2E8F0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#0F172A; white-space:pre-wrap;">${field.value}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  function sendFormNotification({ payload, formType }) {
    if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      console.warn('EmailJS not configured yet; skipping ministry notification.');
      return Promise.resolve();
    }

    if (!EMAILJS_NOTIFICATION_TEMPLATE_ID || EMAILJS_NOTIFICATION_TEMPLATE_ID === 'YOUR_NOTIFICATION_TEMPLATE_ID') {
      console.warn('EmailJS notification template not configured yet; skipping ministry notification.');
      return Promise.resolve();
    }

    const normalized = {
      to_name: 'TKM Ministry Team',
      to_email: MINISTRY_EMAIL,
      form_type: FORM_TYPE_LABELS[formType] || 'Website',
      submitted_at: new Date().toLocaleString(),
      form_details: buildNotificationDetailsHtml(formType, payload)
    };

    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_NOTIFICATION_TEMPLATE_ID, normalized);
  }

  window.TKM = window.TKM || {};
  window.TKM.sendAutoReply = sendAutoReply;
  window.TKM.sendFormNotification = sendFormNotification;

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

  function setFormMessage(form, message, isError = false) {
    const messageEl = form?.querySelector('.form-message') || document.getElementById(`${form?.id}Message`);
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.color = isError ? '#dc2626' : '#166534';
  }

  function buildEmailParams({ formType, payload, recipientEmail, toName, isNotification = false }) {
    const base = {
      form_type: FORM_TYPE_LABELS[formType] || 'Website',
      name: payload.name || payload.fullName || 'Friend',
      email: payload.email || payload.contact || '',
      phone: payload.phone || payload.number || '',
      country: payload.country || '',
      organization: payload.organization || '',
      partnership_type: payload.partnershipType || '',
      seed_sowing: payload.seedSowing || '',
      message: payload.message || payload.notes || payload.request || '',
      custom_note: AUTO_REPLY_NOTES[formType] || ''
    };

    return {
      ...base,
      to_name: toName || base.name,
      to_email: recipientEmail || base.email || MINISTRY_EMAIL,
      reply_to: base.email,
      form_message: base.message,
      form_type_label: base.form_type,
      notification_type: isNotification ? 'ministry_notification' : 'auto_reply',
      ministry_email: MINISTRY_EMAIL
    };
  }

  async function sendViaEmailJS({ formType, payload, recipientEmail, toName, isNotification = false }) {
    if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      console.warn('EmailJS not configured yet; skipping email submission.');
      return;
    }

    const params = buildEmailParams({ formType, payload, recipientEmail, toName, isNotification });
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
  }

  /* ---- Website forms: send directly through EmailJS, no Netlify/Resend layer ---- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterMessage = document.getElementById('newsletterMessage');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      const email = emailInput.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        if (newsletterMessage) {
          newsletterMessage.textContent = 'Please enter a valid email address.';
          newsletterMessage.style.color = '#f87171';
        }
        emailInput.focus();
        return;
      }

      const submitBtn = newsletterForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      if (newsletterMessage) newsletterMessage.textContent = '';

      try {
        await Promise.all([
          sendFormNotification({
            formType: 'newsletter',
            payload: { name: 'Friend', email }
          }),
          sendAutoReply({
            name: 'Friend',
            email,
            formType: 'newsletter'
          })
        ]);

        if (newsletterMessage) {
          newsletterMessage.textContent = "You're subscribed. Welcome to the movement.";
          newsletterMessage.style.color = '';
        }
        newsletterForm.reset();
      } catch (err) {
        if (newsletterMessage) {
          newsletterMessage.textContent = 'Something went wrong. Please try again shortly.';
          newsletterMessage.style.color = '#f87171';
        }
        console.error('Newsletter EmailJS send failed:', err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  const formConfigs = [
    {
      form: document.getElementById('partnerForm'),
      formType: 'partner',
      successMessage: 'Thank you for partnering with us. A confirmation email has been sent to your inbox.',
      validate: ({ name, email, message }) => !!name && !!email && !!message
    },
    {
      form: document.getElementById('givingForm'),
      formType: 'give',
      successMessage: 'Thank you. We have received your giving enquiry and a confirmation email has been sent to your contact email.',
      validate: ({ name, email }) => !!name && !!email
    },
    {
      form: document.getElementById('eventRegistrationForm'),
      formType: 'event',
      successMessage: 'Thank you. Your registration has been received and a confirmation email has been sent to you.',
      validate: ({ name, email }) => !!name && !!email
    },
    {
      form: document.getElementById('prayerForm'),
      formType: 'prayer',
      successMessage: 'Thank you for submitting your prayer request. A member of our prayer team will reach out to you.',
      validate: ({ name, message }) => !!name && !!message,
      transformPayload: (payload) => ({
        ...payload,
        name: payload.name || '',
        email: payload.email || '',
        message: payload.request || payload.message || '',
        phone: payload.number || payload.phone || '',
        country: payload.country || '',
        seedSowing: payload.seedSowing || ''
      })
    }
  ];

  formConfigs.forEach(({ form, formType, successMessage, validate, transformPayload }) => {
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const prepared = transformPayload ? transformPayload(payload) : payload;
      const normalized = {
        ...prepared,
        name: String(prepared.name || prepared.fullName || '').trim(),
        email: String(prepared.email || prepared.contact || '').trim(),
        message: String(prepared.message || prepared.notes || prepared.request || '').trim(),
        phone: String(prepared.phone || prepared.number || '').trim(),
        country: String(prepared.country || '').trim(),
        organization: String(prepared.organization || '').trim(),
        partnershipType: String(prepared.partnershipType || '').trim(),
        seedSowing: String(prepared.seedSowing || '').trim()
      };

      if (validate && !validate(normalized)) {
        setFormMessage(form, 'Please complete the required fields before submitting.', true);
        return;
      }

      const messageEl = form.querySelector('.form-message') || document.getElementById(`${form.id}Message`);
      if (messageEl) {
        messageEl.textContent = '';
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent || '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        if (normalized.email) {
          await Promise.all([
            sendFormNotification({
              formType,
              payload: { ...normalized, name: normalized.name || 'Friend', email: normalized.email }
            }),
            sendAutoReply({
              name: normalized.name || 'Friend',
              email: normalized.email,
              formType
            })
          ]);
        }

        form.reset();
        setFormMessage(form, successMessage || 'Thank you. Your request has been received.', false);
      } catch (error) {
        setFormMessage(form, error.message || 'Something went wrong. Please try again shortly.', true);
        console.error('Form EmailJS send failed:', error);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  });

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
