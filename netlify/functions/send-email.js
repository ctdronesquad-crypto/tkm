const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const RECIPIENTS = {
  contact: 'torchbearerskingdommovement@gmail.com',
  join: 'torchbearerskingdommovement@gmail.com',
  prayer: 'torchbearerskingdommovement@gmail.com',
  newsletter: 'torchbearerskingdommovement@gmail.com',
  partner: 'torchbearerskingdommovement@gmail.com',
  give: 'torchbearerskingdommovement@gmail.com',
  event: 'torchbearerskingdommovement@gmail.com',
  default: 'torchbearerskingdommovement@gmail.com'
};

const FROM_ADDRESS = process.env.FROM_ADDRESS || 'TKM Website <onboarding@resend.dev>';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prettyKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildHtmlRows(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `<p><strong>${escapeHtml(prettyKey(key))}:</strong> ${escapeHtml(String(value))}</p>`)
    .join('');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body.' })
    };
  }

  const { formType, name, email, message, ...rest } = payload;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailPattern.test(String(email))) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'A valid email address is required.' })
    };
  }

  if (!name || !String(name).trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Name is required.' })
    };
  }

  const recipient = RECIPIENTS[formType] || RECIPIENTS.default;
  const subject = `New ${formType || 'website'} submission from ${name}`;

  const ministryHtml = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(String(name))}</p>
    <p><strong>Email:</strong> ${escapeHtml(String(email))}</p>
    ${message ? `<p><strong>Message:</strong><br>${escapeHtml(String(message))}</p>` : ''}
    ${buildHtmlRows(rest)}
  `;

  const thankYouHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="color: #8b5e34;">Thank you for partnering with TKM</h2>
      <p>Hello ${escapeHtml(String(name))},</p>
      <p>Thank you for taking the step to partner with Torchbearers Kingdom Movement. We have received your partnership request and a member of our team will be in touch with you soon.</p>
      <p>We are grateful for your heart to support the movement and advance the Kingdom of God.</p>
      <p>Below is the information you shared:</p>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(String(name))}</li>
        <li><strong>Email:</strong> ${escapeHtml(String(email))}</li>
        ${rest.phone ? `<li><strong>Phone:</strong> ${escapeHtml(String(rest.phone))}</li>` : ''}
        ${rest.country ? `<li><strong>Country:</strong> ${escapeHtml(String(rest.country))}</li>` : ''}
        ${rest.organization ? `<li><strong>Organization:</strong> ${escapeHtml(String(rest.organization))}</li>` : ''}
        ${rest.partnershipType ? `<li><strong>Partnership Type:</strong> ${escapeHtml(String(rest.partnershipType))}</li>` : ''}
      </ul>
      <p><strong>Your message:</strong><br>${escapeHtml(String(message || 'No message provided.'))}</p>
      <p>With gratitude,<br> Torchbearers Kingdom Movement</p>
    </div>
  `;

  const emailRequests = [
    fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [recipient],
        reply_to: email,
        subject,
        html: ministryHtml
      })
    }),
    fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: `Thank you for partnering with TKM, ${name}`,
        html: thankYouHtml
      })
    })
  ];

  try {
    const [ministryResponse, userResponse] = await Promise.all(emailRequests);
    const ministryData = await ministryResponse.json();
    const userData = await userResponse.json();

    if (!ministryResponse.ok || !userResponse.ok) {
      console.error('Resend error:', { ministryData, userData });
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: 'Email service failed to send the notification or confirmation.',
          ministry: ministryData,
          user: userData
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ministryId: ministryData.id,
        userId: userData.id
      })
    };
  } catch (error) {
    console.error('Unexpected error sending emails:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected server error while sending emails.' })
    };
  }
};
