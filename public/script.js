const observer=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')})},{threshold:.12});
document.querySelectorAll('section,article,.name-grid span').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(18px)';el.style.transition='opacity .7s ease, transform .7s ease';observer.observe(el)});
const style=document.createElement('style');style.textContent='.in{opacity:1!important;transform:none!important}';document.head.appendChild(style);
const menu=document.querySelector('.menu');const links=document.querySelector('.navlinks');menu?.addEventListener('click',()=>{links.classList.toggle('open')});
