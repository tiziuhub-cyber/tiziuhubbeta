// Microanimação: seções aparecem suavemente ao rolar. Sem JS/IO, tudo fica visível normalmente.
(function () {
  if (!('IntersectionObserver' in window) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var els = document.querySelectorAll('main section.sec, .notices');
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.04 });
  document.documentElement.classList.add('js-reveal');
  els.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
})();
