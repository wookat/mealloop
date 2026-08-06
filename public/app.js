(function () {
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.dataset.copy);
      if (!el) return;
      navigator.clipboard.writeText(el.value);
      btn.textContent = 'Copied!';
    });
  });

  document.querySelectorAll('[data-print]').forEach(function (btn) {
    btn.addEventListener('click', function () { window.print(); });
  });

  document.querySelectorAll('[data-copy-list]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lines = [];
      document.querySelectorAll('#list section').forEach(function (sec) {
        var items = [];
        sec.querySelectorAll('.toggle-form').forEach(function (f) {
          var spans = f.querySelectorAll('span');
          if (!spans[1].classList.contains('line-through')) {
            var lbl = spans[1].cloneNode(true);
            var sub = lbl.querySelector('span');
            if (sub) lbl.removeChild(sub);
            items.push('- ' + lbl.textContent.trim());
          }
        });
        if (items.length) lines.push(sec.querySelector('h2').textContent, items.join('\n'), '');
      });
      navigator.clipboard.writeText(lines.join('\n').trim());
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = 'Copy list'; }, 2000);
    });
  });

  document.querySelectorAll('form[data-confirm]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      if (!confirm(f.dataset.confirm)) e.preventDefault();
    });
  });

  document.querySelectorAll('select[data-autosubmit]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      if (sel.value === '__custom') {
        var name = prompt(sel.dataset.customPrompt || 'New category name:');
        if (!name || !name.trim()) { sel.value = sel.dataset.prev; return; }
        var opt = document.createElement('option');
        opt.value = name.trim().slice(0, 30);
        opt.textContent = opt.value;
        opt.selected = true;
        sel.insertBefore(opt, sel.lastElementChild);
      }
      sel.form.submit();
    });
    sel.dataset.prev = sel.value;
  });

  var list = document.getElementById('list');
  if (!list) return;
  var version = list.dataset.version, base = list.dataset.base;
  document.querySelectorAll('.toggle-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = f.querySelector('button'), box = f.querySelector('span'), label = f.querySelectorAll('span')[1];
      var on = box.classList.toggle('bg-emerald-600');
      box.classList.toggle('border-emerald-600'); box.classList.toggle('text-white'); box.classList.toggle('border-stone-300');
      box.textContent = on ? '\u2713' : '';
      label.classList.toggle('line-through'); btn.classList.toggle('text-stone-500');
      fetch(base + '/toggle', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'fetch' }, body: 'id=' + encodeURIComponent(f.querySelector('input[name=id]').value) });
    });
  });
  setInterval(function () {
    fetch(base + '/version', { headers: { 'X-Requested-With': 'fetch' } }).then(function (r) { return r.json(); }).then(function (d) {
      if (String(d.version) !== String(version)) location.reload();
    }).catch(function () {});
  }, 5000);
})();
