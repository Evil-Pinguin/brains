/* ============================================================
   НЕЙРО//АТЛАС — логика слайдера
   ============================================================ */

(() => {
  'use strict';

  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const body = document.body;
  const stage = document.getElementById('stage');
  const counterCur = document.getElementById('counterCur');
  const barFill = document.getElementById('barFill');
  const dots = Array.from(document.querySelectorAll('.dot'));
  const navPrev = document.getElementById('navPrev');
  const navNext = document.getElementById('navNext');
  const nextIcon = document.getElementById('nextIcon');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TRANSITION = 760; // мс, синхронизировано с CSS-анимациями

  let idx = 0;
  let animating = false;

  const pad = (n) => String(n + 1).padStart(2, '0');

  /* обновление «хрома»: счётчик, точки, прогресс, иконка кнопки */
  function updateChrome() {
    body.dataset.slide = String(idx);
    body.classList.toggle('at-first', idx === 0);
    body.classList.toggle('at-last', idx === total - 1);

    counterCur.textContent = pad(idx);
    counterCur.classList.remove('tick');
    void counterCur.offsetWidth; // перезапуск анимации
    counterCur.classList.add('tick');

    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    barFill.style.width = ((idx + 1) / total * 100) + '%';

    const restart = idx === total - 1;
    nextIcon.setAttribute('href', restart ? '#i-restart' : '#i-arrow-right');
    navNext.setAttribute('aria-label', restart ? 'Вернуться к первому слайду' : 'Следующий слайд');

    slides.forEach((s, i) => s.setAttribute('aria-hidden', i === idx ? 'false' : 'true'));
  }

  /* переход к слайду n в направлении dir (1 — вперёд, -1 — назад) */
  function goTo(n, dir = 1) {
    if (animating || n === idx) return;
    n = ((n % total) + total) % total; // зацикливание

    const cur = slides[idx];
    const nx = slides[n];
    animating = true;

    // текущий уезжает в сторону, противоположную направлению
    cur.classList.remove('is-active');
    cur.classList.add('is-exit', dir > 0 ? 'to-left' : 'to-right');

    // новый въезжает с нужной стороны
    nx.classList.remove('is-exit', 'to-left', 'to-right');
    nx.classList.add('is-active', dir > 0 ? 'from-right' : 'from-left');

    idx = n;
    updateChrome();

    setTimeout(() => {
      cur.classList.remove('is-exit', 'to-left', 'to-right');
      nx.classList.remove('from-right', 'from-left');
      animating = false;
    }, reduceMotion.matches ? 60 : TRANSITION);
  }

  /* ---- кнопки ---- */
  navNext.addEventListener('click', () => goTo(idx + 1, 1));
  navPrev.addEventListener('click', () => goTo(idx - 1, -1));

  dots.forEach((d) => {
    d.addEventListener('click', () => {
      const target = Number(d.dataset.goto);
      goTo(target, target > idx ? 1 : -1);
    });
  });

  /* ---- клавиатура ---- */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      goTo(idx + 1, 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goTo(idx - 1, -1);
    } else if (e.key === 'Home') {
      goTo(0, -1);
    } else if (e.key === 'End') {
      goTo(total - 1, 1);
    }
  });

  /* ---- свайп ---- */
  let startX = 0, startY = 0, tracking = false;

  stage.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  });

  window.addEventListener('pointerup', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.6 * Math.abs(dy)) {
      goTo(dx < 0 ? idx + 1 : idx - 1, dx < 0 ? 1 : -1);
    }
  });

  stage.addEventListener('dragstart', (e) => e.preventDefault());

  /* ---- лёгкий параллакс снимка за курсором ---- */
  if (!reduceMotion.matches && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      const plx = slides[idx].querySelector('.plx');
      if (!plx) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      plx.style.transform = `translate3d(${(x * 16).toFixed(1)}px, ${(y * 12).toFixed(1)}px, 0)`;
    }, { passive: true });
  }

  /* ---- стартовое состояние ---- */
  slides.forEach((s, i) => s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'));
})();
