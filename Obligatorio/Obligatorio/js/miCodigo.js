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
        myNavigator.bringPageTop(`${paginaDestino}.html`, { data: datos });
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
                usuarioLogueado = new Usuario(response.data._id, response.data.nombre, response.data.apellido, response.data.email, response.data.direccion, null);
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

//TODO: hacer filtro de productos por etiquetas.

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
                <ons-button style="margin-bottom: -14px;" modifier="quiet" onclick="navegar('detalleProducto', false, '${unProducto._id}')">Ver producto</ons-button>
                </ons-card>`;


            $("#divProductosCatalogo").append(unaCard);

        }
        $(".filaLista").click(btnProductoFavoritoHandler);
    }
}

function crearListadoFavoritos() {
    $("#divFavoritos").html("");
    let usuariosFavsLocalStorage = window.localStorage.getItem("AppProductosFavoritos");
    let usuariosFavsJSON = JSON.parse(usuariosFavsLocalStorage);
    if (usuariosFavsJSON && usuariosFavsJSON.length > 0) {
        for (let i = 0; i < usuariosFavsJSON.length; i++) {
            let unFavJson = usuariosFavsJSON[i];
            if (unFavJson.usuario === usuarioLogueado.email) {
                let losFavoritos = unFavJson.favoritos;
                for (let j = 0; j < losFavoritos.length; j++) {
                    //TODO: Cambiar codigo para que busque el prod cada vez que carga el listado de Favoritos
                    // y hacer validacion por si el id no existe. (ver de mostrar imagen o cartel que indique que el producto no existe)
                    let unFavorito = losFavoritos[j];
                    let unaImagenUrl = `http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/assets/imgs/${unFavorito.elProducto.urlImagen}.jpg`;
                    let unaCard = `<ons-card><div class="title">${unFavorito.elProducto.nombre}</div>   <div><ons-button class="filaFavs" myAttr2="${unFavorito.elProducto._id}" modifier="material"><i class="fas fa-ban"></i></ons-button></div>
                    <ons-list>
                    <ons-list-item tappable>
                    <ons-list-item><img src=${unaImagenUrl} alt="Imagen no disponible" style="width: 200px"></ons-list-item>
                    <ons-list-item>Precio: $${unFavorito.elProducto.precio}</ons-list-item> 
                    <ons-list-item>Código: ${unFavorito.elProducto.codigo}</ons-list-item>
                    <ons-list-item>Etiquetas: ${unFavorito.elProducto.etiquetas}</ons-list-item>
                    <ons-list-item>Estado: ${unFavorito.elProducto.estado}</ons-list-item>
                    </ons-list-item>
                </ons-list>
                </ons-card>`;
                    $("#divFavoritos").append(unaCard);
                }
            }
        }
        $(".filaFavs").click(eliminarFavoritos);
    }
}

function eliminarFavoritos() {
    let favoritoId = $(this).attr("myAttr2");
    let usuariosFavsLocalStorage = window.localStorage.getItem("AppProductosFavoritos");
    let usuariosFavsJSON = JSON.parse(usuariosFavsLocalStorage);
    if (usuariosFavsJSON && usuariosFavsJSON.length > 0) {
        for (let i = 0; i < usuariosFavsJSON.length; i++) {
            let unFavJson = usuariosFavsJSON[i];
            if (unFavJson.usuario === usuarioLogueado.email) {
                let losFavoritos = unFavJson.favoritos;
                for (let j = 0; j < losFavoritos.length; j++) {
                    let unFavorito = losFavoritos[j];
                    if (unFavorito.elProducto._id == favoritoId) {
                        losFavoritos.splice(j, 1);
                        window.localStorage.setItem("AppProductosFavoritos", JSON.stringify(usuariosFavsJSON));
                    }
                }
            }
        }
    }
    crearListadoFavoritos();
}


//TODO: funcion que revisa si la receta está guardada local storage o no, y agrega o elimina segun corresponda REVISAR
function btnProductoFavoritoHandler() {
    let productoId = $(this).attr("myAttr");
    let usuariosFavsLocalStorage = window.localStorage.getItem("AppProductosFavoritos");
    let usuariosFavsJSON = JSON.parse(usuariosFavsLocalStorage);
    let elProducto = obtenerProductoPorID(productoId);
    if (usuariosFavsJSON !== null) {
        let i = 0;
        let bandera = false;
        while (!bandera && i < usuariosFavsJSON.length) {
            let unUsuFavJSON = usuariosFavsJSON[i];
            let unMailUsuario = unUsuFavJSON.usuario;
            let favoritosUsuario = unUsuFavJSON.favoritos;
            if (usuarioLogueado.email === unMailUsuario) {
                if (!bandera) {
                    for (let k = 0; k < favoritosUsuario.length; k++) {
                        let unFavorito = favoritosUsuario[k];
                        if (productoId === unFavorito.elProducto._id) {
                            favoritosUsuario.splice(k, 1);
                            bandera = true;
                        }
                    }
                }
                if (!bandera) {
                    favoritosUsuario.push({ elProducto });
                    bandera = true;
                }
            } else {
                if (!existeUsuario(usuarioLogueado.email)) {
                    usuariosFavsJSON.push({ usuario: usuarioLogueado.email, favoritos: [{ elProducto }] });
                    bandera = true;
                }
            }
            i++;
        }
    } else {
        if (elProducto) {
            usuariosFavsJSON = [{ usuario: usuarioLogueado.email, favoritos: [{ elProducto }] }];
        }
    }
    window.localStorage.setItem("AppProductosFavoritos", JSON.stringify(usuariosFavsJSON));
}


function existeUsuario(pEmail) {
    let existe = false;
    let i = 0;
    let favoritos = window.localStorage.getItem("AppProductosFavoritos");
    let favoritosJSON = JSON.parse(favoritos);
    if (favoritosJSON !== null) {
        while (!existe && i < favoritosJSON.length) {
            let unFav = favoritosJSON[i];
            let unEmail = unFav.usuario;
            if (pEmail == unEmail) {
                existe = true;
            }
            i++;
        }
    }
    return existe;
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

function pasarAString(unJson) {
    unJson = Object.values(unJson);
    let palabraFinal = "";

    for (let i = 0; i < unJson.length; i++) {
        palabraFinal += unJson[i];
    }
    return palabraFinal;
}


function cargarDetalleProducto(despuesDeCargarElProducto) {
    let idProd = myNavigator.topPage.data;
    idProd = pasarAString(idProd);

    //En stock
    //let idProd = '601bf7cf3b11a01a78163122';
    /*Sin stock */
    //let idProd = '601bf7cf3b11a01a78163125';

    if (idProd) {
        $.ajax({
            type: 'GET',
            url: urlBase + `/productos/${idProd}`,

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
        }
        );

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
        unaCard += `<div>
        <ons-input id='inputProd' modifier="underbar" placeholder="Cantidad" type="number" float></ons-input>
        <ons-button style="" margin-bottom: -14px;" modifier="quiet" id='btnProd_${miProducto._id}' onclick='comprarProducto("${miProducto._id}")'>Comprar</ons-button>
        </ons-card></div>`;
    }
    $("#divDetalleProductos").html(unaCard);
}

function comprarProducto(idProd) {

    //Capturo la cantidad comprada desde el input
    const cantidad = $(`#inputProd`).val();

    const miProd = obtenerProductoPorID(idProd);

    if (cantidad) {
        const datos = {
            cantidadComprada: cantidad,
            productoComprado: miProd
        };
        navegar('detalleDeCompra', false, datos);
    } else {
        const opciones = {
            title: 'Error'
        };
        mensaje = 'Debe seleccionar la cantidad a comprar';
        ons.notification.alert(mensaje, opciones);
    }
}

function cargarDetalleCompra() {
    const datos = myNavigator.topPage.data;

    const idProd = datos.productoComprado._id;
    const subTotal = datos.cantidadComprada * datos.productoComprado.precio;
    const mensaje = `Producto <strong>${datos.productoComprado.nombre}</strong>.
    <br> Cantidad comprada: <strong>${datos.cantidadComprada}</strong>.<br>
    Sub Total: <strong> $${subTotal}</strong>`;
    $("#pDetalleCompraMensaje").html(mensaje);

    agregarAlCarrito(idProd, cantidad)


}


function agregarAlCarrito(idProd, cantidad) {
    //Ver si hay algun carrito en el localStorage
    let comprasEnElCarritoLocalStorage = window.localStorage.getItem("carritoDeCompras");

    //Pasarlo a JSON para poder usarlo y trabajar
    let comprasEnElCarritoJSON = JSON.parse(comprasEnElCarritoLocalStorage);

    //Este es el producto que se quiere agregar al carrito
    const miProducto = obtenerProductoPorID(idProd);

    // Creo el objeto a guardar en el local Storage
    let ProdEnElCarrito = {
        usuario: usuarioLogueado,
        productoComprado: miProducto,  
        cantidadComprada: cantidad
    }

    //Si el localStorage no está vacío, chequeo que productos tiene.
    if (comprasEnElCarritoJSON !== null) {
        let i = 0;
        let bandera = false;
        
        while (!bandera && i < comprasEnElCarritoJSON.length) {
            let unaCompra = comprasEnElCarritoJSON[i];
            let productoComprado = unaCompra.productoComprado;
            let unMailUsuario = unaCompra.usuario;
            let idProdComprado = productoComprado._id;
            if (idProdComprado == idProd && elCarritoEsDelUsuario) {
                //si el producto comprado ya existe, hay que modificar en el localStorage la cantidad comprada
                ProdEnElCarrito.cantidadComprada += cantidad; 
            } else {
                //Si no existe lo agrego al localStorage
                
            }
        }

    } else {
        //Si el localStorage estaba vacío, agrego el producto sin verfiicar
        comprasEnElCarritoJSON.push({usuario: usuarioLogueado.email, compra: [{ProdEnElCarrito}] });
    }
    window.localStorage.setItem("carritoDeCompras", JSON.stringify(comprasEnElCarritoJSON));
}

function elCarritoEsDelUsuario(){
    // TODO: verificar si el carrito es del usuario
}

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

