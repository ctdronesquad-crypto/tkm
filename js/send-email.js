// netlify/functions/send-email.js
//
// A single, reusable serverless function that handles every form on the
// TKM site (Join, Contact, Prayer Request, Newsletter, etc.) by sending
// an email via Resend. The Resend API key lives only in Netlify's
// environment variables (RESEND_API_KEY) and is never exposed to the browser.
//
// Expects a JSON POST body like:
// {
//   "formType": "contact" | "join" | "prayer" | "newsletter",
//   "name": "Jane Doe",
//   "email": "jane@example.com",
//   "message": "..."
//   ... any other fields the form collects
// }

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Where each form type's notification should be delivered.
// Update these to your real ministry inboxes.
const RECIPIENTS = {
  contact: 'torchbearerskingdommovement@gmail.com',
  join: 'torchbearerskingdommovement@gmail.com',
  prayer: 'torchbearerskingdommovement@gmail.com',
  newsletter: 'torchbearerskingdommovement@gmail.com',
  default: 'torchbearerskingdommovement@gmail.com'
};

// Change this once your domain is verified in Resend.
// Until then, Resend only allows sending FROM onboarding@resend.dev.
const FROM_ADDRESS = 'TKM Website <onboarding@resend.dev>';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

exports.handler = async (event) => {
  // Only accept POST requests.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body.' })
    };
  }

  const { formType, name, email, message, ...rest } = payload;

  // --- Basic server-side validation ---
  // Never trust client-side validation alone; the function is a public
  // endpoint and can be called directly, bypassing any HTML form.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailPattern.test(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'A valid email address is required.' })
    };
  }
  if (!name || !name.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Name is required.' })
    };
  }

  const recipient = RECIPIENTS[formType] || RECIPIENTS.default;
  const subject = `New ${formType || 'website'} submission from ${name}`;

  // Build a simple HTML email body from whatever fields were submitted.
  const extraFieldsHtml = Object.entries(rest)
    .map(([key, value]) => `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`)
    .join('');

  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${message ? `<p><strong>Message:</strong><br>${escapeHtml(message)}</p>` : ''}
    ${extraFieldsHtml}
  `;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: recipient,
        reply_to: email, // lets staff hit "reply" and respond straight to the person
        subject,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Email service failed to send.' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: data.id })
    };
  } catch (err) {
    console.error('Unexpected error sending email:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected server error.' })
    };
  }
};
