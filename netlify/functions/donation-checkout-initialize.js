const PAYSTACK_INITIALIZE_ENDPOINT = 'https://api.paystack.co/transaction/initialize';

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
}

function amountToPesewas(value) {
  if (typeof value !== 'string') return null;

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const amount = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  return Number.isSafeInteger(amount) && amount >= 100 ? amount : null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return jsonResponse(400, { error: 'Invalid request body.' });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const amount = amountToPesewas(payload.amount);

  if (!name || name.length > 150) {
    return jsonResponse(400, { error: 'A valid full name is required.' });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(400, { error: 'A valid email address is required.' });
  }
  if (amount === null) {
    return jsonResponse(400, { error: 'Enter a valid donation amount of at least GHS 1.00, with no more than two decimal places.' });
  }
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('Missing PAYSTACK_SECRET_KEY environment variable.');
    return jsonResponse(500, { error: 'Checkout is not configured yet. Please try again later.' });
  }

  try {
    const response = await fetch(PAYSTACK_INITIALIZE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount,
        currency: 'GHS',
        callback_url: new URL('/donate.html', process.env.URL).href,
        metadata: {
          customer_name: name,
          purpose: 'Donation'
        }
      })
    });
    const result = await response.json();
    const checkoutUrl = result && result.data && result.data.authorization_url;

    if (!response.ok || !result || !result.status || typeof checkoutUrl !== 'string') {
      const errorMessage = result && result.message ? result.message : 'Invalid response';
      console.error('Paystack donation checkout initialization failed:', response.status, errorMessage);
      return jsonResponse(502, { error: 'Unable to start checkout. Please try again shortly.' });
    }

    return jsonResponse(200, { url: checkoutUrl });
  } catch (error) {
    console.error('Unexpected error initializing Paystack donation checkout:', error);
    return jsonResponse(502, { error: 'Unable to start checkout. Please try again shortly.' });
  }
};
