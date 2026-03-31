const elementos = {
  estado: document.querySelector("#estadoApp"),
  total: document.querySelector("#totalResultados"),
  ultimaAccion: document.querySelector("#ultimaAccion"),
  lista: document.querySelector("#listaRecetas"),
  plantilla: document.querySelector("#plantillaTarjeta"),
  idReceta: document.querySelector("#idReceta"),
  filtroDificultad: document.querySelector("#filtroDificultad"),
  btnBuscarId: document.querySelector("#btnBuscarId"),
  btnFiltrar: document.querySelector("#btnFiltrar"),
  btnListar: document.querySelector("#btnListar"),
  btnLimpiar: document.querySelector("#btnLimpiar")
};

const URL_BASE = "/api/recetas";

function establecerEstado(mensaje, esError = false) {
  elementos.estado.textContent = mensaje;
  elementos.estado.style.background = esError ? "#ffe6e6" : "#fbf4ee";
  elementos.estado.style.color = esError ? "#8d1f1f" : "#64361f";
}

function actualizarResumen(cantidad, accion) {
  elementos.total.textContent = String(cantidad);
  elementos.ultimaAccion.textContent = accion;
}

function vaciarLista() {
  elementos.lista.innerHTML = "";
}

function crearTarjeta(receta) {
  const fragmento = elementos.plantilla.content.cloneNode(true);
  const imagen = fragmento.querySelector(".tarjeta-imagen");
  const chipId = fragmento.querySelector(".chip-id");
  const chipDificultad = fragmento.querySelector(".chip-dificultad");
  const titulo = fragmento.querySelector(".tarjeta-titulo");
  const descripcion = fragmento.querySelector(".tarjeta-descripcion");
  const datos = fragmento.querySelector(".tarjeta-datos");
  const ingredientes = fragmento.querySelector(".lista-ingredientes");
  const pasos = fragmento.querySelector(".lista-pasos");

  imagen.src = receta.imagenUrl;
  imagen.alt = `Imagen de ${receta.titulo}`;
  chipId.textContent = `ID ${receta.id}`;
  chipDificultad.textContent = receta.nivelDificultad;
  titulo.textContent = receta.titulo;
  descripcion.textContent = receta.descripcion;

  const datoTiempo = document.createElement("span");
  datoTiempo.textContent = `Tiempo: ${receta.tiempoPreparacion}`;
  const datoPorciones = document.createElement("span");
  datoPorciones.textContent = `Porciones: ${receta.porciones}`;
  datos.append(datoTiempo, datoPorciones);

  receta.ingredientes.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ingredientes.appendChild(li);
  });

  receta.pasos.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    pasos.appendChild(li);
  });

  return fragmento;
}

function renderizarRecetas(recetas) {
  vaciarLista();

  if (!recetas.length) {
    const vacio = document.createElement("p");
    vacio.textContent = "No hay recetas para mostrar.";
    elementos.lista.appendChild(vacio);
    return;
  }

  const fragmento = document.createDocumentFragment();
  recetas.forEach((receta) => {
    fragmento.appendChild(crearTarjeta(receta));
  });
  elementos.lista.appendChild(fragmento);
}

async function solicitarRecetas(query = "") {
  const url = query ? `${URL_BASE}?${query}` : URL_BASE;
  const respuesta = await fetch(url);
  const contenido = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(contenido.error || "Error desconocido al consultar la API.");
  }

  return Array.isArray(contenido) ? contenido : [contenido];
}

async function cargarTodas() {
  try {
    establecerEstado("Consultando todas las recetas...");
    const recetas = await solicitarRecetas();
    renderizarRecetas(recetas);
    actualizarResumen(recetas.length, "Listado completo");
    establecerEstado(`Consulta exitosa: ${recetas.length} recetas encontradas.`);
  } catch (error) {
    renderizarRecetas([]);
    actualizarResumen(0, "Error en listado");
    establecerEstado(error.message, true);
  }
}

async function buscarPorId() {
  const id = elementos.idReceta.value.trim();

  if (!id) {
    establecerEstado("Ingresa un ID para buscar.", true);
    return;
  }

  try {
    establecerEstado(`Buscando receta con ID ${id}...`);
    const recetas = await solicitarRecetas(`id=${encodeURIComponent(id)}`);
    renderizarRecetas(recetas);
    actualizarResumen(recetas.length, `Búsqueda por ID ${id}`);
    establecerEstado("Consulta por ID completada.");
  } catch (error) {
    renderizarRecetas([]);
    actualizarResumen(0, `Error en ID ${id}`);
    establecerEstado(error.message, true);
  }
}

async function filtrarPorDificultad() {
  const dificultad = elementos.filtroDificultad.value;

  if (!dificultad) {
    establecerEstado("Selecciona una dificultad para filtrar.", true);
    return;
  }

  try {
    establecerEstado(`Filtrando recetas por dificultad ${dificultad}...`);
    const recetas = await solicitarRecetas(
      `dificultad=${encodeURIComponent(dificultad)}`
    );
    renderizarRecetas(recetas);
    actualizarResumen(recetas.length, `Filtro por ${dificultad}`);
    establecerEstado(`Filtro aplicado para ${dificultad}.`);
  } catch (error) {
    renderizarRecetas([]);
    actualizarResumen(0, `Error en filtro ${dificultad}`);
    establecerEstado(error.message, true);
  }
}

function limpiarFiltros() {
  elementos.idReceta.value = "";
  elementos.filtroDificultad.value = "";
  establecerEstado("Filtros limpiados. Mostrando listado completo...");
  cargarTodas();
}

elementos.btnListar.addEventListener("click", cargarTodas);
elementos.btnBuscarId.addEventListener("click", buscarPorId);
elementos.btnFiltrar.addEventListener("click", filtrarPorDificultad);
elementos.btnLimpiar.addEventListener("click", limpiarFiltros);

cargarTodas();
