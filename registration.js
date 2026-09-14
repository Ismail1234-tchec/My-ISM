const registrationForm = document.querySelector('#registration-form');

if (!registrationForm) {
  throw new Error('Formulaire d’inscription introuvable.');
}

const statusMessage = document.querySelector('#registration-status');

registrationForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!registrationForm.checkValidity()) {
    registrationForm.reportValidity();
    return;
  }

  const firstName = document.querySelector('#first-name').value.trim();
  const lastName = document.querySelector('#last-name').value.trim();
  const accountType = registrationForm.querySelector('input[name="role"]:checked').value;

  const formData = {
    firstName,
    lastName,
    email: document.querySelector('#email').value.trim(),
    password: document.querySelector('#password').value,
    role: accountType
  };

  statusMessage.textContent = 'Création du compte en cours...';
  statusMessage.className = 'registration-status';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'La création du compte a échoué.');
    }

    statusMessage.textContent = `Compte ${accountType === 'agent' ? 'agent' : 'principal'} créé avec succès.`;
    statusMessage.className = 'registration-status success';
    registrationForm.reset();
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.className = 'registration-status error';
  }
});
