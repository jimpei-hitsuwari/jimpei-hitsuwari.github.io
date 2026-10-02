/* Contact form
   - If the form has data-endpoint (e.g. a Formspree URL), the message is sent from the page.
   - Otherwise it falls back to preparing an email in the visitor's mail app (mailto:).
   For checking without side effects: window.__contactDryRun = true (mailto mode only). */
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var TO = 'hitsuwari.jimpei@gmail.com';
  var endpoint = (form.dataset.endpoint || '').trim();
  var status = document.getElementById('contact-status');
  var button = form.querySelector('button[type="submit"]');
  form.dataset.mode = endpoint ? 'send' : 'mail';

  function show(key) {
    if (!status) return;
    status.querySelectorAll('[data-msg]').forEach(function (el) { el.hidden = el.dataset.msg !== key; });
    status.hidden = !key;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements._gotcha && form.elements._gotcha.value) return; /* bot filled the hidden field */
    if (!form.reportValidity()) return;

    var v = function (name) { return (form.elements[name].value || '').trim(); };
    var ja = document.documentElement.lang !== 'en';
    var subject = (ja ? '【お問い合わせ】' : '[Inquiry] ') + v('type') + ' - ' + v('name');

    if (endpoint) {
      var data = new FormData(form);
      data.set('_subject', subject);
      button.disabled = true;
      show('sending');
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset();
          show('sent');
        })
        .catch(function () { show('error'); })
        .then(function () { button.disabled = false; });
      return;
    }

    var lines = ja
      ? ['お名前: ' + v('name'), 'ご所属: ' + (v('affiliation') || '-'), 'メールアドレス: ' + v('email'), 'ご用件: ' + v('type'), '', v('message')]
      : ['Name: ' + v('name'), 'Affiliation: ' + (v('affiliation') || '-'), 'Email: ' + v('email'), 'Subject: ' + v('type'), '', v('message')];
    var url = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    form.dataset.mailto = url;
    if (!window.__contactDryRun) window.location.href = url;
    show('mail');
  });
})();
