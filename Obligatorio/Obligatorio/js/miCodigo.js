/*jshint esversion: 6 */

/******************************
 * Inicialización
 ******************************/
ons.ready(todoCargado);

function todoCargado() {
    yNavigator = document.querySelector('#myNavigator');
    inicializar(); //TODO: descomente esta funcion para acceder al token guardado y logear automaticamente al usuario en caso de que el token este guardado en el localstorage
}

function navegar(paginaDestino, resetStack, datos) {
    if (resetStack) {
        myNavigator.resetToPage(`${paginaDestino}.html`);
    } else {
        myNavigator.pushPage(`${paginaDestino}.html`, { data: datos });
    }
    cerrarMenu();
}

function navegarAtras() {
    myNavigator.popPage();
    cerrarMenu();
}



// Oculto todo y muestro lo que corresponda.
function inicializar() {
    // Oculto todo.
    //ocultarSecciones();
    //ocultarOpcionesMenu();
    // Chequeo si en el localStorage hay token guardado.
    tokenGuardado = window.localStorage.getItem("AppUsuarioToken");
    // Al chequeo de la sesión, le paso como parámetro una función anónima que dice qué hacer después.
    chequearSesion(function () {
        // Muestro lo que corresponda en base a si hay o no usuario logueado.
        if (!usuarioLogueado) {
            navegar('login', true);
            //mostrarMenuInvitado();
        } else {
            navegar('home', false);
        }
    });
}

/******************************
 * Variables globales
 ******************************/
// API
const urlBase = 'http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/api/';
// Sesión
let usuarioLogueado;
let tokenGuardado;
// Productos
const productos = [];
//Favoritos
//let favoritos = [];

/******************************
 * Funcionalidades del sistema
 ******************************/
/* Menu */

// Función para abrir el menú.
function abrirMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .open() no es de jQuery.
    document.querySelector("#menu").open();
}

// function vaciarTodosLosCampos() {
//     // Registro
//     $("#txtRegistroNombre").val("");
//     $("#txtRegistroApellido").val("");
//     $("#txtRegistroDireccion").val("");
//     $("#txtRegistroEmail").val("");
//     $("#txtRegistroPassword").val("");
//     $("#pRegistroMensajes").html("");
//     // Login
//     $("#txtLoginEmail").val("");
//     $("#txtLoginPassword").val("");
//     $("#pLoginMensajes").html("");
//     // Home
//     $("#tablaTbodyHomeRecetas").html("");
//     $("#tablaHomeRecetas").hide();
//     $("#pHomeMensajes").html("");
//     //Detalle receta
//     $("#h2DetaleRecetaNombre").html("");
//     $("#imgDetalleRecetaImagen").attr("src", "");
//     $("#tablaTbodyDetalleReceta").html("");
//     $("#pDetalleRecetaPreparacion").html("");
//     $("#divDetalleRecetaOtrosDatos").html("");
//     $("#pDetalleRecetaMensajes").html("");
//     $("#divDetalleRecetaContenido").hide();
// }



// function mostrarDetalleReceta(recetaId) {
//     ocultarSecciones();
//     vaciarTodosLosCampos();
//     // Le paso 2 parámetros, el id de la receta que quiero mostrar y una función de callback
//     cargarDetalleReceta(recetaId, function () {
//         $("#divDetalleReceta").show();
//     });
// }

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
    // window.localStorage.removeItem("AppUsuarioToken");
    // Así vacío todo lo que haya guardado.
    window.localStorage.removeItem("AppUsuarioToken", JSON.stringify(tokenGuardado)); // reemplace el .clear xq tambien borra los favoritos al borrar el token
    //inicializar();
    navegar('login', true);
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
        email: emailIngresado,
        direccion: direccionIngresada,
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
            navegar('login', true);
        },
        error: errorCallback
    });
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
    });
}

function iniciarSesion(dataUsuario) {
    usuarioLogueado = new Usuario(dataUsuario.data._id, dataUsuario.data.nombre, dataUsuario.data.apellido, dataUsuario.data.email, dataUsuario.data.direccion, null);
    tokenGuardado = dataUsuario.data.token;
    localStorage.setItem("AppUsuarioToken", tokenGuardado);
    //mostrarHome();
    //mostrarMenuUsuarioAutenticado();
    navegar('home', true, dataUsuario);
}

/* Home */
function cargarListadoProductos(despuesDeCargarListadoProductos) {
    $.ajax({
        type: 'GET',
        url: urlBase + 'productos',
        /**
         * El beforeSend lo uso para cargar el token en el header de la petición y
         * lo hago mediente la función cargarTokenEnRequest. Esta función se va a
         * ejecutar antes de enviar la petición (beforeSend).
         * Esto se debe hacer porque el header mediante el que se manda el token
         * es un header personalizado (usualmente comienzan por x-).
         */

        beforeSend: cargarTokenEnRequest,
        success: crearListadoProductos,
        error: errorCallback,
        complete: despuesDeCargarListadoProductos
    });
}

//TODO: Codigo repetido?
function filtrarProductosXNombre(despuesDeCargarListadoProductos) {
    $("#divProductosCatalogo").html("");
    let texto = $("#txtFiltroProductos").val();
    $.ajax({
        type: 'GET',
        url: urlBase + 'productos',
        /**
         * El beforeSend lo uso para cargar el token en el header de la petición y
         * lo hago mediente la función cargarTokenEnRequest. Esta función se va a
         * ejecutar antes de enviar la petición (beforeSend).
         * Esto se debe hacer porque el header mediante el que se manda el token
         * es un header personalizado (usualmente comienzan por x-).
         */
        data: {
            nombre: texto
        },
        beforeSend: cargarTokenEnRequest,
        success: crearListadoProductos,
        error: errorCallback,
        complete: despuesDeCargarListadoProductos
    });
}



//TODO: BORRAR METODO ?

function crearListadoProductos(dataProductos) {
    //Navego al template Catalogo
    //navegar('catalogo', false, dataProductos); - **llamando al catalogo entra en un loop infinito***
    // Vacío el array de productos.
    productos.splice(0, productos.length);
    if (dataProductos && dataProductos.data.length > 0) {
        for (let i = 0; i < dataProductos.data.length; i++) {
            let unProducto = dataProductos.data[i];
            //TODO: revisar, pusheamos todos los productos que recibimos de la api en la constante productos, para que podamos buscar un producto x id
            let prodX = new Producto(unProducto._id, unProducto.codigo, unProducto.nombre, unProducto.precio, unProducto.urlImagen, unProducto.estado, unProducto.etiquetas);
            productos.push(prodX);
            //let unaCard = `<ons-card><div class="title">${unProducto.nombre}</div><div class="content"><p>Precio: $${unProducto.precio}</p><p>${unProducto.foto}</p><p>Código: ${unProducto.codigo}</p><p>Etiquetas: ${unProducto.etiquetas}</p><p>Estado: ${unProducto.estado}</p></div></ons-card>`;
            let unaImagenUrl = `http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/assets/imgs/${unProducto.urlImagen}.jpg`;
            let unaCard = `<ons-card><div class="title">${unProducto.nombre}</div><div>     <ons-button class="filaLista" myAttr="${unProducto._id}" modifier="material"><i class="fas fa-heart"></i></ons-button> </div>
                <ons-list>
                    <ons-list-item tappable>
                    <ons-list-item><img src=${unaImagenUrl} alt="Imagen no disponible" style="width: 200px"></ons-list-item>
                    <ons-list-item>Precio: $${unProducto.precio}</ons-list-item> 
                    <ons-list-item>Código: ${unProducto.codigo}</ons-list-item>
                    <ons-list-item>Etiquetas: ${unProducto.etiquetas}</ons-list-item>
                    <ons-list-item>Estado: ${unProducto.estado}</ons-list-item>
                    </ons-list-item>
                </ons-list>
                <ons-button style="" margin-bottom: -14px;" modifier="quiet" onclick='navegar(detalleProducto, false, unProducto)'>Ver producto</ons-button>
                </ons-card>`;
            /*TODO: cuando agrego ${} a la funcion en el onclick, no carga los productos en el catalogo*/
            $("#divProductosCatalogo").append(unaCard);

        }
        $(".filaLista").click(btnProductoFavoritoHandler);

    }
}




// function catalogoProductosOnShow(){
//     console.log("catalogo onShow")
//     cargarListadoProductos();
// }

// function cargarListadoProductos(){

// }

// function cargarDetalleCatalogo(){
//     const datos = myNavigator.topPage.data;
//     console.log(datos);
//     //const mensaje = `Se mostro ${datos.Usuario}`;

// }

// function detalleCompraOnShow(){
//     alert("este es el onshow")
// }

// function crearListadoProductos(dataProductos) {
//     navegar('catalogo', false);
//     // Vacío el array de recetas.
//     productos.splice(0, productos.length);
//     if (dataProductos && dataProductos.length > 0) {
//         // Si hay recetas completo y muestro la tabla.
//         let filas = ``;
//         for (let i = 0; i < dataProductos.length; i++) {
//             let unProducto = dataProductos[i];
//             //let usuarioRecetaObjeto = new Usuario(unaReceta.usuario._id, unaReceta.usuario.nombre, unaReceta.usuario.apellido, unaReceta.usuario.email, unaReceta.usuario.direccion, null);
//             let unProductoObjeto = new Producto(unProducto._id, unProducto.codigo, unProducto.nombre, unProducto.precio, unProducto.urlImagen, unProducto.estado, unProducto.etiquetas);
//             // Agrego la receta a mi array de recetas.
//             productos.push(unProductoObjeto);
//             filas += `
//                 <tr>
//                     <td><img onError="imgError(this);" src="${unProductoObjeto.urlImagen}" width="50"></td>
//                     <td class="tdRecetaNombre" productoId="${unProductoObjeto._id}">${unProductoObjeto.nombre}</td>
//                     <td><input class="btnRecetaFavorito" productoId="${unProductoObjeto._id}" type="button" value="${obtenerNombreBotonFavorito(unaRecetaObjeto)}"></td>
//                 </tr>
//             `;
//         }
//         // TODO: Estaría bueno revisar los favoritos para ver si hay en favoritos alguna receta que ya no esté en la base de datos para borrarla.
//         $("#tablaTbodyHomeRecetas").html(filas);
//         $("#tablaHomeRecetas").show();
//         $(".btnRecetaFavorito").click(btnRecetaFavoritoHandler);
//         $(".tdRecetaNombre").click(tdRecetaNombreHandler);
//     } else {
//         // Si no hay recetas, aviso que no hay recetas.
//         $("#pHomeMensajes").html("No se encontraron recetas.");
//     }
// }


/**
 * Función que se encarga de sustituir el src de las imágenes por la de placeholder en caso de tener un src inválido.
 * Se ejecuta desde el evento onError de las etiquetas img.
 */

// function imgError(img) {
//     $(img).attr("src", "./img/recetas/placeholder.png");
// }

// Función que revisa si la receta está o no en favoritos para ver qué texto ponerle al botón.
// function obtenerNombreBotonFavorito(receta) {
//     let nombreBoton = "Agregar";
//     let favoritosLocalStorage = window.localStorage.getItem("AppProductosFavoritos");
//     let favoritosJSON = null;
//     if (favoritosLocalStorage) {
//         favoritosJSON = JSON.parse(favoritosLocalStorage);
//         let i = 0;
//         let encontrada = false;
//         while (!encontrada && i < favoritosJSON.length) {
//             let unFavorito = favoritosJSON[i];
//             if (unFavorito._id === receta._id) {
//                 encontrada = true;
//                 nombreBoton = "Sacar";
//             }
//             i++;
//         }
//     }
//     return nombreBoton;
// }

//TODO: funcion que revisa si la receta está guardada local storage o no, y agrega o elimina segun corresponda REVISAR
function btnProductoFavoritoHandler() {
    let productoId = $(this).attr("myAttr");
    let favoritosLocalStorage = window.localStorage.getItem("AppProductosFavoritos");
    let favoritosJSON = null;
    let producto = obtenerProductoPorID(productoId);
    if (favoritosLocalStorage !== null) {
        favoritosJSON = JSON.parse(favoritosLocalStorage);
        let i = 0;
        let encontrada = false;
        while (!encontrada && i < favoritosJSON.length) {
            let unFavorito = favoritosJSON[i];
            if (unFavorito._id === productoId) {
                encontrada = true;
                favoritosJSON.splice(i, 1);
            }
            i++;
        }
        if (!encontrada) {
            if (producto) {
                favoritosJSON.push(producto);
            }
        }
    } else {
        if (producto) {
            favoritosJSON = [producto];
        }
    }
    window.localStorage.setItem("AppProductosFavoritos", JSON.stringify(favoritosJSON));
    navegar('home', false);
}

//Obtengo el objeto producto a traves del Id
function obtenerProductoPorID(idProducto) {
    let producto = null;
    let i = 0;
    while (!producto && i < productos.length) {
        let unProducto = productos[i];
        if (unProducto._id === idProducto) {
            producto = productos[i];
        }
        i++;
    }
    return producto;
}

function cargarDetalleProducto(despuesDeCargarElProducto) {

    const miProducto = myNavigator.topPage.data;
    alert(JSON.stringify(miProducto));

    const idProducto = miProducto._id;

    if (idProducto) {
        $.ajax({
            type: 'GET',
            url: urlBase + `/productos/${idProducto}`,
            /**
             * El beforeSend lo uso para cargar el token en el header de la petición y
             * lo hago mediente la función cargarTokenEnRequest. Esta función se va a
             * ejecutar antes de enviar la petición (beforeSend).
             * Esto se debe hacer porque el header mediante el que se manda el token
             * es un header personalizado (usualmente comienzan por x-).
             */

            beforeSend: cargarTokenEnRequest,
            success: verDetalleProducto,
            error: errorCallback,
            complete: despuesDeCargarElProducto
        });

    } else {
        const opciones = {
            title: 'Error'
        };
        mensaje = 'Ocurrió un error al cargar el producto';
        ons.notification.alert(mensaje, opciones);
    }
}

function verDetalleProducto(dataProducto) {

    const miProducto = dataProducto.data;

    const unaImagenUrl = `http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/assets/imgs/${miProducto.urlImagen}.jpg`;

    let unaCard = `<ons-card><div class="title">${miProducto.nombre}</div>
        <ons-list>
            <ons-list-item tappable>
            <ons-list-item><img src=${unaImagenUrl} alt="Imagen no disponible" style="width: 200px"></ons-list-item>
            <ons-list-item>Precio: $${miProducto.precio}</ons-list-item> 
            <ons-list-item>Código: ${miProducto.codigo}</ons-list-item>
            <ons-list-item>Etiquetas: ${miProducto.etiquetas}</ons-list-item>
            <ons-list-item>Estado: ${miProducto.estado}</ons-list-item>
            <ons-list-item>Descripcion: ${miProducto.descripcion}</ons-list-item>
            <ons-list-item>Descripcion: ${miProducto.putaje}</ons-list-item>
            </ons-list-item>
        </ons-list>`

    if (miProducto.estado == "en stock") {
        unaCard += `<ons-button style="" margin-bottom: -14px;" modifier="quiet" onclick="">Comprar</ons-button>
        </ons-card>`;
    }
    $("#divDetalleProductos").html(unaCard);
}

// function tdRecetaNombreHandler() {
//     let recetaId = $(this).attr("recetaId");
//     mostrarDetalleReceta(recetaId);
// }

/* Detalle de receta */
// function cargarDetalleReceta(recetaId, despuesDeCargarDetalleReceta) {
//     if (recetaId) {
//         $.ajax({
//             type: 'GET',
//             url: urlBase + `recetas/${recetaId}`,
//             /**
//              * El beforeSend lo uso para cargar el token en el header de la petición y
//              * lo hago mediente la función cargarTokenEnRequest. Esta función se va a
//              * ejecutar antes de enviar la petición (beforeSend).
//              * Esto se debe hacer porque el header mediante el que se manda el token
//              * es un header personalizado (usualmente comienzan por x-).
//              */
//             beforeSend: cargarTokenEnRequest,
//             success: actualizarDetalleReceta,
//             error: errorCallback,
//             complete: despuesDeCargarDetalleReceta
//         });
//     } else {
//         $("#pDetalleRecetaMensajes").html("Ha ocurrido un error al cargar los datos de la receta.");
//         despuesDeCargarDetalleReceta();
//     }
// }

// function actualizarDetalleReceta(dataReceta) {
//     // Podría utilizar directamente los datos que me llegan, pero ya que tengo las clases, creo instancias para trabajar con ellas.
//     let usuarioRecetaObjeto = new Usuario(dataReceta.usuario._id, dataReceta.usuario.nombre, dataReceta.usuario.apellido, dataReceta.usuario.email, dataReceta.usuario.direccion, null);
//     let recetaObjeto = new Receta(dataReceta._id, dataReceta.fecha, dataReceta.nombre, dataReceta.ingredientes, dataReceta.preparacion, dataReceta.urlImagen, usuarioRecetaObjeto);
//     $("#h2DetaleRecetaNombre").html(recetaObjeto.nombre);
//     $("#imgDetalleRecetaImagen").attr("src", recetaObjeto.urlImagen);
//     let listaIngredientes = ``;
//     for (let i = 0; i < recetaObjeto.ingredientes.length; i++) {
//         let unIngrediente = recetaObjeto.ingredientes[i];
//         listaIngredientes += `<tr><td>${unIngrediente}</td></tr>`;
//     }
//     $("#tablaTbodyDetalleReceta").html(listaIngredientes);
//     $("#pDetalleRecetaPreparacion").html(recetaObjeto.preparacion);
//     $("#divDetalleRecetaOtrosDatos").html(`
//         <p><b>Usuario:</b> ${recetaObjeto.usuario.nombre}</p>
//         <p><b>Fecha:</b> ${new Date(recetaObjeto.fecha)}</p>
//     `);
//     $("#divDetalleRecetaContenido").show();
// }

/* Generales */
function errorCallback(error) {
    alert("Ha ocurrido un error. Por favor, intente nuevamente.");
    console.error(error);
}

// Función para cerrar el menú.
function cerrarMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .close() no es de jQuery.
    document.querySelector("#menu").close();
}
