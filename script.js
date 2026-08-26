const menu = document.querySelector('.menu-btn');
const nav = document.querySelector('.desktop-nav');

if (menu) {
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    document.body.classList.toggle('nav-open', !open);
  });
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    menu?.setAttribute('aria-expanded', 'false');
  });
});

const revealItems = document.querySelectorAll('.proof-card, .service-list details, .steps article');
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      io.unobserve(entry.target);
    }
  });
}, {threshold: .08});

revealItems.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = `opacity .6s ${i * .035}s ease, transform .6s ${i * .035}s ease`;
  io.observe(el);
});
