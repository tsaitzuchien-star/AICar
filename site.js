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
})();
