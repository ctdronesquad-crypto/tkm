(function () {
  const form = document.getElementById('givingForm');
  if (!form) return;

  const message = document.getElementById('givingFormMessage');
  const submitButton = form.querySelector('button[type="submit"]');
  const initialButtonLabel = submitButton.textContent;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    message.style.color = '';

    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Preparing checkout…';

    try {
      const response = await fetch('/.netlify/functions/donation-checkout-initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.elements.name.value.trim(),
          email: form.elements.contact.value.trim(),
          amount: form.elements.amount.value
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (error) {
        throw new Error('Unable to read the checkout response. Please try again.');
      }
      if (!response.ok) {
        throw new Error(result.error || 'Unable to start checkout. Please try again.');
      }

      if (typeof result.url !== 'string') {
        throw new Error('The checkout link was invalid. Please try again.');
      }
      const checkoutUrl = new URL(result.url);
      if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.paystack.com') {
        throw new Error('The checkout link was invalid. Please try again.');
      }
      window.location.assign(checkoutUrl.href);
    } catch (error) {
      message.style.color = '#b42318';
      message.textContent = error instanceof Error ? error.message : 'Unable to start checkout. Please try again.';
      submitButton.disabled = false;
      submitButton.textContent = initialButtonLabel;
    }
  });
})();
