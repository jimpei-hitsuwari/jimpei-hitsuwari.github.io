/* hitsuwari-jimpei.com — shared behaviour
   1. JA / EN switch (remembered across pages)
   2. Menu overlay
   3. Slow reveal on scroll
*/
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');

  /* 1. Language */
  var langButtons = document.querySelectorAll('[data-set-lang]');
  function setLang(lang) {
    root.dataset.lang = lang;
    root.lang = lang;
    langButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.setLang === lang));
    });
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.setLang); });
  });
  setLang(root.dataset.lang || 'ja');

  /* 2. Menu */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('site-menu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
    if (menu) menu.setAttribute('aria-hidden', String(!open));
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!root.classList.contains('menu-open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* 3. Category filter (outreach, media): buttons with data-filter, items with data-cat */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var target = document.getElementById(group.dataset.filterGroup);
    if (!target) return;
    var buttons = group.querySelectorAll('[data-filter]');
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.dataset.filter;
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        target.querySelectorAll('[data-cat]').forEach(function (item) {
          item.hidden = !(cat === 'all' || item.dataset.cat === cat);
        });
        /* hide a year group when none of its items are visible */
        target.querySelectorAll('.year-group').forEach(function (g) {
          g.hidden = !g.querySelector('[data-cat]:not([hidden])');
        });
      });
    });
    group.hidden = false;
  });

  /* 4. Publication tabs: show one section at a time.
        The URL hash keeps the chosen tab, so links like publication/#invited
        or publication/#papers-2024 open the right tab. */
  var tabBar = document.querySelector('.pub-tabs');
  if (tabBar) {
    var tabLinks = Array.prototype.slice.call(tabBar.querySelectorAll('a[href^="#"]'));
    var panels = tabLinks.map(function (a) { return document.getElementById(a.hash.slice(1)); }).filter(Boolean);
    var activate = function (id) {
      panels.forEach(function (p) { p.hidden = p.id !== id; });
      tabLinks.forEach(function (a) {
        var on = a.hash === '#' + id;
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    };
    var panelFor = function (hash) {
      var target = hash && document.getElementById(hash.slice(1));
      if (!target) return null;
      for (var i = 0; i < panels.length; i++) {
        if (panels[i] === target || panels[i].contains(target)) return panels[i];
      }
      return null;
    };
    var startPanel = panelFor(location.hash) || panels[0];
    if (startPanel) {
      activate(startPanel.id);
      if (location.hash && location.hash !== '#' + startPanel.id) {
        var el = document.getElementById(location.hash.slice(1));
        if (el) setTimeout(function () { el.scrollIntoView({ block: 'start', behavior: 'instant' }); }, 0);
      }
    }
    tabLinks.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var id = a.hash.slice(1);
        activate(id);
        if (history.replaceState) history.replaceState(null, '', '#' + id);
        /* if the reader has scrolled down, bring the start of the new list just under the tabs */
        var panel = document.getElementById(id);
        var offset = tabBar.getBoundingClientRect().bottom + 24;
        var top = panel.getBoundingClientRect().top;
        if (top < offset) window.scrollTo(0, window.pageYOffset + top - offset);
      });
    });
    window.addEventListener('hashchange', function () {
      var p = panelFor(location.hash);
      if (p) activate(p.id);
    });
  }

  /* 5. YouTube Shorts: nothing loads from YouTube until the visitor presses play.
        Without JavaScript the link simply opens the Short on YouTube. */
  document.querySelectorAll('a.short-media[data-yt]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var box = document.createElement('div');
      box.className = 'short-media';
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(a.dataset.yt) + '?autoplay=1&playsinline=1&rel=0';
      frame.title = a.getAttribute('aria-label') || 'YouTube';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      box.appendChild(frame);
      a.replaceWith(box);
    });
  });

  /* 6. Reveal */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
