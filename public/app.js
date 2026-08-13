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

  var demo = document.querySelector('[data-demo]');
  if (demo) {
    demo.querySelectorAll('[data-demo-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        demo.querySelectorAll('[data-demo-tab]').forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.classList.toggle('bg-emerald-600', on); t.classList.toggle('text-white', on);
          t.classList.toggle('bg-stone-100', !on); t.classList.toggle('text-stone-600', !on); t.classList.toggle('hover:bg-stone-200', !on);
        });
        demo.querySelectorAll('[data-demo-panel]').forEach(function (p) {
          p.classList.toggle('hidden', p.dataset.demoPanel !== tab.dataset.demoTab);
        });
      });
    });
  }

  document.querySelectorAll('[data-copy-list]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lines = [];
      document.querySelectorAll('#list section').forEach(function (sec) {
        var items = [];
        sec.querySelectorAll('.toggle-form').forEach(function (f) {
          var spans = f.querySelectorAll('span');
          if (!spans[1].classList.contains('line-through')) {
            var lbl = spans[1].cloneNode(true);
            lbl.querySelectorAll('span').forEach(function (sub) { lbl.removeChild(sub); });
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

  document.querySelectorAll('button[data-busy-label]').forEach(function (btn) {
    btn.form && btn.form.addEventListener('submit', function () {
      btn.textContent = btn.dataset.busyLabel;
      btn.setAttribute('aria-busy', 'true');
      setTimeout(function () { btn.disabled = true; }, 0);
    });
  });

  // AI drafting progress overlay: shown while the /app/ai/generate form is in
  // flight so the wait is never silent; the stage line advances on a timer.
  var aiOverlay = document.querySelector('[data-ai-overlay]');
  if (aiOverlay) {
    var stages = [
      'Reading your recipe box…',
      'Drafting seven dinners…',
      'Balancing variety across the week…',
      'Almost there — double-checking the draft…',
      'Taking longer than usual — retrying once…'
    ];
    var aiTimer = null;
    var startOverlay = function () {
      aiOverlay.hidden = false;
      var line = aiOverlay.querySelector('[data-ai-stage]');
      var t0 = Date.now();
      line.textContent = stages[0];
      if (aiTimer) clearInterval(aiTimer);
      aiTimer = setInterval(function () {
        var i = Math.min(Math.floor((Date.now() - t0) / 7000), stages.length - 1);
        line.textContent = stages[i];
      }, 1000);
    };
    var seen = [];
    document.querySelectorAll('button[data-ai-start]').forEach(function (btn) {
      if (!btn.form || seen.indexOf(btn.form) !== -1) return;
      seen.push(btn.form);
      btn.form.addEventListener('submit', startOverlay);
    });
  }

  // Resend-code cooldown: the plain form works without JS; with JS the button
  // waits out a short cooldown so users don't burn their send allowance.
  var resend = document.querySelector('button[data-resend]');
  if (resend) {
    var label = resend.textContent;
    var wait = 60;
    resend.disabled = true;
    var rTick = setInterval(function () {
      wait--;
      if (wait <= 0) {
        clearInterval(rTick);
        resend.disabled = false;
        resend.textContent = label;
        return;
      }
      resend.textContent = "Didn't get it? Resend in " + wait + ' s';
    }, 1000);
    resend.textContent = "Didn't get it? Resend in " + wait + ' s';
  }

  // One-time dismissible boxes (e.g. planner setup guide): server renders them
  // hidden; shown only until the user dismisses, remembered in localStorage.
  document.querySelectorAll('[data-dismiss-box]').forEach(function (box) {
    var key = 'ml-hide-' + box.dataset.dismissBox;
    try { if (localStorage.getItem(key)) return; } catch (e) {}
    box.hidden = false;
    var btn = box.querySelector('[data-dismiss]');
    btn && btn.addEventListener('click', function () {
      box.hidden = true;
      try { localStorage.setItem(key, '1'); } catch (e) {}
    });
  });

  // "New" feature badges: shown until the feature is first used.
  document.querySelectorAll('[data-new]').forEach(function (badge) {
    var key = 'ml-new-' + badge.dataset.new;
    try { if (localStorage.getItem(key)) return; } catch (e) {}
    badge.hidden = false;
    var host = badge.closest('a, button');
    host && host.addEventListener('click', function () {
      try { localStorage.setItem(key, '1'); } catch (e) {}
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

  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.relative[open]').forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('details.relative[open]').forEach(function (d) {
      d.removeAttribute('open');
      d.querySelector('summary').focus();
    });
  });

  var cookBtn = document.querySelector('[data-cook-mode]');
  if (cookBtn) {
    var article = cookBtn.closest('article');
    var wakeLock = null;
    var requestWake = function () {
      if (navigator.wakeLock) {
        navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }).catch(function () {});
      }
    };
    cookBtn.addEventListener('click', function () {
      var on = article.classList.toggle('cook-mode');
      cookBtn.textContent = on ? 'Exit cook mode' : '▶ Start cooking';
      if (on) { requestWake(); } else if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && article.classList.contains('cook-mode')) requestWake();
    });
    var steps = article.querySelectorAll('.steps-list li');
    var setCurrent = function () {
      var found = false;
      steps.forEach(function (li) {
        li.classList.remove('current');
        if (!found && !li.classList.contains('done')) { li.classList.add('current'); found = true; }
      });
    };
    article.querySelectorAll('.steps-list li, .ingredients-list li.flex').forEach(function (li) {
      li.addEventListener('click', function () {
        if (article.classList.contains('cook-mode')) { li.classList.toggle('done'); setCurrent(); }
      });
    });
    cookBtn.addEventListener('click', setCurrent);

    // Tap-to-start timers: detect durations in step text (e.g. "10 minutes", "1 hour").
    var timerRe = /(\d+(?:\s*[\u2013-]\s*\d+)?)\s*(minutes?|mins?|hours?|hrs?)\b/i;
    steps.forEach(function (li) {
      var walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        var m = timerRe.exec(node.textContent);
        if (!m) continue;
        var mins = parseInt(m[1], 10);
        if (/hour|hr/i.test(m[2])) mins *= 60;
        if (!mins || mins > 24 * 60) break;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'timer-btn';
        btn.textContent = m[0];
        btn.setAttribute('aria-label', 'Start a ' + mins + ' minute timer');
        var after = node.splitText(m.index);
        after.textContent = after.textContent.slice(m[0].length);
        node.parentNode.insertBefore(btn, after);
        (function (btn, total) {
          var left = null, iv = null;
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (iv || btn.classList.contains('finished')) { clearInterval(iv); iv = null; left = null; btn.classList.remove('running', 'finished'); btn.textContent = btn.dataset.label; return; }
            btn.dataset.label = btn.dataset.label || btn.textContent;
            left = total * 60;
            btn.classList.add('running');
            btn.classList.remove('finished');
            var tick = function () {
              if (left <= 0) { clearInterval(iv); iv = null; btn.classList.remove('running'); btn.classList.add('finished'); btn.textContent = '\u23f0 Time\u2019s up \u2014 tap to reset'; return; }
              btn.textContent = '\u23f1 ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
              left--;
            };
            tick();
            iv = setInterval(tick, 1000);
          });
        })(btn, mins);
        break;
      }
    });
  }

  var prevLink = document.querySelector('a[data-swipe-prev]');
  var nextLink = document.querySelector('a[data-swipe-next]');
  if (prevLink || nextLink) {
    var startX = null, startY = null;
    document.addEventListener('touchstart', function (e) {
      if (e.target.closest('input, select, textarea, button, a, summary')) { startX = null; return; }
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) / 2) return;
      var target = dx < 0 ? nextLink : prevLink;
      if (target) location.href = target.href;
    }, { passive: true });
  }

  var list = document.getElementById('list');
  var poller = list || document.querySelector('[data-poll]');
  if (!poller) return;
  var version = poller.dataset.version, base = poller.dataset.base;
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
