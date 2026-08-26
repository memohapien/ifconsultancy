const menu=document.querySelector('.menu');
const links=document.querySelector('.navlinks');
if(menu){menu.addEventListener('click',()=>{links.classList.toggle('open');})}
const items=document.querySelectorAll('.cap,.metric,.ecosystem-image-wrap,.founder-card');
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.style.opacity=1;e.target.style.transform='translateY(0)';io.unobserve(e.target)}}),{threshold:.08});
items.forEach(el=>{el.style.opacity=0;el.style.transform='translateY(18px)';el.style.transition='opacity .7s ease, transform .7s ease';io.observe(el)});
