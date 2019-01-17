function getToken() {
  var token = document.location.href.split("/reset/")[1];

  var new_input = document.createElement('input');

  new_input.setAttribute('type', 'text');
  new_input.setAttribute('class', 'form-control');
  new_input.setAttribute('name', 'token');
  new_input.setAttribute('value', token);
  new_input.style.display = "none";
  new_input.setAttribute('hidden', true);

  var form = document.querySelectorAll('form > .form-group')[0];
  form.appendChild(new_input);
}