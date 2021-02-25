/*jshint esversion: 6 */

/******************************
 * Inicialización
 ******************************/
ons.ready(todoCargado);

function todoCargado() {
    yNavigator = document.querySelector('#myNavigator');
    inicializar();
}

function navegar(paginaDestino, resetStack, datos) {
    if (resetStack) {
        myNavigator.resetToPage(`${paginaDestino}.html`);
    } else {
       // myNavigator.bringPageTop(`${paginaDestino}.html`, { data: datos });
       myNavigator.pushPage(`${paginaDestino}.html`, { data: datos });
    }
    cerrarMenu();
}

function navegarAtras() {
    myNavigator.popPage();
    cerrarMenu();
}


function inicializar() {
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
    let nombreIngresado = $("#txtRegistroNombre").val();
    let apellidoIngresado = $("#txtRegistroApellido").val();
    let direccionIngresada = $("#txtRegistroDireccion").val();
    let emailIngresado = $("#txtRegistroEmail").val();
    let passwordIngresado = $("#txtRegistroPassword").val();
    let passwordIngresado2 = $("#txtRegistroRepPassword").val();
    const opciones = { title: 'Error' };
    if (validarCorreo(emailIngresado)) {
        if (passwordIngresado === passwordIngresado2) {
            if (validarPassword(passwordIngresado)) {
                if (validarNombre(nombreIngresado)) {
                    if (validarApellido(apellidoIngresado)) {
                        if (validarDireccion(direccionIngresada)) {
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
                                    ons.notification.alert("El usuario ha sido creado correctamente", { title: 'Aviso!' });
                                    navegar('login', true);
                                },
                                error: errorCallback
                            });
                        } else {
                            mensaje = 'La dirección debe contener un nombre de calle y un numero de puerta';
                            ons.notification.alert(mensaje, opciones);
                        }
                    } else {
                        mensaje = 'El apellido no puede estar vacío o contener un solo caracter';
                        ons.notification.alert(mensaje, opciones);
                    }
                } else {
                    mensaje = 'El nombre no puede estar vacío o contener un solo caracter';
                    ons.notification.alert(mensaje, opciones);
                }
            } else {
                mensaje = 'La contraseña debe tener al menos 8 caracteres';
                ons.notification.alert(mensaje, opciones);
            }
        } else {
            mensaje = 'Los passwords no coinciden';
            ons.notification.alert(mensaje, opciones);
        }
    } else {
        mensaje = 'El formato del correo no es válido';
        ons.notification.alert(mensaje, opciones);
    }
}

function validarCorreo(pCorreo) {
    let esValido = false;
    if (pCorreo.trim().length >= 6) {
        let i = 0;
        while (!esValido && i < pCorreo.length) {
            let unCaracter = pCorreo.charAt(i);
            if (unCaracter === "@") {
                let j = i;
                while (!esValido && j < pCorreo.length) {
                    let unCaracter2 = pCorreo.charAt(j + 1);
                    if (unCaracter2 == ".") {
                        esValido = true;
                    }
                    j++;
                }
            }
            i++;
        }
    }
    return esValido;
}

function validarPassword(pPassword) {
    return pPassword.trim().length >= 8;
}

function validarNombre(pNombre) {
    return pNombre.trim().length >= 1;
}

function validarApellido(pApellido) {
    return pApellido.trim().length >= 1;
}

function validarDireccion(pDireccion) {
    let esValido = false;
    if (pDireccion.trim().length >= 1) {
        let tieneLetras = false;
        let tieneNumeros = false;
        let i = 0;
        while (!esValido && i < pDireccion.length) {
            let unCaracter = pDireccion.charAt(i);
            if (isNaN(unCaracter)) tieneLetras = true;
            if ((parseInt(unCaracter))) {
                tieneNumeros = true;
            }
            if (tieneLetras && tieneNumeros) esValido = true;
            i++;
        }
    }
    return esValido;
}

/* Login */
function loginIniciarSesionHandler() {
    let emailIngresado = $("#txtLoginEmail").val();
    let passwordIngresado = $("#txtLoginPassword").val();
    const opciones = { title: 'Error' };
    if (validarCorreo(emailIngresado)) {
        if (validarPassword(passwordIngresado)) {
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
        } else {
            mensaje = 'La contraseña debe tener al menos 8 caracteres';
            ons.notification.alert(mensaje, opciones);
        }
    } else {
        mensaje = 'El formato del correo no es válido';
        ons.notification.alert(mensaje, opciones);
    }
}

function iniciarSesion(dataUsuario) {
    usuarioLogueado = new Usuario(dataUsuario.data._id, dataUsuario.data.nombre, dataUsuario.data.apellido, dataUsuario.data.email, dataUsuario.data.direccion, null);
    tokenGuardado = dataUsuario.data.token;
    localStorage.setItem("AppUsuarioToken", tokenGuardado);
    //mostrarHome();
    //mostrarMenuUsuarioAutenticado();
    navegar('home', true, dataUsuario);
}

/* Catalogo */
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

//TODO: Ver si podemos usar el onChange
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
//holas
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

                        ons.notification.alert("Favorito Eliminado", { title: 'Favoritos' });

                    }
                }
            }
        }
    }
    crearListadoFavoritos();
}


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
                            ons.notification.alert("Favorito Eliminado", { title: 'Favoritos' });
                        }
                    }
                }
                if (!bandera) {
                    favoritosUsuario.push({ elProducto });
                    bandera = true;
                    ons.notification.alert("Favorito Guardado!", { title: 'Favoritos' });
                }
            } else {
                if (!existeUsuario(usuarioLogueado.email)) {
                    usuariosFavsJSON.push({ usuario: usuarioLogueado.email, favoritos: [{ elProducto }] });
                    bandera = true;
                    ons.notification.alert("Favorito Guardado!", { title: 'Favoritos' });
                }
            }
            i++;
        }
    } else {
        if (elProducto) {
            usuariosFavsJSON = [{ usuario: usuarioLogueado.email, favoritos: [{ elProducto }] }];
            ons.notification.alert("Favorito Guardado!", { title: 'Favoritos' });
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
    //Creo una constante para capturar la URL de la imagen
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
            <ons-list-item>Puntaje: ${miProducto.puntaje}</ons-list-item>
            </ons-list-item>
        </ons-list>`;
    //Si hay stock del producto, muestro un botón para comprar
    if (miProducto.estado == "en stock") {
        unaCard += `<ons-input id='inputProd' modifier="underbar" placeholder="Cantidad" type="number" float></ons-input>
        <ons-button style="" margin-bottom: -14px;" modifier="quiet" id='btnProd_${miProducto._id}' onclick='comprarProducto("${miProducto._id}")'>Comprar</ons-button>
        </ons-card>`;
        //Si no hay stock, deshabilito el boton
    } else {
        unaCard += `<ons-input id='inputProd' modifier="underbar" placeholder="Cantidad" type="number" disabled="true" float></ons-input>
        <ons-button style="" margin-bottom: -14px;" modifier="quiet" id='btnProd_${miProducto._id}' onclick='comprarProducto("${miProducto._id}")' disabled="true">Comprar</ons-button>
        </ons-card>`;
           }
           $("#divDetalleProductos").html(unaCard);


    function comprarProducto(idProd) {

        //Capturo la cantidad comprada desde el input
        const cantidad = $(`#inputProd`).val();
        const sucursal = "Sucursal Por defecto"; //TODO:ver como se elije la sucursal

        //Si la cantidad es válida, creo el objeto para el llamado a la API
        if (cantidad && cantidad > 0) {
            const unaCompra = {
                "cantidad": cantidad,
                "idProducto": idProd,
                "idSucursal": sucursal
            };

            $.ajax({
                type: 'POST',
                url: urlBase + 'pedidos',
                contentType: "application/json",
                data: JSON.stringify(unaCompra),
                beforeSend: cargarTokenEnRequest,
                success: navegar('detalleDeCompra', true, unaCompra),
                error: errorCallback,
                complete: despuesdeComprarProducto
            });

        } else {
            const opciones = {
                title: 'Error'
            };
            //Si la cantidad no es válida, muestro mensaje de error
            mensaje = 'Debe seleccionar la cantidad a comprar';
            ons.notification.alert(mensaje, opciones);
        }
    }


    function mostrarDatosCompra() {
        //Tomo los datos que pasé en la funcion navegar
        //const unaCompra = myNavigator.topPage.data;
        const unaCompra = myNavigator.topPage.data;

        const idProd = unaCompra.idProducto;
        const productoComprado = obtenerProductoPorID(idProd);
        const subTotal = unaCompra.cantidad * productoComprado.precio;

        //Escribo el mensaje a mostrar
        const mensaje = `Producto <strong>${productoComprado.nombre}</strong>.
    <br> Cantidad comprada: <strong>${unaCompra.cantidad}</strong>.<br>
    Sub Total: <strong> $${subTotal}</strong>`;
        //Muestro el mensaje
        $("#pDetalleCompraMensaje").html(mensaje);

    }

    //Hago el llamado a la API para mostrar todos los pedidos de un usuario
    function cargarDetallePedidos(despuesDeCargarPedidos) {

        $.ajax({
            type: 'GET',
            url: urlBase + 'pedidos',
            contentType: "application/json",

            beforeSend: cargarTokenEnRequest,
            success: mostrarPedidos,
            error: errorCallback,
            complete: despuesDeCargarPedidos
        });

    }

    function mostrarPedidos(pedidos) {
        //si hay algun pedido
        if (pedidos.length > 0) {

            const miPedido = pedidos.data;
            let unaImagenUrl = `http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/assets/imgs/${elProducto.urlImagen}.jpg`;

            //Recorro el array de pedidos y voy cargando la info
            for (let i = 0; i < miPedido.length; i++) {

                let elPedido = miPedido[i];
                let elProducto = elPedido.producto;
                let unaCard = `<ons-card><div class="title">${elProducto.nombre}</div>
                            <ons-list>
                                <ons-list-item tappable>
                                <ons-list-item><img src=${unaImagenUrl} style="width: 200px"></ons-list-item>
                                <ons-list-item>Código: ${elProducto.codigo}</ons-list-item>
                                <ons-list-item>Etiquetas: ${elProducto.etiquetas}</ons-list-item>
                                <ons-list-item>Estado: ${elProducto.estado}</ons-list-item>
                                <ons-list-item>Sucursal donde retira: ${elPedido.estado}</ons-list-item>
                                <ons-list-item>Precio total: ${elPedido.cantidad}*${elProducto.precio}</ons-list-item>
                                </ons-list-item>
                            </ons-list>`;
                // Si el estado del pedido es pendiente, muestro el boton para insertar comentario
                if (elProducto.estado == 'pendiente') {
                    unaCard += `<ons-button onclick="showPrompt()">Agregar comentario</ons-button>
                            </ons-card>`
                    //Si el pedido no es 'pendiente', deshabilito el boton
                } else {
                    unaCard += `<ons-button onclick="showPrompt()" disabled="true">Agregar comentario</ons-button>
                </ons-card>`
                }

                $("#divDetallePedidos").append(unaCard);
            }
            //Si no hay ningun pedido, muestro un cartel y navego hacia atras.
        } else {
            ons.notification.alert("No hay pedidos para mostrar", { title: 'Error' });
            navegarAtras();
        }
    }
}

//Funcion que muestra el Dialog para agregar comentario al pedido
function showPrompt() {
    ons.notification.prompt('Ingrese un comentario')
        .then(function (input) {
            var message = input ? 'Entered: ' + input : 'Entered nothing!';
            ons.notification.alert(message);

            //TODO: falta hacer el llamado 'PUT' a la api
        });
}


/* Generales */
function errorCallback(error) {
    ons.notification.alert("Ha ocurrido un error. Por favor, intente nuevamente.", { title: 'Error!' });
    console.error(error);
}

// Función para cerrar el menú.
function cerrarMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .close() no es de jQuery.
    document.querySelector("#menu").close();
}

