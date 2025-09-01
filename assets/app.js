const lista = document.getElementById('listaTramites');
const vacio = document.getElementById('vacio');
const tabs = [...document.querySelectorAll('.tab')];
const q = document.getElementById('q');
const btnBuscar = document.getElementById('btnBuscar');

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

// Render
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
        <a class="btn primary js-transition" href="${t.guia}">Guía de Trámite</a>
      </div>
    `;
    lista.appendChild(li);
  }

  if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}

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

// Transición suave al ir a la guía
document.addEventListener('click', (e) => {
  const link = e.target.closest('a.js-transition');
  if (!link) return;

  // si abre en nueva pestaña (Ctrl/⌘ o botón medio), no interceptar
  if (e.ctrlKey || e.metaKey || e.button === 1) return;

  e.preventDefault();
  document.body.classList.add('leaving');   // usa las CSS de animación
  setTimeout(() => { window.location.href = link.href; }, 220);
});

// Init
cargar();
