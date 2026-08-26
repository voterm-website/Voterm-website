document.getElementById('year').textContent = new Date().getFullYear();
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('mainNav');
menuBtn.addEventListener('click', () => {
  nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', nav.classList.contains('open'));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));
