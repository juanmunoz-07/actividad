// Panel de Gestión de Usuarios: consumo de API y operaciones CRUD en memoria.

// Referencias a elementos del DOM.
const formulario = document.querySelector("#formularioUsuario");
const campoId = document.querySelector("#id");
const campoNombre = document.querySelector("#nombre");
const campoCorreo = document.querySelector("#correo");
const campoCiudad = document.querySelector("#ciudad");
const campoBusqueda = document.querySelector("#busqueda");
const cuerpoTabla = document.querySelector("#cuerpoTabla");
const mensaje = document.querySelector("#mensaje");
const totalUsuarios = document.querySelector("#totalUsuarios");
const botonEnviar = document.querySelector("#botonEnviar");
const botonCancelar = document.querySelector("#botonCancelar");
const tituloFormulario = document.querySelector("#tituloFormulario");
const sinResultados = document.querySelector("#sinResultados");

// Array principal: los cambios se conservan mientras la página está abierta.
let usuarios = [];
let idEnEdicion = null;

// Muestra mensajes de carga, éxito o error.
const mostrarMensaje = (texto, tipo = "normal") => {
  mensaje.textContent = texto;
  mensaje.className = "mensaje";
  if (tipo === "exito") mensaje.classList.add("exito");
  if (tipo === "error") mensaje.classList.add("error");
};

// Convierte los objetos de JSONPlaceholder al formato que utiliza el panel.
const transformarUsuarios = (datos) => datos.map(({ id, name, email, address }) => ({
  id,
  nombre: name,
  correo: email,
  ciudad: address.city
}));

// Consulta la API al iniciar la página.
const cargarUsuarios = async () => {
  mostrarMensaje("Cargando usuarios desde la API...");
  try {
    const respuesta = await fetch("https://jsonplaceholder.typicode.com/users");
    if (!respuesta.ok) throw new Error("La respuesta del servidor no fue correcta.");
    const datos = await respuesta.json();
    usuarios = transformarUsuarios(datos);
    console.log("Lista completa de usuarios:", JSON.stringify(usuarios, null, 2));
    dibujarTabla();
    mostrarMensaje(`Se cargaron ${usuarios.length} usuarios correctamente.`, "exito");
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    mostrarMensaje("No fue posible cargar los usuarios. Revisa tu conexión e inténtalo de nuevo.", "error");
    dibujarTabla();
  }
};

// Dibuja la tabla usando filter() para la búsqueda sin alterar el array original.
const dibujarTabla = () => {
  const texto = campoBusqueda.value.trim().toLowerCase();
  const usuariosVisibles = usuarios.filter(({ nombre }) => nombre.toLowerCase().includes(texto));

  cuerpoTabla.innerHTML = "";
  totalUsuarios.textContent = usuarios.length;
  sinResultados.classList.toggle("oculto", usuariosVisibles.length > 0);

  // Bucle solicitado: cuenta los usuarios por ciudad.
  const conteoCiudades = {};
  for (const usuario of usuarios) {
    conteoCiudades[usuario.ciudad] = (conteoCiudades[usuario.ciudad] || 0) + 1;
  }
  console.log("Cantidad de usuarios por ciudad:", conteoCiudades);

  usuariosVisibles.forEach(({ id, nombre, correo, ciudad }) => {
    const fila = document.createElement("tr");
    // Template string para construir cada fila.
    fila.innerHTML = `
      <td>${id}</td>
      <td>${escaparHTML(nombre)}</td>
      <td>${escaparHTML(correo)}</td>
      <td>${escaparHTML(ciudad)}</td>
      <td>
        <div class="grupo-botones">
          <button type="button" class="boton boton-editar" data-accion="editar" data-id="${id}">Editar</button>
          <button type="button" class="boton boton-eliminar" data-accion="eliminar" data-id="${id}">Eliminar</button>
        </div>
      </td>`;
    cuerpoTabla.appendChild(fila);
  });
};

// Evita que texto introducido por una persona se interprete como HTML.
const escaparHTML = (texto) => String(texto)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

// Limpia el formulario y sale del modo edición.
const limpiarFormulario = () => {
  formulario.reset();
  campoId.disabled = false;
  idEnEdicion = null;
  botonEnviar.textContent = "Agregar usuario";
  botonCancelar.classList.add("oculto");
  tituloFormulario.textContent = "Agregar usuario";
};

// Valida y procesa el envío del formulario.
formulario.addEventListener("submit", (event) => {
  event.preventDefault();

  const idTexto = campoId.value.trim();
  const nombre = campoNombre.value.trim();
  const correo = campoCorreo.value.trim();
  const ciudad = campoCiudad.value.trim();

  // Recorre los campos para comprobar que ninguno esté vacío.
  const valores = [idTexto, nombre, correo, ciudad];
  let hayCampoVacio = false;
  for (const valor of valores) {
    if (valor === "") hayCampoVacio = true;
  }

  if (hayCampoVacio) {
    mostrarMensaje("Completa todos los campos antes de continuar.", "error");
    return;
  }

  if (!correo.includes("@")) {
    mostrarMensaje("Escribe un correo electrónico válido que contenga @.", "error");
    return;
  }

  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) {
    mostrarMensaje("El ID debe ser un número entero positivo.", "error");
    return;
  }

  // Switch para seleccionar el tipo de operación.
  switch (idEnEdicion === null ? "agregar" : "editar") {
    case "agregar": {
      if (usuarios.some((usuario) => usuario.id === id)) {
        mostrarMensaje(`Ya existe un usuario con el ID ${id}.`, "error");
        return;
      }
      usuarios.push({ id, nombre, correo, ciudad });
      mostrarMensaje(`El usuario ${nombre} se agregó correctamente.`, "exito");
      break;
    }
    case "editar": {
      usuarios = usuarios.map((usuario) => usuario.id === idEnEdicion
        ? { ...usuario, nombre, correo, ciudad }
        : usuario);
      mostrarMensaje(`Los datos de ${nombre} se actualizaron correctamente.`, "exito");
      break;
    }
    default:
      mostrarMensaje("No se pudo completar la operación.", "error");
      return;
  }

  console.log("Lista completa de usuarios:", JSON.stringify(usuarios, null, 2));
  dibujarTabla();
  limpiarFormulario();
});

// Buscador en vivo.
campoBusqueda.addEventListener("input", () => {
  dibujarTabla();
});

// Delegación de eventos para los botones Editar y Eliminar.
cuerpoTabla.addEventListener("click", (event) => {
  const boton = event.target.closest("button[data-accion]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === "editar") {
    const usuario = usuarios.find((elemento) => elemento.id === id);
    if (!usuario) {
      mostrarMensaje("No se encontró el usuario que deseas editar.", "error");
      return;
    }

    campoId.value = usuario.id;
    campoNombre.value = usuario.nombre;
    campoCorreo.value = usuario.correo;
    campoCiudad.value = usuario.ciudad;
    campoId.disabled = true;
    idEnEdicion = usuario.id;
    botonEnviar.textContent = "Guardar cambios";
    botonCancelar.classList.remove("oculto");
    tituloFormulario.textContent = "Modificar usuario";
    mostrarMensaje(`Editando los datos de ${usuario.nombre}.`);
    formulario.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (accion === "eliminar") {
    const usuario = usuarios.find((elemento) => elemento.id === id);
    if (!usuario) return;

    if (confirm(`¿Seguro que deseas eliminar a ${usuario.nombre}?`)) {
      usuarios = usuarios.filter((elemento) => elemento.id !== id);
      if (idEnEdicion === id) limpiarFormulario();
      console.log("Lista completa de usuarios:", JSON.stringify(usuarios, null, 2));
      dibujarTabla();
      mostrarMensaje(`El usuario ${usuario.nombre} fue eliminado.`, "exito");
    }
  }
});

// Cancela la edición sin modificar la lista.
botonCancelar.addEventListener("click", () => {
  limpiarFormulario();
  mostrarMensaje("Se canceló la edición.");
});

// Inicia la carga de datos.
cargarUsuarios();
