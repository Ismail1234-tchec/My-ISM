const forms = document.querySelectorAll('form');

forms.forEach((form) => {
  form.addEventListener('input', (event) => {
    event.target.classList.toggle('is-invalid', !event.target.checkValidity());
  });

  form.addEventListener('submit', (event) => {
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
    }
  });
});
