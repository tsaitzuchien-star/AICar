// 全站共用：相片放大、篩選按鈕
(function () {
  // 相片放大
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<button type="button" aria-label="關閉">×</button><figure><img alt=""><p></p></figure>';
  document.body.appendChild(box);
  var img = box.querySelector('img');
  var cap = box.querySelector('p');
  var last = null;
  function close() { box.classList.remove('open'); if (last) last.focus(); }
  box.addEventListener('click', function (e) { if (e.target === box || e.target.tagName === 'BUTTON') close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-full]');
    if (!b) return;
    last = b;
    img.src = b.getAttribute('data-full');
    img.alt = b.getAttribute('data-cap') || '';
    cap.textContent = b.getAttribute('data-cap') || '';
    box.classList.add('open');
    box.querySelector('button').focus();
  });

  // 篩選按鈕：<div class="filters" data-target="#list"> <button data-f="all|tag">
  document.querySelectorAll('.filters').forEach(function (bar) {
    var list = document.querySelector(bar.getAttribute('data-target'));
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var f = b.getAttribute('data-f');
      list.querySelectorAll('[data-tags]').forEach(function (it) {
        it.hidden = !(f === 'all' || it.getAttribute('data-tags').split(' ').indexOf(f) > -1);
      });
    });
  });

  // 原始數據表：先放備份數字，再從試算表讀最新的
  // <table data-gid="0" data-fallback="備份 JSON 的 id">
  var SHEET = 'https://docs.google.com/spreadsheets/d/13gkJgF3i0j1yPZTgs6Z5I28JxsanNAGIRpXyR6V_tt8/export?format=csv&gid=';
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fill(table, rows) {
    var w = rows[0].length;
    var body = rows.slice(1).filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
    var t = '<thead><tr>' + rows[0].map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>';
    body.forEach(function (r) {
      var cells = [];
      for (var i = 0; i < w; i++) { var v = r[i] == null ? '' : String(r[i]); cells.push('<td' + (v.length > 14 ? ' class="long"' : '') + '>' + esc(v) + '</td>'); }
      t += '<tr>' + cells.join('') + '</tr>';
    });
    table.innerHTML = t + '</tbody>';
  }
  window.parseCSV = function (text) {
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch !== '\r') cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  };
  document.querySelectorAll('table[data-gid]').forEach(function (table) {
    var fb = JSON.parse(document.getElementById(table.getAttribute('data-fallback')).textContent);
    fill(table, fb);
    fetch(SHEET + table.getAttribute('data-gid')).then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (t) {
        var rows = window.parseCSV(t);
        if (rows.length > 1 && rows[0][0] === fb[0][0]) {
          var w = fb[0].length;
          fill(table, rows.map(function (r) { return r.slice(0, w); }));
        }
      }).catch(function () {});
  });
})();
