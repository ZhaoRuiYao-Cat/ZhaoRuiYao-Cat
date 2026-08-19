
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  body.classList.add('js-anim');

  var loader = doc.getElementById('loader');
  var started = false;

  function revealSite() {
    if (started) return;
    started = true;
    body.classList.add('loaded');
    observeSteps();
  }

  if (loader) {
    if (reduce) {
      loader.parentNode.removeChild(loader);
      revealSite();
    } else {
      var minShown = 1000;  
      var maxWait = 3500;   
      var shownAt = performance.now();
      var finished = false;

      function hideLoader() {
        if (loader.classList.contains('done')) return;
        loader.classList.add('done');
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 1000);
        setTimeout(revealSite, 420);
      }

      function finish() {
        if (finished) return;
        finished = true;
        var delay = Math.max(0, minShown - (performance.now() - shownAt));
        setTimeout(hideLoader, delay);
      }

      if (doc.readyState === 'complete') {
        finish();
      } else {
        window.addEventListener('load', finish);
        setTimeout(finish, maxWait);
      }
    }
  } else {
    revealSite();
  }

  var stepIO = null;
  function observeSteps() {
    var els = doc.querySelectorAll('[data-step]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    stepIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          stepIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { stepIO.observe(el); });
  }

  var statIO = null;
  var statEls = doc.querySelectorAll('.stat-num');
  if (statEls.length && 'IntersectionObserver' in window) {
    statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var dur = 1500;
        var t0 = performance.now();
        (function step(now) {
          var p = Math.min((now - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
        statIO.unobserve(el);
      });
    }, { threshold: 0.55 });
    statEls.forEach(function (el) { statIO.observe(el); });
  } else {
    statEls.forEach(function (el) { el.textContent = el.getAttribute('data-count') || '0'; });
  }

  var header = doc.getElementById('siteHeader');
  var toTop = doc.getElementById('toTop');
  var sections = Array.prototype.slice.call(doc.querySelectorAll('[data-section]'));
  var dots = Array.prototype.slice.call(doc.querySelectorAll('.step-dot'));
  var parallaxEls = Array.prototype.slice.call(doc.querySelectorAll('[data-speed]'));
  var dotsLayer = doc.querySelector('.bg-dots');
  var aboutSec = doc.getElementById('about');
  var photoWrap = doc.querySelector('.hero-photo-wrap');
  var ticking = false;
  var lastY = window.scrollY;

  function update() {
    var y = window.scrollY;

    if (header) {
      header.classList.toggle('scrolled', y > 20);
      var goingDown = y > lastY;
      if (y > 440 && !body.classList.contains('menu-open')) {
        header.classList.toggle('hidden', goingDown);
      } else {
        header.classList.remove('hidden');
      }
    }

    if (toTop) toTop.classList.toggle('show', y > 700);

    var probe = y + window.innerHeight * 0.4;
    var activeId = sections.length ? sections[0].id : '';
    sections.forEach(function (s) {
      var top = s.getBoundingClientRect().top + y;
      if (top <= probe) activeId = s.id;
    });
    dots.forEach(function (d) {
      d.classList.toggle('active', d.getAttribute('data-target') === activeId);
    });

    if (dotsLayer && aboutSec) {
      var rr = aboutSec.getBoundingClientRect();
      var vh = window.innerHeight;
      var center = (rr.top + rr.bottom) / 2;
      var dist = Math.abs(center - vh / 2) / (vh / 2);
      var visible = Math.min(1, dist);
      dotsLayer.style.opacity = String(visible);
      dotsLayer.style.filter = 'blur(' + ((1 - visible) * 5).toFixed(1) + 'px)';
    }

    if (!reduce) {
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-speed')) || 0;
        el.style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
      });
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    updatePhoto(); 
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updatePhoto);
  update();
  updatePhoto();

  function updatePhoto() {
    if (!photoWrap) return;
    if (window.innerWidth <= 768) {
      photoWrap.style.opacity = '';
      photoWrap.style.transform = '';
      return;
    }
    var py = window.scrollY;
    var pf = Math.min(1, py / 150);
    photoWrap.style.opacity = String(1 - pf);
    photoWrap.style.transform = 'translateY(' + (py * 0.3).toFixed(1) + 'px)';
  }

  var rotator = doc.getElementById('roleRotator');
  if (rotator && !reduce) {
    var roles = ['设计师', '开发者', '创造者', '问题解决者'];
    var ri = 0;
    setInterval(function () {
      rotator.classList.add('swap');
      setTimeout(function () {
        ri = (ri + 1) % roles.length;
        rotator.textContent = roles[ri];
        rotator.classList.remove('swap');
      }, 290);
    }, 2400);
  }

  if (finePointer && !reduce) {
    var ring = doc.querySelector('.cursor-ring');
    if (ring) {
      var ringVisible = false;

      function ringShow() {
        if (!body.classList.contains('loaded')) return;
        ringVisible = true;
        ring.style.opacity = '1';
      }
      function ringHide() {
        ringVisible = false;
        ring.style.opacity = '0';
      }

      doc.documentElement.addEventListener('mouseenter', ringShow);
      doc.documentElement.addEventListener('mouseleave', ringHide);

      window.addEventListener('mousemove', function (e) {
        if (!ringVisible && body.classList.contains('loaded')) ringShow();
        ring.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0) translate(-50%,-50%)';
      }, { passive: true });
    }
  }

  var lang = 'zh';
  function fitSelect(sel) {
    var opt = sel.options[sel.selectedIndex];
    var cs = getComputedStyle(sel);
    var tmp = doc.createElement('span');
    tmp.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;padding:0;';
    tmp.style.fontFamily = cs.fontFamily;
    tmp.style.fontSize = cs.fontSize;
    tmp.style.fontWeight = cs.fontWeight;
    tmp.textContent = opt.textContent;
    body.appendChild(tmp);
    var w = tmp.getBoundingClientRect().width;
    body.removeChild(tmp);
    sel.style.width = (w + 40) + 'px';
  }
  function applyLang() {
    var attr = lang === 'en' ? 'data-en' : 'data-zh';
    doc.querySelectorAll('[data-zh]').forEach(function (el) {
      var txt = el.getAttribute(attr);
      if (txt !== null) el.innerHTML = txt;
    });
    doc.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    doc.querySelectorAll('.lang-select').forEach(function (sel) {
      sel.value = lang;
      fitSelect(sel);
    });
  }
  doc.querySelectorAll('.lang-select').forEach(function (sel) {
    sel.addEventListener('change', function () {
      lang = this.value === 'en' ? 'en' : 'zh';
      applyLang();
    });
  });
  applyLang();

  var toggle = doc.getElementById('navToggle');
  var menu = doc.getElementById('mobileMenu');
  if (toggle && menu) {
    function setMenu(open) {
      body.classList.toggle('menu-open', open);
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    toggle.addEventListener('click', function () {
      setMenu(!body.classList.contains('menu-open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        setMenu(false);
        if (a.hash && a.hash.length > 1) {
          var target = doc.querySelector(a.hash);
          if (target) {
            setTimeout(function () {
              target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
            }, 90);
          }
        }
      });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false);
    });
  }
})();
