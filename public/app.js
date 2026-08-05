(function () {
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.dataset.copy);
      if (!el) return;
      navigator.clipboard.writeText(el.value);
      btn.textContent = 'Copied!';
    });
  });

  document.querySelectorAll('form[data-confirm]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      if (!confirm(f.dataset.confirm)) e.preventDefault();
    });
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
