/* ═══════════════════════════════════════════════════
   MATERIALHUB — main.js
   Данные берутся из data.json
   ═══════════════════════════════════════════════════ */

const ITEMS_PER_PAGE = 9;

let state = {
  items:          [],
  categories:     [],
  activeCategory: 'Все',
  search:         '',
  page:           1,
};

// ─── ЗАГРУЗКА ДАННЫХ ─────────────────────────────────────────────
async function init() {
  try {
    const res  = await fetch('data.json');
    const data = await res.json();
    state.items      = data.items      || [];
    state.categories = data.categories || [];
    render();
  } catch (e) {
    document.getElementById('cardsGrid').innerHTML =
      '<div class="empty"><div class="empty-icon">⚠️</div>' +
      '<div class="empty-title">Не удалось загрузить данные</div>' +
      '<div class="empty-sub">Проверьте что файл data.json находится рядом с index.html</div></div>';
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────
function plural(n) {
  const r = n % 100;
  if (r >= 11 && r <= 14) return 'ов';
  const d = n % 10;
  if (d === 1) return '';
  if (d >= 2 && d <= 4) return 'а';
  return 'ов';
}

function getFiltered() {
  return state.items.filter(item => {
    const matchCat    = state.activeCategory === 'Все' || item.cat === state.activeCategory;
    const q           = state.search.toLowerCase();
    const matchSearch = !q
      || item.title.toLowerCase().includes(q)
      || (item.desc || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

// ─── RENDER ──────────────────────────────────────────────────────
function render() {
  renderStats();
  renderCats();
  renderCards();
}

function renderStats() {}

function renderCats() {
  const list = document.getElementById('catList');
  list.innerHTML = '';
  state.categories.forEach(cat => {
    const count = cat === 'Все'
      ? state.items.length
      : state.items.filter(i => i.cat === cat).length;
    const el = document.createElement('div');
    el.className = 'cat-item' + (state.activeCategory === cat ? ' active' : '');
    el.innerHTML = `<span>${cat}</span><span class="cat-count">${count}</span>`;
    el.onclick = () => { state.activeCategory = cat; state.page = 1; render(); };
    list.appendChild(el);
  });
}

function renderCards() {
  const filtered   = getFiltered();
  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  if (state.page > totalPages) state.page = totalPages;

  const paged = filtered.slice((state.page - 1) * ITEMS_PER_PAGE, state.page * ITEMS_PER_PAGE);

  document.getElementById('activeTitle').textContent =
    state.activeCategory === 'Все' ? 'Все материалы' : state.activeCategory;
  document.getElementById('activeCount').textContent = `${total} материал${plural(total)}`;

  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';

  if (paged.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Ничего не найдено</div>
        <div class="empty-sub">Попробуйте изменить запрос или выбрать другую категорию</div>
      </div>`;
  } else {
    paged.forEach(item => grid.appendChild(makeCard(item)));
  }

  renderPagination(totalPages);
}

function makeCard(item) {
  const card = document.createElement('div');
  card.className = 'card';

  const imgHtml = item.img
    ? `<img class="card-img" src="${item.img}" alt="${item.title}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="card-img-placeholder" style="display:none">🖼</div>`
    : `<div class="card-img-placeholder">📄</div>`;

  card.innerHTML = `
    ${imgHtml}
    <div class="card-body">
      <div class="card-cat">${item.cat || 'Без категории'}</div>
      <div class="card-title">${item.title}</div>
      <div class="card-desc">${item.desc || ''}</div>
      <div class="card-actions">
        ${item.url ? `<a class="visit-btn" href="${item.url}" target="_blank" rel="noopener">→ Открыть</a>` : ''}
      </div>
    </div>`;
  return card;
}

function renderPagination(totalPages) {
  const pag = document.getElementById('pagination');
  pag.innerHTML = '';
  if (totalPages <= 1) return;

  const go = (p) => { state.page = p; render(); window.scrollTo({ top: 300, behavior: 'smooth' }); };

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '←';
  prev.disabled = state.page === 1;
  prev.onclick = () => go(state.page - 1);
  pag.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const far = totalPages > 7 && Math.abs(i - state.page) > 2 && i !== 1 && i !== totalPages;
    if (far) {
      if (i === 2 || i === totalPages - 1) {
        const d = document.createElement('span');
        d.textContent = '...';
        d.style.cssText = 'color:var(--text3);padding:0 4px;display:flex;align-items:center';
        pag.appendChild(d);
      }
      continue;
    }
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i === state.page ? ' active' : '');
    btn.textContent = i;
    btn.onclick = () => go(i);
    pag.appendChild(btn);
  }

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = '→';
  next.disabled = state.page === totalPages;
  next.onclick = () => go(state.page + 1);
  pag.appendChild(next);
}

// ─── UTILS ───────────────────────────────────────────────────────
function copyLink(url, btn) {
  const done = () => {
    btn.classList.add('copied');
    btn.textContent = '✓ Скопировано';
    setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = '📋 Копировать'; }, 2000);
  };
  navigator.clipboard.writeText(url).then(done).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    done();
  });
}

function handleSearch() {
  state.search = document.getElementById('searchInput').value;
  state.page = 1;
  render();
}

// ─── START ───────────────────────────────────────────────────────
init();