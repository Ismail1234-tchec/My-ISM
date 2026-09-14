const balanceAmount = document.querySelector('#balance-amount');
const toggleBalance = document.querySelector('#toggle-balance');
const transferForm = document.querySelector('#transfer-form-element');
const amountInput = document.querySelector('#amount');
const totalAmount = document.querySelector('#total-amount');
const logoutButton = document.querySelector('#logout-button');
const addBeneficiary = document.querySelector('#add-beneficiary');
const viewAllButton = document.querySelector('#view-all');
const transactionList = document.querySelector('#transaction-list');
const transferFeePerThreshold = 300;
const transferThreshold = 10000;
const availableBalance = '245 800';

if (!balanceAmount || !toggleBalance || !transferForm || !amountInput || !totalAmount || !logoutButton || !addBeneficiary || !viewAllButton || !transactionList) {
  throw new Error('Éléments du tableau de bord introuvables.');
}

function formatAmount(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, ' ');
}

function updateTotal() {
  const amount = Number(amountInput.value) || 0;
  const reason = document.querySelector('#reason').value;
  const fee = reason === 'Dépôt' ? 0 : amount ? Math.ceil(amount / transferThreshold) * transferFeePerThreshold : 0;
  const feesIncluded = document.querySelector('input[name="fee-mode"]:checked').value === 'included';
  const total = feesIncluded ? amount : amount + fee;
  document.querySelector('#transfer-fee').textContent = `${formatAmount(fee)} FCFA`;
  totalAmount.textContent = `${formatAmount(total)} FCFA`;
}

toggleBalance.addEventListener('click', () => {
  const isHidden = balanceAmount.dataset.hidden === 'true';
  balanceAmount.innerHTML = isHidden ? `${availableBalance} <span>FCFA</span>` : '•••••• <span>FCFA</span>';
  balanceAmount.dataset.hidden = String(!isHidden);
  toggleBalance.setAttribute('aria-label', isHidden ? 'Masquer le solde' : 'Afficher le solde');
});

amountInput.addEventListener('input', updateTotal);
document.querySelector('#reason').addEventListener('change', updateTotal);
document.querySelectorAll('input[name="fee-mode"]').forEach((option) => option.addEventListener('change', updateTotal));

transferForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!transferForm.checkValidity()) {
    transferForm.reportValidity();
    return;
  }

  const beneficiary = document.querySelector('#beneficiary');
  const selectedName = beneficiary.value.trim();
  const senderName = document.querySelector('#sender-name').value.trim();
  const senderPhone = document.querySelector('#sender-phone').value.trim();
  const recipientPhone = document.querySelector('#recipient-phone').value.trim();
  const recipientCity = document.querySelector('#recipient-city').value.trim();
  const reason = document.querySelector('#reason').value.trim();
  const amount = Number(amountInput.value);
  const feesIncluded = document.querySelector('input[name="fee-mode"]:checked').value === 'included';

  if (!amount || amount <= 0) {
    return;
  }

  const submitButton = transferForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beneficiary: selectedName, senderName, senderPhone, recipientName: selectedName, recipientPhone, recipientCity, amount, reason, feesIncluded })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Le transfert n’a pas pu être enregistré.');
    }

    alert(`Transfert effectué avec succès ! ${senderName} a envoyé ${formatAmount(amount)} FCFA à ${selectedName}, ${recipientCity}.`);
    transferForm.reset();
    updateTotal();
  } catch (error) {
    alert(`Échec du transfert : ${error.message}`);
  } finally {
    submitButton.disabled = false;
  }
});

addBeneficiary.addEventListener('click', () => {
  alert('La fonction d’ajout de bénéficiaire sera bientôt disponible.');
});

document.querySelectorAll('.beneficiary').forEach((beneficiary) => {
  beneficiary.addEventListener('click', () => {
    const beneficiaryName = beneficiary.dataset.name;
    document.querySelector('#beneficiary').value = beneficiaryName;
    document.querySelector('#transfer-form').scrollIntoView({ behavior: 'smooth' });
  });
});

viewAllButton.addEventListener('click', () => {
  alert('Vous consultez déjà les dernières transactions disponibles.');
});

logoutButton.addEventListener('click', () => {
  window.location.href = 'index.html';
});
