const PAYSTACK_INITIALIZE_ENDPOINT = 'https://api.paystack.co/transaction/initialize';
const BOOK_AMOUNT_PESEWAS = 10000;
const BOOKS = {
  'seers-code': "The Seer's Code",
  'colour-code-manual': 'The Colour Code Manual',
  'code-breaks-african-curse': 'The Code That Breaks the African Curse'
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
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

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const bookTitle = typeof payload.bookId === 'string' ? BOOKS[payload.bookId] : '';
  if (!name || name.length > 150) {
    return jsonResponse(400, { error: 'A valid full name is required.' });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(400, { error: 'A valid email address is required.' });
  }
  if (!bookTitle) {
    return jsonResponse(400, { error: 'Please select a valid book.' });
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
        amount: BOOK_AMOUNT_PESEWAS,
        currency: 'GHS',
        metadata: {
          customer_name: name,
          book_title: bookTitle
        }
      })
    });
    const result = await response.json();
    const checkoutUrl = result && result.data && result.data.authorization_url;

    if (!response.ok || !result.status || typeof checkoutUrl !== 'string') {
      console.error('Paystack checkout initialization failed:', response.status, result.message || 'Invalid response');
      return jsonResponse(502, { error: 'Unable to start checkout. Please try again shortly.' });
    }

    return jsonResponse(200, { url: checkoutUrl });
  } catch (error) {
    console.error('Unexpected error initializing Paystack checkout:', error);
    return jsonResponse(502, { error: 'Unable to start checkout. Please try again shortly.' });
  }
};
