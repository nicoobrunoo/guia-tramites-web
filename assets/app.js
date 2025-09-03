// app.js — Guía de Trámites AMIP (compat)

/* ------------------ Elementos del DOM ------------------ */
var lista = document.getElementById('listaTramites');
var vacio = document.getElementById('vacio');
var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
var q = document.getElementById('q');
var btnBuscar = document.getElementById('btnBuscar');

// Modal de opciones
var modal = document.getElementById('opModal');
var opTitle = document.getElementById('opTitle');
var opSub = document.getElementById('opSub');
var opActions = document.getElementById('opActions');

// Modal Agregar
var btnAgregar   = document.getElementById('btnAgregar');
var addModal     = document.getElementById('addModal');
var addForm      = document.getElementById('addForm');
var addCategoria = document.getElementById('addCategoria');
var addTitulo    = document.getElementById('addTitulo');

// Modal Editar HTML
var editModal  = document.getElementById('editModal');
var editArea   = document.getElementById('editArea');
var editSub    = document.getElementById('editSub');
var btnDescargarHtml = document.getElementById('btnDescargarHtml');

/* ------------------ Estado ------------------ */
var DATA = [];
var categoriaActual = 'Persona';
var terminoBusqueda = '';

/* ------------------ Utils ------------------ */
function norm(s){
  s = (s == null ? '' : String(s));
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function escapeHTML(s){
  s = (s == null ? '' : String(s));
  return s.replace(/[&<>"']/g, function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
  });
}

// Copiar texto al portapapeles (con fallback)
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function(resolve) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(_) {}
    ta.remove();
    resolve();
  });
}

// URL absoluta de una guía a partir de su ruta relativa (ej: "guias/rodados-x.html")
function getAbsoluteGuideUrl(rel) {
  try {
    // base = carpeta donde vive index.html (…/src/main/webapp/)
    var base = location.href.replace(/\/index\.html.*$/,'/');
    return new URL(rel, base).href;
  } catch(_) {
    return rel;
  }
}

/* ------------------ Template guía por defecto ------------------ */
function buildGuideTemplate(titulo, categoria){
  const safeTitle = (titulo || 'Nuevo trámite');
  const safeCat   = (categoria || 'General');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeCat} — ${safeTitle}</title>
  <link rel="stylesheet" href="../assets/guia.css">
  <link rel="stylesheet" href="../assets/guia-edit.css">
</head>
<body>
  <!-- Barra superior -->
  <header class="guide-top">
    <div class="guide-top__inner">
      <a href="../index.html" class="back-pill">← Volver a Trámites</a>
      <h1 class="guide-title" data-editable>${safeCat} — ${safeTitle}</h1>
    </div>
  </header>

  <!-- Contenido -->
  <main class="container page-enter" data-editable>
    <!-- HERO -->
    <section class="card hero" data-editable>
      <p class="updated" data-editable>Última actualización: ${new Date().toLocaleDateString('es-AR', { month:'short', year:'numeric' })}</p>

      <div class="info-grid" data-editable>
        <div class="panel" data-editable>
          <h3 data-editable>Requisitos</h3>
          <ul data-editable>
            <li data-editable>Describí los requisitos acá…</li>
          </ul>
        </div>

        <div class="panel" data-editable>
          <h3 data-editable>Canales de atención</h3>
          <ul data-editable>
            <li data-editable>Presencial.</li>
            <li data-editable>Correo: <a href="mailto:amip@escobar.gob.ar">amip@escobar.gob.ar</a></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- PASOS -->
    <section class="card steps" data-editable>
      <h3 data-editable>Pasos del trámite</h3>
      <ol data-editable>
        <li data-editable>Completar este paso…</li>
      </ol>
    </section>

    <!-- COSTOS -->
    <section class="card costos" data-editable>
      <h3 data-editable>Costos y plazos</h3>
      <p data-editable>Indicar si tiene costo y en cuánto tiempo impacta…</p>
    </section>

    <div class="footer" data-editable>© AMIP</div>
  </main>

  <!-- Botón flotante / Guardar -->
  <button id="editToggle" class="fab" title="Editar">
    <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
  </button>
  <button id="saveGuide" class="save-btn" hidden>Guardar cambios</button>

  <script src="../assets/guia-edit.js"></script>
</body>
</html>`;
}

// Devuelve la URL raíz del proyecto (carpeta /src/main/webapp/)
function getAppRoot() {
  return location.href.replace(/\/index\.html.*$/,'/');
}

// Plantilla solo para VISUAL (usa rutas absolutas para que cargue dentro de blob:)
function buildGuideTemplateVisual(titulo, categoria) {
  var root = getAppRoot();
  var cssGuia   = root + 'assets/guia.css';
  var cssEdit   = root + 'assets/guia-edit.css';
  var jsEdit    = root + 'assets/guia-edit.js';
  var backIndex = root + 'index.html';

  var safeTitle = (titulo || 'Nuevo trámite');
  var safeCat   = (categoria || 'General');

  return (
`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeCat} — ${safeTitle}</title>
  <link rel="stylesheet" href="${cssGuia}">
  <link rel="stylesheet" href="${cssEdit}">
</head>
<body>
  <header class="guide-top">
    <div class="guide-top__inner">
      <a href="${backIndex}" class="back-pill">← Volver a Trámites</a>
      <h1 class="guide-title" data-editable>${safeCat} — ${safeTitle}</h1>
    </div>
  </header>

  <main class="container page-enter" data-editable>
    <section class="card hero" data-editable>
      <p class="updated" data-editable>Última actualización: ${new Date().toLocaleDateString('es-AR',{month:'short',year:'numeric'})}</p>

      <div class="info-grid" data-editable>
        <div class="panel" data-editable>
          <h3 data-editable>Requisitos</h3>
          <ul data-editable>
            <li data-editable>Describí los requisitos acá…</li>
          </ul>
        </div>

        <div class="panel" data-editable>
          <h3 data-editable>Canales de atención</h3>
          <ul data-editable>
            <li data-editable>Presencial.</li>
            <li data-editable>Correo: <a href="mailto:amip@escobar.gob.ar">amip@escobar.gob.ar</a></li>
          </ul>
        </div>
      </div>
    </section>

    <section class="card steps" data-editable>
      <h3 data-editable>Pasos del trámite</h3>
      <ol data-editable>
        <li data-editable>Completar este paso…</li>
      </ol>
    </section>

    <section class="card costos" data-editable>
      <h3 data-editable>Costos y plazos</h3>
      <p data-editable>Indicar si tiene costo y en cuánto tiempo impacta…</p>
    </section>

    <div class="footer" data-editable>© AMIP</div>
  </main>

  <button id="editToggle" class="fab" title="Editar">
    <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
  </button>
  <button id="saveGuide" class="save-btn" hidden>Guardar cambios</button>

  <script src="${jsEdit}"></script>
</body>
</html>`
  );
}

// Abre la guía VIRTUAL en modo visual (con rutas absolutas)
function openVisualTemplate(tramite){
  var html = buildGuideTemplateVisual(tramite.titulo, tramite.categoria);
  var blob = new Blob([html], { type:'text/html;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  window.open(url + '?edit=1#path=' + encodeURIComponent(tramite.guia), '_blank');
}

/* ------------------ Cargar JSON ------------------ */
function cargar(){
  try {
    fetch('data/tramites.json', { cache: 'no-store' })
      .then(function(res){
        if (!res.ok) throw new Error('No se pudo leer tramites.json');
        return res.json();
      })
      .then(function(raw){
        DATA = Array.isArray(raw) ? raw : (raw && raw.tramites ? raw.tramites : []);
      })
      .catch(function(e){
        console.warn('Fallo cargando tramites.json:', e && e.message);
        DATA = [];
      })
      .finally(function(){
        var tabDefaultBtn = null;
        for (var i=0;i<tabs.length;i++){
          if (tabs[i].classList.contains('active')) { tabDefaultBtn = tabs[i]; break; }
        }
        categoriaActual = tabDefaultBtn ? tabDefaultBtn.getAttribute('data-cat') : categoriaActual;

        var tieneItems = function(cat){
          var catn = norm(cat || '');
          for (var j=0;j<DATA.length;j++){
            if (norm(DATA[j].categoria || '') === catn) return true;
          }
          return false;
        };
        if (!tieneItems(categoriaActual)) {
          for (var k=0;k<tabs.length;k++){
            var c = tabs[k].getAttribute('data-cat');
            if (tieneItems(c)) { categoriaActual = c; break; }
          }
        }
        seleccionarCategoria(categoriaActual);
      });
  } catch (err){
    console.error('Error inesperado al cargar:', err);
    DATA = [];
    seleccionarCategoria(categoriaActual);
  }
}

/* ------------------ Tabs ------------------ */
function seleccionarCategoria(cat){
  categoriaActual = cat;
  for (var i=0;i<tabs.length;i++){
    var t = tabs[i];
    var active = (t.getAttribute('data-cat') === cat);
    if (active) t.classList.add('active'); else t.classList.remove('active');
    t.setAttribute('aria-selected', active ? 'true' : 'false');
  }
  render(true);
}

/* ------------------ Filtro ------------------ */
function filtrar(){
  var texto = norm((terminoBusqueda || '').trim());
  var cat = norm(categoriaActual);

  if (texto) {
    return DATA.filter(function(t){
      var titulo = norm(t.titulo || '');
      var categoria = norm(t.categoria || '');
      var resumen = norm(t.resumen || t.descripcion || '');
      var organismo = norm(t.organismo || '');
      var tagsArr = (t.tags || t.keywords || []);
      var tags = tagsArr.map ? tagsArr.map(norm).join(' ') : '';
      return [titulo, categoria, resumen, organismo, tags].some(function(s){ return s.indexOf(texto) !== -1; });
    });
  }
  return DATA.filter(function(t){ return norm(t.categoria || '') === cat; });
}

/* ------------------ Render ------------------ */
function render(scrollTop){
  scrollTop = !!scrollTop;
  var items = filtrar();
  if (lista) lista.innerHTML = '';

  if (!items.length) {
    if (vacio){
      var hasQ = (terminoBusqueda || '').trim() !== '';
      vacio.textContent = hasQ
        ? 'No hay resultados para “' + terminoBusqueda + '”.'
        : 'No hay trámites cargados en esta categoría.';
      vacio.hidden = false;
    }
    return;
  }
  if (vacio) vacio.hidden = true;

  for (var i=0;i<items.length;i++){
    var t = items[i];
    var li = document.createElement('li');
    li.className = 'item';

    var h3 = document.createElement('h3');
    h3.textContent = t.titulo || 'Trámite';

    var actions = document.createElement('div');
    actions.className = 'actions';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn primary options-btn';
    btn.textContent = 'Opciones';
    (function(tramite){
      btn.addEventListener('click', function(){ openOptions(tramite); });
    })(t);

    actions.appendChild(btn);
    li.appendChild(h3);
    li.appendChild(actions);
    if (lista) lista.appendChild(li);
  }

  if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ------------------ Modal Opciones ------------------ */
function openOptions(tramite){
  if (!modal) return;

  opTitle.textContent = 'Opciones';
  opSub.textContent   = tramite.titulo || '';
  opSub.hidden = !tramite.titulo;
  opActions.innerHTML = '';

  // 1) Guía de Trámite
  if (tramite.guia){
    const aGuia = document.createElement('a');
    aGuia.className = 'btn primary js-transition';
    aGuia.href = encodeURI(tramite.guia);
    aGuia.textContent = 'Guía de Trámite';
    aGuia.rel = 'noopener';
    opActions.appendChild(aGuia);
  }

  // 2) Editar (visual)
  const bEdit = document.createElement('button');
  bEdit.type = 'button';
  bEdit.className = 'icon-btn';
  bEdit.innerHTML = `
    <svg viewBox="0 0 24 24" class="ic"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33h-.5v-.5l9.06-9.06.5.5L5.92 19.58zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
    <span>Editar</span>`;
  bEdit.addEventListener('click', () => openEdit(tramite));
  opActions.appendChild(bEdit);

  // 3) Editar HTML
  if (tramite.guia){
    const bEditHtml = document.createElement('button');
    bEditHtml.type = 'button';
    bEditHtml.className = 'icon-btn';
    bEditHtml.innerHTML = `
      <svg viewBox="0 0 24 24" class="ic"><path d="M3.9 12 8 16.1 6.6 17.5 1.1 12l5.5-5.5L8 7.9 3.9 12zm16.2 0L16 7.9 17.4 6.5 22.9 12l-5.5 5.5L16 16.1l4.1-4.1zM9.5 19l5-14h2l-5 14h-2z"/></svg>
      <span>Editar HTML</span>`;
    bEditHtml.addEventListener('click', () => openEditHtml(tramite));
    opActions.appendChild(bEditHtml);
  }

  // 4) Copiar URL
  if (tramite.guia){
    const bCopy = document.createElement('button');
    bCopy.type = 'button';
    bCopy.className = 'icon-btn';
    bCopy.innerHTML = `
      <svg viewBox="0 0 24 24" class="ic"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 14H8V7h11v12z"/></svg>
      <span>Copiar URL</span>`;
    bCopy.addEventListener('click', async () => {
      const url = getAbsoluteGuideUrl(tramite.guia);
      try{
        await copyText(url);
        bCopy.classList.add('success');
        bCopy.querySelector('span').textContent = '¡Copiado!';
        setTimeout(()=>{ bCopy.classList.remove('success'); bCopy.querySelector('span').textContent='Copiar URL'; }, 1400);
      }catch(_){ alert(url); }
    });
    opActions.appendChild(bCopy);
  }

  // 5) Imprimir PDF
  if (tramite.guia){
    const bPrint = document.createElement('button');
    bPrint.type = 'button';
    bPrint.className = 'icon-btn';
    bPrint.innerHTML = `
      <svg viewBox="0 0 24 24" class="ic"><path d="M6 9V2h12v7H6zm10-2V4H8v3h8zM6 22v-5h12v5H6zm-2-7c-1.1 0-2-.9-2-2v-2a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2c0 1.1-.9 2-2 2h-1v-3H5v3H4z"/></svg>
      <span>Imprimir PDF</span>`;
    bPrint.addEventListener('click', () => {
      const url = getAbsoluteGuideUrl(tramite.guia);
      const p = url + (url.includes('?') ? '&' : '?') + 'autoprint=1';
      const w = window.open(p, '_blank', 'noopener');
      if (!w) alert('Permití ventanas emergentes para imprimir.');
    });
    opActions.appendChild(bPrint);
  }

  // 6) Eliminar (en memoria)
  const bDel = document.createElement('button');
  bDel.type = 'button';
  bDel.className = 'icon-btn danger';
  bDel.innerHTML = `
    <svg viewBox="0 0 24 24" class="ic"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-4h6l1 1h3v2H5V4h3l1-1z"/></svg>
    <span>Eliminar</span>`;
  bDel.addEventListener('click', () => deleteTramite(tramite));
  opActions.appendChild(bDel);

  showModal(); // <-- único showModal correcto
}

function showModal(){
  if (!modal) return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}
function closeModal(){
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
}
if (modal){
  modal.addEventListener('click', function(e){
    var target = e.target;
    if (target && (target.matches ? target.matches('[data-close], .modal-backdrop') :
                   (target.closest && (target.closest('[data-close]') || target.closest('.modal-backdrop'))))) {
      closeModal();
    }
  });
}
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });

/* ------------------ Transición suave a guía ------------------ */
document.addEventListener('click', function(e){
  var link = e.target && e.target.closest ? e.target.closest('a.js-transition') : null;
  if (!link) return;
  if (e.ctrlKey || e.metaKey || e.button === 1) return; // nueva pestaña
  e.preventDefault();
  closeModal();
  setTimeout(function(){
    document.body.classList.add('leaving');
    setTimeout(function(){ window.location.href = link.href; }, 220);
  }, 80);
});

/* ------------------ Editar guía (visual) ------------------ */
function openEdit(tramite){
  closeModal();
  if (!tramite.guia) return;

  // Si existe el archivo => ir a la guía real en modo edición
  // Si NO existe => abrir plantilla en modo visual (nuevo tab)
  fetch(tramite.guia, { cache: 'no-store' })
    .then(function(res){
      if (res.ok) {
        setTimeout(function(){
          document.body.classList.add('leaving');
          setTimeout(function(){ window.location.href = (tramite.guia + '?edit=1'); }, 220);
        }, 80);
      } else {
        openVisualTemplate(tramite);
      }
    })
    .catch(function(){
      openVisualTemplate(tramite);
    });
}

/* ------------------ Editar HTML (modal) ------------------ */
function openEditHtml(tramite, opts){
  closeModal();
  if (!tramite.guia) return;

  var url = tramite.guia;
  if (editSub) editSub.textContent = url;
  if (editArea) editArea.value = 'Cargando...';
  showEditModal();

  var useTemplate = opts && opts.forceTemplate;

  if (useTemplate) {
    if (editArea) editArea.value = buildGuideTemplate(tramite.titulo, tramite.categoria);
    if (btnDescargarHtml){
      btnDescargarHtml.onclick = function(){ downloadHtmlFile(url, editArea.value); };
    }
    // Botón para abrir en modo visual
    if (editModal){
      var actions = editModal.querySelector('.modal-actions');
      if (actions && !document.getElementById('btnAbrirVisual')){
        var b = document.createElement('button');
        b.id = 'btnAbrirVisual';
        b.type = 'button';
        b.className = 'btn secondary';
        b.textContent = 'Abrir en modo visual';
        b.addEventListener('click', function(){ openVisualTemplate(tramite); });
        actions.insertBefore(b, actions.lastElementChild);
      }
    }
    return;
  }

  fetch(url, { cache: 'no-store' })
    .then(function(res){
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function(html){
      if (editArea) editArea.value = html;
      if (btnDescargarHtml){
        btnDescargarHtml.onclick = function(){ downloadHtmlFile(url, editArea.value); };
      }
    })
    .catch(function(){
      if (editArea) editArea.value = buildGuideTemplate(tramite.titulo, tramite.categoria);
      if (btnDescargarHtml){
        btnDescargarHtml.onclick = function(){ downloadHtmlFile(url, editArea.value); };
      }
      if (editModal){
        var actions2 = editModal.querySelector('.modal-actions');
        if (actions2 && !document.getElementById('btnAbrirVisual')){
          var b2 = document.createElement('button');
          b2.id = 'btnAbrirVisual';
          b2.type = 'button';
          b2.className = 'btn secondary';
          b2.textContent = 'Abrir en modo visual';
          b2.addEventListener('click', function(){ openVisualTemplate(tramite); });
          actions2.insertBefore(b2, actions2.lastElementChild);
        }
      }
    });
}

function downloadHtmlFile(url, contents){
  var blob = new Blob([contents], { type:'text/html;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (url.split('/').pop() || 'guia.html');
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
  try { navigator.vibrate && navigator.vibrate(20); } catch(_){}
}

function showEditModal(){
  if (!editModal) return;
  editModal.classList.add('show');
  editModal.setAttribute('aria-hidden','false');
}
function closeEditModal(){
  if (!editModal) return;
  editModal.classList.remove('show');
  editModal.setAttribute('aria-hidden','true');
}
if (editModal){
  editModal.addEventListener('click', function(e){
    var target = e.target;
    if (target && (target.matches ? target.matches('[data-close], .modal-backdrop') :
                   (target.closest && (target.closest('[data-close]') || target.closest('.modal-backdrop'))))) {
      closeEditModal();
    }
  });
}
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeEditModal(); });

/* ------------------ Eventos UI ------------------ */
for (var ti=0; ti<tabs.length; ti++){
  (function(tab){
    tab.addEventListener('click', function(){
      terminoBusqueda = '';
      if (q) q.value = '';
      seleccionarCategoria(tab.getAttribute('data-cat'));
    });
  })(tabs[ti]);
}
if (btnBuscar){
  btnBuscar.addEventListener('click', function(){
    terminoBusqueda = q ? (q.value || '') : '';
    render(true);
  });
}
if (q){
  q.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){
      terminoBusqueda = q.value || '';
      render(true);
    }
  });
}

/* ------------------ Alta de trámite (en memoria) ------------------ */
function showAddModal(prefCat){
  if (!addModal) return;
  if (typeof prefCat === 'undefined' || prefCat == null) prefCat = categoriaActual;
  if (addCategoria) addCategoria.value = prefCat || 'Persona';
  if (addTitulo) addTitulo.value = '';
  addModal.classList.add('show');
  addModal.setAttribute('aria-hidden','false');
  setTimeout(function(){ if (addTitulo) addTitulo.focus(); }, 50);
}
function closeAddModal(){
  if (!addModal) return;
  addModal.classList.remove('show');
  addModal.setAttribute('aria-hidden','true');
}
if (btnAgregar){
  btnAgregar.addEventListener('click', function(){ showAddModal(); });
}
if (addModal){
  addModal.addEventListener('click', function(e){
    var target = e.target;
    if (target && (target.matches ? target.matches('[data-close], .modal-backdrop') :
                   (target.closest && (target.closest('[data-close]') || target.closest('.modal-backdrop'))))) {
      closeAddModal();
    }
  });
}
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeAddModal(); });

function slugify(s){
  s = (s == null ? '' : String(s));
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
    .slice(0,80);
}
if (addForm){
  addForm.addEventListener('submit', function(e){
    e.preventDefault();
    var cat = addCategoria ? (addCategoria.value || 'Persona') : 'Persona';
    var titulo = addTitulo ? (addTitulo.value || '').trim() : '';
    if (!titulo) return;

    var slug = slugify(titulo);
    var nuevo = {
      titulo: titulo,
      categoria: cat,
      guia: 'guias/' + slug + '.html'
      // iniciar: 'https://...' (si aplica)
    };

    DATA.push(nuevo);
    terminoBusqueda = '';
    if (q) q.value = '';
    seleccionarCategoria(cat);
    closeAddModal();
    try { navigator.vibrate && navigator.vibrate(20); } catch(_){}
    console.log('Trámite agregado:', nuevo);

    // Abrir editor HTML con la plantilla para crear el archivo
    openEditHtml(nuevo, { forceTemplate: true });
  });
}

/* ------------------ Eliminar (en memoria) ------------------ */
function deleteTramite(tramite){
  var ok = window.confirm('¿Eliminar “' + (tramite.titulo || '') + '” de ' + (tramite.categoria || '') + '? Esta acción afecta sólo esta sesión.');
  if (!ok) return;
  DATA = DATA.filter(function(t){
    return !(t.titulo === tramite.titulo && t.categoria === tramite.categoria);
  });
  closeModal();
  terminoBusqueda = '';
  if (q) q.value = '';
  render(true);
}

/* ------------------ Init ------------------ */
document.addEventListener('DOMContentLoaded', cargar);
