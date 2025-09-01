const lista = document.getElementById('listaTramites');
const vacio = document.getElementById('vacio');
const tabs = [...document.querySelectorAll('.tab')];
const q = document.getElementById('q');
const btnBuscar = document.getElementById('btnBuscar');

// Modal elems (asegurate de tenerlos en el index)
const modal = document.getElementById('opModal');
const opTitle = document.getElementById('opTitle');
const opSub = document.getElementById('opSub');
const opActions = document.getElementById('opActions');

let DATA = [];
let categoriaActual = 'Persona';
let terminoBusqueda = '';

// Carga JSON
async function cargar() {
  try {
    const res = await fetch('data/tramites.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo leer tramites.json');
    DATA = await res.json();
  } catch (e) {
    console.warn('Fallo cargando tramites.json:', e.message);
    DATA = [];
  }
  seleccionarCategoria('Persona');
}

// Tabs
function seleccionarCategoria(cat){
  categoriaActual = cat;
  tabs.forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
  render(true);
}

// Filtro (global si hay búsqueda)
function filtrar(){
  const texto = (terminoBusqueda || '').trim().toLowerCase();
  if (texto !== '') {
    return DATA.filter(t =>
      (t.titulo && t.titulo.toLowerCase().includes(texto)) ||
      (t.categoria && t.categoria.toLowerCase().includes(texto))
    );
  }
  return DATA.filter(t => t.categoria === categoriaActual);
}

// Render (ahora con botón único "Opciones")
function render(scrollTop = false){
  const items = filtrar();
  lista.innerHTML = '';

  if (items.length === 0) {
    vacio.textContent = (terminoBusqueda.trim() !== '')
      ? `No hay resultados para “${terminoBusqueda}”.`
      : 'No hay trámites cargados en esta categoría.';
    vacio.hidden = false;
    return;
  }
  vacio.hidden = true;

  for (const t of items){
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <h3>${t.titulo}</h3>
      <div class="actions">
        <button class="btn primary options-btn" type="button">Opciones</button>
      </div>
    `;
    li.querySelector('.options-btn').addEventListener('click', () => openOptions(t));
    lista.appendChild(li);
  }

  if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===== Modal: abrir con acciones dinámicas ===== */
function openOptions(tramite){
  if (!modal) return; // por si faltara el markup

  opTitle.textContent = 'Opciones';
  opSub.textContent = tramite.titulo;
  opActions.innerHTML = '';

  // Guía de Trámite (siempre)
  const aGuia = document.createElement('a');
  aGuia.className = 'btn primary js-transition';
  aGuia.href = tramite.guia;
  aGuia.textContent = 'Guía de Trámite';
  opActions.appendChild(aGuia);

  // Iniciar Trámite (si existe)
  if (tramite.iniciar){
    const aIniciar = document.createElement('a');
    aIniciar.className = 'btn secondary';
    aIniciar.href = tramite.iniciar;
    aIniciar.target = '_blank';
    aIniciar.rel = 'noopener';
    aIniciar.textContent = 'Iniciar Trámite';
    opActions.appendChild(aIniciar);
  }

  showModal();
}

function showModal(){
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}

function closeModal(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
}

// cerrar modal con backdrop o botón con data-close
modal?.addEventListener('click', (e)=>{
  if (e.target.matches('[data-close], .modal-backdrop')) closeModal();
});
// cerrar con ESC
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeModal(); });

/* ===== Transición suave al ir a la guía (desde modal o lista) ===== */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a.js-transition');
  if (!link) return;

  // si abre en nueva pestaña (Ctrl/⌘ o botón medio), no interceptar
  if (e.ctrlKey || e.metaKey || e.button === 1) return;

  e.preventDefault();
  closeModal();
  setTimeout(() => {
    document.body.classList.add('leaving');   // usa las CSS de animación
    setTimeout(() => { window.location.href = link.href; }, 220);
  }, 80);
});

// Eventos UI
tabs.forEach(tab => tab.addEventListener('click', () => {
  terminoBusqueda = '';
  q.value = '';
  seleccionarCategoria(tab.dataset.cat);
}));

btnBuscar.addEventListener('click', () => {
  terminoBusqueda = q.value;
  render(true);
});

q.addEventListener('keydown', (e) => {
  if (e.key === 'Enter'){
    terminoBusqueda = q.value;
    render(true);
  }
});

// Init
cargar();
