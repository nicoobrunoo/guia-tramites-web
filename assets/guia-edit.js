// guia-edit.js — Edición visual de guías (fix: editables dinámicos + key por #path)

(function () {
  const btnToggle = document.getElementById('editToggle'); // botón lápiz
  const btnSave   = document.getElementById('saveGuide');  // botón Guardar
  const main = document.querySelector('main.container');
  if (!main) return;

  // ⚠️ IMPORTANTE: no cachear los editables; obtenerlos siempre del DOM actual
  const getEditables = () => Array.prototype.slice.call(document.querySelectorAll('[data-editable]'));

  // Leer parámetro desde el hash (ej: #path=guias/slug.html)
  function getHashParam(name){
    const h = window.location.hash || '';
    const m = h.match(new RegExp('(?:^|[&#?])' + name + '=([^&]+)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Clave por ruta para cambios locales (usa #path si viene)
  const STORAGE_KEY = 'guia:' + (getHashParam('path') || location.pathname);

  // ---- Restaurar cambios locales (si existen) ----
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Reemplaza el contenido del <main> completo
      main.innerHTML = saved;
    }
  } catch {}

  let editMode = false;

  function setEditMode(on) {
    editMode = !!on;

    // Siempre tomar los nodos vigentes
    const editables = getEditables();

    for (let i = 0; i < editables.length; i++) {
      const el = editables[i];
      el.contentEditable = on ? 'true' : 'false';
      el.classList.toggle('editing', on);
      if (on) el.setAttribute('aria-label', el.getAttribute('aria-label') || 'Se puede editar');
      else el.removeAttribute('aria-label');
    }

    if (btnSave) btnSave.hidden = !on;
    if (btnToggle) btnToggle.title = on ? 'Salir de edición' : 'Editar';
    document.documentElement.classList.toggle('editing-on', on);
  }

  // Activar si viene ?edit=1 o #edit
  const url = new URL(window.location.href);
  if (url.searchParams.get('edit') === '1' || window.location.hash === '#edit') {
    setEditMode(true);
  }

  // Toggle edición
  btnToggle?.addEventListener('click', () => setEditMode(!editMode));

  // Guardar
  btnSave?.addEventListener('click', saveGuide);

  // Atajos
  document.addEventListener('keydown', (e) => {
    const key = (e.key || '').toLowerCase();
    const mod = e.ctrlKey || e.metaKey;

    if (mod && key === 'e') { e.preventDefault(); setEditMode(!editMode); }
    if (mod && key === 's') { 
      if (!btnSave?.hidden) { e.preventDefault(); saveGuide(); }
    }
  });

  function saveGuide() {
    const wasEditing = editMode;
    if (wasEditing) setEditMode(false);

    // Persistir solo el contenido del main
    try { localStorage.setItem(STORAGE_KEY, main.innerHTML); } catch {}

    // Exportar HTML completo con el main actualizado
    const doc = document.documentElement.cloneNode(true);
    const clonedMain = doc.querySelector('main.container');
    if (clonedMain) clonedMain.innerHTML = main.innerHTML;

    // Limpiar rastros de edición
    doc.querySelectorAll('[data-editable]').forEach(n => {
      n.removeAttribute('contenteditable');
      n.classList.remove('editing');
      n.removeAttribute('aria-label');
    });
    doc.documentElement.classList.remove('editing-on');

    // Remover herramientas de edición del export
    doc.querySelectorAll('script[src*="guia-edit.js"]').forEach(s => s.remove());
    doc.getElementById('editToggle')?.remove();
    doc.getElementById('saveGuide')?.remove();

    const fullHTML = '<!doctype html>\n' + doc.outerHTML;
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (location.pathname.split('/').pop() || 'guia.html');
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
    try { navigator.vibrate?.(20); } catch {}

    // Volver al estado anterior si hacía falta
    if (wasEditing) setEditMode(true);
  }

  // Utilidad para limpiar cambios locales (podés correrlo desde consola)
  window.__clearLocalGuide = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    location.reload();
  };
  // Auto imprimir si viene ?autoprint=1
try{
  const urlParams = new URL(window.location.href).searchParams;
  if (urlParams.get('autoprint') === '1'){
    // esperamos un toque para que cargue fuentes/estilos
    setTimeout(() => window.print(), 400);
  }
}catch(_){}

})();
