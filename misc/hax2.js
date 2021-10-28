const doc = window.top.document;

const form = doc.getElementById('assignment');

while (form.lastChild) form.remove(form.lastChild);

const p = doc.createElement('p');

p.textContent = 'Test message';

form.appendChild(p);