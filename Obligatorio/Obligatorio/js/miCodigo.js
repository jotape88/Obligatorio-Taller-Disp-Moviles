/******************************
 * Inicialización
 ******************************/
ons.ready(todoCargado)

function todoCargado() {
    yNavigator = document.querySelector('#myNavigator');
    // inicializar();
}

function navegar(paginaDestino, resetStack, datos) {
    if (resetStack) {
        myNavigator.resetToPage(`${paginaDestino}.html`)
    } else {
        myNavigator.pushPage(`${paginaDestino}.html`, { data: datos })
    }
    cerrarMenu();
}

function navegarAtras() {
    myNavigator.popPage();
    cerrarMenu();
}

//TODO: Borrar esta funcion
// Agrego evento a los botones del menú y de las pantallas.
function agregarEventosEnBotones() {
    // Menu
    $("#btnMenuLogin").click(menuLoginHandler);
    $("#btnMenuRegistro").click(menuRegistroHandler);
    $("#btnMenuLogout").click(menuLogoutHandler);
    // Registro
    $("#btnRegistroRegistrarse").click(registroRegistrarseHandler);
    // Login
    $("#btnLoginIniciarSesion").click(loginIniciarSesionHandler);
    // Detalle receta
    $("#btnDetalleRecetaVolver").click(function () { mostrarHome(); });
}

// Oculto todo y muestro lo que corresponda.
function inicializar() {
    // Oculto todo.
    ocultarSecciones();
    ocultarOpcionesMenu();
    // Chequeo si en el localStorage hay token guardado.
    tokenGuardado = window.localStorage.getItem("APPRecetasToken");
    // Al chequeo de la sesión, le paso como parámetro una función anónima que dice qué hacer después.
    chequearSesion(function () {
        // Muestro lo que corresponda en base a si hay o no usuario logueado.
        if (!usuarioLogueado) {
            mostrarLogin();
            mostrarMenuInvitado();
        } else {
            mostrarHome();
            mostrarMenuUsuarioAutenticado();
        }
    });
}

/******************************
 * Variables globales
 ******************************/
// API
const urlBase = 'https://recetas-api-taller.herokuapp.com/api/';
// Sesión
let usuarioLogueado;
let tokenGuardado;
// Recetas
const recetas = [];

/******************************
 * Funcionalidades del sistema
 ******************************/
/* Menu */



function vaciarTodosLosCampos() {
    // Registro
    $("#txtRegistroNombre").val("");
    $("#txtRegistroApellido").val("");
    $("#txtRegistroDireccion").val("");
    $("#txtRegistroEmail").val("");
    $("#txtRegistroPassword").val("");
    $("#pRegistroMensajes").html("");
    // Login
    $("#txtLoginEmail").val("");
    $("#txtLoginPassword").val("");
    $("#pLoginMensajes").html("");
    // Home
    $("#tablaTbodyHomeRecetas").html("");
    $("#tablaHomeRecetas").hide();
    $("#pHomeMensajes").html("");
    //Detalle receta
    $("#h2DetaleRecetaNombre").html("");
    $("#imgDetalleRecetaImagen").attr("src", "");
    $("#tablaTbodyDetalleReceta").html("");
    $("#pDetalleRecetaPreparacion").html("");
    $("#divDetalleRecetaOtrosDatos").html("");
    $("#pDetalleRecetaMensajes").html("");
    $("#divDetalleRecetaContenido").hide();
}



function mostrarDetalleReceta(recetaId) {
    ocultarSecciones();
    vaciarTodosLosCampos();
    // Le paso 2 parámetros, el id de la receta que quiero mostrar y una función de callback
    cargarDetalleReceta(recetaId, function () {
        $("#divDetalleReceta").show();
    });
}

/* Sesión */
function chequearSesion(despuesDeChequearSesion) {
    // Asumo que no hay usuario logueado y en caso de que si, lo actualizo.
    usuarioLogueado = null;

    if (tokenGuardado) {
        // Hago la llamada ajax usando el endpoint de validación de token que me retorna el usuario.
        $.ajax({
            type: 'GET',
            url: urlBase + 'usuarios/session',
            contentType: "application/json",
            /**
             * El beforeSend lo uso para cargar el token en el header de la petición y
             * lo hago mediente la función cargarTokenEnRequest. Esta función se va a
             * ejecutar antes de enviar la petición (beforeSend).
             * Esto se debe hacer porque el header mediante el que se manda el token
             * es un header personalizado (usualmente comienzan por x-).
             */
            beforeSend: cargarTokenEnRequest,
            // Volvemos a utilizar una función anónima.
            success: function (response) {
                usuarioLogueado = new Usuario(response._id, response.nombre, response.apellido, response.email, response.direccion, null);
            },
            error: errorCallback,
            complete: despuesDeChequearSesion
        });
    } else {
        // Si no tengo token guardado, el usuarioLogueado no se actualiza (queda null) y sigo de largo.
        despuesDeChequearSesion();
    }
}

// Carga el token en el header de la petición.
// Si quiero que la petición esté autenticada, debo llamarla en el beforeSend de la llamada ajax.
function cargarTokenEnRequest(jqXHR) {
    jqXHR.setRequestHeader("x-auth", tokenGuardado);
}

function cerrarSesion() {
    // Así remuevo específicamente el token guardado.
    // window.localStorage.removeItem("APPRecetasToken");
    // Así vacío todo lo que haya guardado.
    window.localStorage.clear();
    inicializar();
}

/* Registro */
function registroRegistrarseHandler() {
    $("#pRegistroMensajes").html("");

    let nombreIngresado = $("#txtRegistroNombre").val();
    let apellidoIngresado = $("#txtRegistroApellido").val();
    let direccionIngresada = $("#txtRegistroDireccion").val();
    let emailIngresado = $("#txtRegistroEmail").val();
    let passwordIngresado = $("#txtRegistroPassword").val();

    // TODO: Faltan validaciones:
    // Agregar un segundo campo de password para la verificación del mismo.
    // Todos los campos son obligatorios.
    // El password debe tener como mínimo 8 caracteres.
    // El correo debe tener un formato válido.
    // El correo debe ser único en el sistema (no se puede validar). 
    const datosUsuario = {
        nombre: nombreIngresado,
        apellido: apellidoIngresado,
        direccion: direccionIngresada,
        email: emailIngresado,
        password: passwordIngresado
    };

    $.ajax({
        type: 'POST',
        url: urlBase + 'usuarios',
        contentType: "application/json",
        data: JSON.stringify(datosUsuario),
        // Lo que se debe hacer es tan poco, que lo dejo en una función anónima.
        success: function () {
            alert("El usuario ha sido creado correctamente");
            navegar('login', true)
        },
        error: errorCallback
    })
}

/* Login */
function loginIniciarSesionHandler() {
    $("#pLoginMensajes").html("");

    let emailIngresado = $("#txtLoginEmail").val();
    let passwordIngresado = $("#txtLoginPassword").val();

    // TODO: Faltan validaciones:
    // Todos los campos son obligatorios.
    // El password debe tener como mínimo 8 caracteres.
    // El correo debe tener un formato válido.
    const datosUsuario = {
        email: emailIngresado,
        password: passwordIngresado
    };

    $.ajax({
        type: 'POST',
        url: urlBase + 'usuarios/session',
        contentType: "application/json",
        data: JSON.stringify(datosUsuario),
        success: iniciarSesion,
        error: errorCallback
    })
}

function iniciarSesion(dataUsuario) {
    usuarioLogueado = new Usuario(dataUsuario._id, dataUsuario.nombre, dataUsuario.apellido, dataUsuario.email, dataUsuario.direccion, null);
    tokenGuardado = dataUsuario.token;
    localStorage.setItem("APPRecetasToken", tokenGuardado);
    //mostrarHome();
    //mostrarMenuUsuarioAutenticado();
    navegar('home', true, dataUsuario)
}

/* Home */
function cargarListadoRecetas(despuesDeCargarListadoRecetas) {
    $("#pHomeMensajes").html("");

    $.ajax({
        type: 'GET',
        url: urlBase + 'recetas',
        /**
         * El beforeSend lo uso para cargar el token en el header de la petición y
         * lo hago mediente la función cargarTokenEnRequest. Esta función se va a
         * ejecutar antes de enviar la petición (beforeSend).
         * Esto se debe hacer porque el header mediante el que se manda el token
         * es un header personalizado (usualmente comienzan por x-).
         */
        beforeSend: cargarTokenEnRequest,
        success: crearListadoRecetas,
        error: errorCallback,
        complete: despuesDeCargarListadoRecetas
    })
}

function crearListadoRecetas(dataRecetas) {
    // Vacío el array de recetas.
    recetas.splice(0, recetas.length);
    if (dataRecetas && dataRecetas.length > 0) {
        // Si hay recetas completo y muestro la tabla.
        let filas = ``;
        for (let i = 0; i < dataRecetas.length; i++) {
            let unaReceta = dataRecetas[i];
            let usuarioRecetaObjeto = new Usuario(unaReceta.usuario._id, unaReceta.usuario.nombre, unaReceta.usuario.apellido, unaReceta.usuario.email, unaReceta.usuario.direccion, null);
            let unaRecetaObjeto = new Receta(unaReceta._id, unaReceta.fecha, unaReceta.nombre, unaReceta.ingredientes, unaReceta.preparacion, unaReceta.urlImagen, usuarioRecetaObjeto);
            // Agrego la receta a mi array de recetas.
            recetas.push(unaRecetaObjeto);
            filas += `
                <tr>
                    <td><img onError="imgError(this);" src="${unaRecetaObjeto.urlImagen}" width="50"></td>
                    <td class="tdRecetaNombre" recetaId="${unaRecetaObjeto._id}">${unaRecetaObjeto.nombre}</td>
                    <td>${unaRecetaObjeto.usuario.nombre}</td>
                    <td><input class="btnRecetaFavorito" recetaId="${unaRecetaObjeto._id}" type="button" value="${obtenerNombreBotonFavorito(unaRecetaObjeto)}"></td>
                </tr>
            `;
        }
        // TODO: Estaría bueno revisar los favoritos para ver si hay en favoritos alguna receta que ya no esté en la base de datos para borrarla.
        $("#tablaTbodyHomeRecetas").html(filas);
        $("#tablaHomeRecetas").show();
        $(".btnRecetaFavorito").click(btnRecetaFavoritoHandler);
        $(".tdRecetaNombre").click(tdRecetaNombreHandler);
    } else {
        // Si no hay recetas, aviso que no hay recetas.
        $("#pHomeMensajes").html("No se encontraron recetas.");
    }
}

/**
 * Función que se encarga de sustituir el src de las imágenes por la de placeholder en caso de tener un src inválido.
 * Se ejecuta desde el evento onError de las etiquetas img.
 */
function imgError(img) {
    $(img).attr("src", "./img/recetas/placeholder.png");
}

// Función que revisa si la receta está o no en favoritos para ver qué texto ponerle al botón.
function obtenerNombreBotonFavorito(receta) {
    let nombreBoton = "Agregar";
    let favoritosLocalStorage = window.localStorage.getItem("APPRecetasFavoritos");
    let favoritosJSON = null;
    if (favoritosLocalStorage) {
        favoritosJSON = JSON.parse(favoritosLocalStorage);
        let i = 0;
        let encontrada = false;
        while (!encontrada && i < favoritosJSON.length) {
            let unFavorito = favoritosJSON[i];
            if (unFavorito._id === receta._id) {
                encontrada = true;
                nombreBoton = "Sacar";
            }
            i++;
        }
    }
    return nombreBoton;
}

// Revisa si la receta está o no en favoritos y la elimina o agrega según corresponda.
function btnRecetaFavoritoHandler() {
    let recetaId = $(this).attr("recetaId");
    let favoritosLocalStorage = window.localStorage.getItem("APPRecetasFavoritos");
    let favoritosJSON = null;
    let receta = obtenerRecetaPorID(recetaId);
    if (favoritosLocalStorage) {
        favoritosJSON = JSON.parse(favoritosLocalStorage);
        let i = 0;
        let encontrada = false;
        while (!encontrada && i < favoritosJSON.length) {
            let unFavorito = favoritosJSON[i];
            if (unFavorito._id === recetaId) {
                encontrada = true;
                // Elimino la receta del array de favoritos
                favoritosJSON.splice(i, 1);
            }
            i++;
        }
        // Si no encontré la receta entre los favoritos, la agrego.
        if (!encontrada) {
            if (receta) {
                favoritosJSON.push(receta);
            }
        }
    } else {
        // Si no tenía ningún favorito en localStorage, agrego la receta en cuestión.
        if (receta) {
            favoritosJSON = [receta];
        }
    }
    // Actualizo mis favoritos en el localStorage.
    window.localStorage.setItem("APPRecetasFavoritos", JSON.stringify(favoritosJSON));
    mostrarHome();
}

function tdRecetaNombreHandler() {
    let recetaId = $(this).attr("recetaId");
    mostrarDetalleReceta(recetaId);
}

/* Detalle de receta */
function cargarDetalleReceta(recetaId, despuesDeCargarDetalleReceta) {
    if (recetaId) {
        $.ajax({
            type: 'GET',
            url: urlBase + `recetas/${recetaId}`,
            /**
             * El beforeSend lo uso para cargar el token en el header de la petición y
             * lo hago mediente la función cargarTokenEnRequest. Esta función se va a
             * ejecutar antes de enviar la petición (beforeSend).
             * Esto se debe hacer porque el header mediante el que se manda el token
             * es un header personalizado (usualmente comienzan por x-).
             */
            beforeSend: cargarTokenEnRequest,
            success: actualizarDetalleReceta,
            error: errorCallback,
            complete: despuesDeCargarDetalleReceta
        })
    } else {
        $("#pDetalleRecetaMensajes").html("Ha ocurrido un error al cargar los datos de la receta.");
        despuesDeCargarDetalleReceta();
    }
}

function actualizarDetalleReceta(dataReceta) {
    // Podría utilizar directamente los datos que me llegan, pero ya que tengo las clases, creo instancias para trabajar con ellas.
    let usuarioRecetaObjeto = new Usuario(dataReceta.usuario._id, dataReceta.usuario.nombre, dataReceta.usuario.apellido, dataReceta.usuario.email, dataReceta.usuario.direccion, null);
    let recetaObjeto = new Receta(dataReceta._id, dataReceta.fecha, dataReceta.nombre, dataReceta.ingredientes, dataReceta.preparacion, dataReceta.urlImagen, usuarioRecetaObjeto);
    $("#h2DetaleRecetaNombre").html(recetaObjeto.nombre);
    $("#imgDetalleRecetaImagen").attr("src", recetaObjeto.urlImagen);
    let listaIngredientes = ``;
    for (let i = 0; i < recetaObjeto.ingredientes.length; i++) {
        let unIngrediente = recetaObjeto.ingredientes[i];
        listaIngredientes += `<tr><td>${unIngrediente}</td></tr>`;
    }
    $("#tablaTbodyDetalleReceta").html(listaIngredientes);
    $("#pDetalleRecetaPreparacion").html(recetaObjeto.preparacion);
    $("#divDetalleRecetaOtrosDatos").html(`
        <p><b>Usuario:</b> ${recetaObjeto.usuario.nombre}</p>
        <p><b>Fecha:</b> ${new Date(recetaObjeto.fecha)}</p>
    `);
    $("#divDetalleRecetaContenido").show();
}

/* Generales */
function errorCallback(error) {
    alert("Ha ocurrido un error. Por favor, intente nuevamente.");
    console.error(error);
}

// En caso de encontrar en mi array de recetas una con el id que le paso, la retorna. En caso contrario, devuelve null.
function obtenerRecetaPorID(idReceta) {
    let receta = null;
    let i = 0;
    while (!receta && i < recetas.length) {
        let unaReceta = recetas[i];
        if (unaReceta._id === idReceta) {
            receta = recetas[i];
        }
        i++;
    }
    return receta;
}

// Función para cerrar el menú.
function cerrarMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .close() no es de jQuery.
    document.querySelector("#menu").close();
}
