/*jshint esversion: 6 */

//#region Inicialización de la app
/******************************
 * Inicialización
 ******************************/
document.addEventListener("deviceready", onDeviceReady, false);
ons.ready(todoCargado);

//Le decimos que hacer cuando el dispositivo no tiene acceso a internet
document.addEventListener(
    "offline",
    function () {
        myNavigator.pushPage("offline.html");
    },
    false
);

// Le decimos qué hacer cuando el dispositivo vuelve a tener acceso a internet.
document.addEventListener(
    "online",
    function () {
        myNavigator.popPage();
    },
    false
);

function onDeviceReady() {
    // Pido permisos para usar la camara.
    QRScanner.prepare(prepareCallback);
}

function todoCargado() {
    yNavigator = document.querySelector('#myNavigator');
    inicializar();
}

//Función para entre los distintos templates
function navegar(paginaDestino, resetStack, datos) {
    if (resetStack) {
        myNavigator.resetToPage(`${paginaDestino}.html`);
    } else {
        // myNavigator.bringPageTop(`${paginaDestino}.html`, { data: datos });
        myNavigator.bringPageTop(`${paginaDestino}.html`, { data: datos });
    }
    cerrarMenu();
}

//Funcion que se llama para navegar hacia la pagina anterior
function navegarAtras() {
    myNavigator.popPage();
    cerrarMenu();
}

//Funcion que verifica si hay un usuario logueado y navega a donde corresponda
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

//#endregion

//#region Variables Globales
/******************************
 * Variables globales
 ******************************/
// API
const urlBase = 'http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/api/';
// Sesión
let usuarioLogueado;
let tokenGuardado;
// Productos provenientes de la llamada a la API
const productos = [];
// Productos filtrados
let productosFiltrados = { data: Array(), error: "" };
//Sucursales
const lasSucursales = [];

//#endregion

//#region Funcionalidades del sistema
/******************************
 * Funcionalidades del sistema
 ******************************/
/* Menu */

// Función para abrir el menú.
function abrirMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .open() no es de jQuery.
    document.querySelector("#menu").open();
}

// Carga el token en el header de la petición.
// Si quiero que la petición esté autenticada, debo llamarla en el beforeSend de la llamada ajax.
function cargarTokenEnRequest(jqXHR) {
    jqXHR.setRequestHeader("x-auth", tokenGuardado);
}
//#endregion

//#region Sesion
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

//Funcion para mostrar el nombre del usuario logueado en la Home
function mostrarBienvenidaUsuario(){
    $("#pHome").html(`Hola, ${usuarioLogueado.nombre}!`);
}


function cerrarSesion() {
    //Removemos el token guardado en el localStorage
    window.localStorage.removeItem("AppUsuarioToken", JSON.stringify(tokenGuardado)); 
    //Navegamos al login
    navegar('login', true);
}
//#endregion

//#region Registro
/* Registro de Usuario Nuevo*/
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
                            //Guardamos los datos del usuario en un objeto llamado datosUsuario,m que luego lo pasamos por string a la llamada ajax
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
                                // Ya que lo que debemos ejecutar es tan simple, lo hacemos en una funcion anonima.
                                success: function () {
                                    ons.notification.alert("El usuario ha sido creado correctamente", { title: 'Aviso!' });
                                    navegar('login', true);
                                },
                                error: errorCallback
                            });
                        } else {
                            ons.notification.alert('La dirección debe contener un nombre de calle y un numero de puerta', opciones);
                        }
                    } else {
                        ons.notification.alert('El apellido no puede estar vacío o contener un solo caracter', opciones);
                    }
                } else {
                    ons.notification.alert('El nombre no puede estar vacío o contener un solo caracter', opciones);
                }
            } else {
                ons.notification.alert('La contraseña debe tener al menos 8 caracteres', opciones);
            }
        } else {
            ons.notification.alert('Los passwords no coinciden', opciones);
        }
    } else {
        ons.notification.alert('El formato del correo no es válido', opciones);
    }
}

//#endregion

//#region Validaciones

//Funcion que valida el e-mail segun lo solicitado
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

//Funcion que valida el largo del password
function validarPassword(pPassword) {
    return pPassword.trim().length >= 8;
}

//Funcion que valida el nombre
function validarNombre(pNombre) {
    //Si bien no es solicitado, utilizamos un largo minimo superior a un caracter
    return pNombre.trim().length > 1;
}
//Funcion que valida el apellido
function validarApellido(pApellido) {
    //Si bien no es solicitado, utilizamos un largo minimo superior a un caracter
    return pApellido.trim().length > 1;
}
//Funcion que valida la direccion, debe contener letras y numeros
function validarDireccion(pDireccion) {
    let esValido = false;
    //Si bien no es solicitado, utilizamos un largo minimo superior a un caracter
    if (pDireccion.trim().length > 1) {
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
//#endregion

//#region Login
/* Login */
//Funcion que se encarga de hacer la llamada a la API con los datos del login
function loginIniciarSesionHandler() {
    let emailIngresado = $("#txtLoginEmail").val();
    let passwordIngresado = $("#txtLoginPassword").val();
    const opciones = { title: 'Error' };
    //Antes de hacer una llamada innecesaria a la api, validamos de nuestro lado los datos ingresados
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
            ons.notification.alert('La contraseña debe tener al menos 8 caracteres', opciones);
        }
    } else {
        ons.notification.alert('El formato del correo no es válido', opciones);
    }
}

//Funcion que crea un nuevo usuario a traves del constructor usando la data recibida luego de que la API devuelva un codigo 200
function iniciarSesion(dataUsuario) {
    usuarioLogueado = new Usuario(dataUsuario.data._id, dataUsuario.data.nombre, dataUsuario.data.apellido, dataUsuario.data.email, dataUsuario.data.direccion, null);
    tokenGuardado = dataUsuario.data.token;
    localStorage.setItem("AppUsuarioToken", tokenGuardado);
    navegar('home', true, dataUsuario);
}
//#endregion

//#region Catalogo de productos 

/* Catalogo */
//Llamada a la API para obtener todos los productos existentes en la base de datos
function cargarListadoProductos(despuesDeCargarListadoProductos) {
    $.ajax({
        type: 'GET',
        url: urlBase + 'productos',
        beforeSend: cargarTokenEnRequest,
        success: crearListadoProductos,
        error: errorCallback,
        complete: despuesDeCargarListadoProductos
    });
}
//#endregion

//#region Filto de productos
//Función que hace un llamado a la API y filtra los productos segun un string que toma desde el HTML ingresado por el usuario
function filtrarProductos(despuesDeCargarListadoProductos) {
    $("#divProductosCatalogo").html("");
    let texto = $("#txtFiltroProductos").val();
    $.ajax({
        type: 'GET',
        url: urlBase + 'productos',
        data: {
            nombre: texto
        },
        beforeSend: cargarTokenEnRequest,
        success: guardarProductosFiltrados,
        error: errorCallback,
        complete: despuesDeCargarListadoProductos
    });
}

//Funcion que guarda los productos filtrados por nombre en una variable
function guardarProductosFiltrados(datos) {
    //Utilizamos un objeto con el mismo formato que maneja la API (.data) para los productos, para que la funcion que genera el listado de productos no nos devuelva error
    productosFiltrados = { data: Array(), error: "" };
    //Nos posicionamos dentro de la clave data de los productos que recibimos desde la API
    const losProductos = datos.data;
    let textoIngresado = $("#txtFiltroProductos").val();
    if (datos && losProductos.length > 0) {
        for (let i = 0; i < losProductos.length; i++) {
            let unProducto = losProductos[i];
            let prodX = new Producto(unProducto._id, unProducto.codigo, unProducto.nombre, unProducto.precio, unProducto.urlImagen, unProducto.estado, unProducto.etiquetas);
            //Guardamos y pusheamos todos los productos filtrados que nos mande la API en la variable global productosFiltrados
            productosFiltrados.data.push(prodX);
        }
    }
    if (textoIngresado != "") {
        textoIngresado = textoIngresado.toLowerCase();
        for (let i = 0; i < productos.length; i++) {
            let unProd = productos[i];
            let lasEtiquetas = unProd.etiquetas;
            let x = 0;
            let encontrado = false;
            while (!encontrado && x < lasEtiquetas.length) {
                let etiquetaX = lasEtiquetas[x];
                //Verificamos que el texto ingresado por el usuario sea subcadena de una etiqueta de un objeto
                if (etiquetaX.includes(textoIngresado)) {
                    let j = 0;
                    let existeElProdFiltrado = false;
                    while (!existeElProdFiltrado && j < productosFiltrados.data.length) {
                        let unProdFiltrado = productosFiltrados.data[j];
                        if (unProd.nombre == unProdFiltrado.nombre) {
                            existeElProdFiltrado = true;
                        }
                        j++;
                    }
                    if (!existeElProdFiltrado) {
                        productosFiltrados.data.push(unProd);
                    }
                }
                x++;
            }
        }
    }
    //Llamamos a la funcion de Crear listado de productos, y le pasamos el Objeto con los productos filtrados
    crearListadoProductos(productosFiltrados);
}

//SI el resultado del llamado a la API es success:
function buscarNombreOEti(pData) {
    //Si hay productos con ese nombre, los trae
    if (pData.data.length > 0) {
        crearListadoProductos(pData);
        //Si no encontró por nombre, busca por etiquetas
    } else {
        filtrarProductosXEtiqueta();
    }
}

//Funcion para filtrar los productos segun su etiqueta
function filtrarProductosXEtiqueta() {
    let textoIngresado = $("#txtFiltroProductos").val();
    textoIngresado = textoIngresado.toLowerCase();
    let arrayFiltrados = { data: Array(), error: "" };
    for (let i = 0; i < productos.length; i++) {
        let unProd = productos[i];
        let unaEtiqueta = unProd.etiquetas;
        let x = 0;
        let encontrado = false;
        while (!encontrado && x < unaEtiqueta.length) {
            let etiquetaX = unaEtiqueta[x];
            if (etiquetaX.includes(textoIngresado)) {
                arrayFiltrados.data.push(unProd);
                encontrado = true;
            }
            x++;
        }
    }
    crearListadoProductos(arrayFiltrados);
}
//#endregion

//#region Listados
//Funcion principal para generar los listados de productos
function crearListadoProductos(dataProductos) {
    //Limpiamos el div catalogo para filtrar por etiquetas correctamente
    $("#divProductosCatalogo").html(""); 
    //Vaciamos la constante productos
    productos.splice(0, productos.length);
    if (dataProductos && dataProductos.data.length > 0) {
        for (let i = 0; i < dataProductos.data.length; i++) {
            let unProducto = dataProductos.data[i];
            let prodX = new Producto(unProducto._id, unProducto.codigo, unProducto.nombre, unProducto.precio, unProducto.urlImagen, unProducto.estado, unProducto.etiquetas);
            productos.push(prodX);
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
                <ons-button style="margin-bottom: -14px;" modifier="large" onclick="navegar('detalleProducto', false, '${unProducto._id}')">Ver producto</ons-button>
                </ons-card>`;
            $("#divProductosCatalogo").append(unaCard);
        }
        $(".filaLista").click(btnProductoFavoritoHandler);
    }
}

//Funcion para mostrar el listado de favoritos el cual obtiene del localStorage
function crearListadoFavoritos() {
    //Vaciamos el div favoritos
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
                    let unaCard =
                        `<ons-card><div class="title">${unFavorito.elProducto.nombre}</div>   <div><ons-button class="filaFavs" myAttr2="${unFavorito.elProducto._id}" modifier="material"><i class="fas fa-ban"></i></ons-button></div>
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

//Funcion para eliminar los favoritos, se encarga de eliminar los favoritos del localStorage, una vez eliminado, se vuelve a convertir en string y se vuelve a guardar sobreescribiendo los valores anteriores
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

//Funcion vinculada al boton de eliminar y agregar favoritos, elimina o agrega un favorito segun corresponda
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

//#endregion

//#region Metodos
//Funcion para verificar si existe el usuario en el localStorage segun el email
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

//Funcion para obtener el objeto producto a traves del Id en la constante global productos
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

//#endregion

//#region Detalle y compra de Productos
//Llamada a la API que nos devuelve el datalle de un solo producto
function cargarDetalleProducto(despuesDeCargarElProducto) {
    let idProd = myNavigator.topPage.data;
    idProd = pasarAString(idProd);
    if (idProd) {
        $.ajax({
            type: 'GET',
            url: urlBase + `/productos/${idProd}`,
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

//Funcion que nos muestra el detalle del producto que obtiene de la llamada a la API
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
        unaCard += `<ons-input id='inputProd' modifier="underbar" placeholder="Cantidad" type="number" float></ons-input><br>
        <select id="selectSucursales"></select><br>
        <ons-button style="" margin-bottom: -14px;" modifier="quiet" onclick='comprarProducto("${miProducto._id}")'>Comprar</ons-button>
        <ons-button style="" margin-bottom: -14px;" modifier="quiet" onclick='navegar("mapa", false)'>Ver mapa</ons-button>
        </ons-card>`;
        //Si no hay stock, deshabilito el boton
    } else {
        unaCard += `<ons-input id='inputProd' modifier="underbar" placeholder="Cantidad" type="number" disabled="true" float></ons-input>
        <ons-button style="" margin-bottom: -14px;" modifier="quiet" onclick='comprarProducto("${miProducto._id}")' disabled="true">Comprar</ons-button>
        </ons-card>`;
    }
    $("#divDetalleProductos").html(unaCard);
    cargarSucursales();
}

//Llamada a la API para obtener el listado de sucursales
function cargarSucursales(despuesDeCargarSucursales) {
    $.ajax({
        type: 'GET',
        url: urlBase + 'sucursales',
        beforeSend: cargarTokenEnRequest,
        success: crearCombo,
        error: errorCallback,
        complete: despuesDeCargarSucursales
    });
}

//Funcion para cargar un combo dinamico en el DOM utilizando los valores provenientes de la llamada a la API
function crearCombo(pData) {
    let sucursales = pData.data;
    let elCombo = `<option value=-1>Seleccione una sucursal</option>`;
    for (let i = 0; i < sucursales.length; i++) {
        let unaSucursal = sucursales[i];
        let sucX = new Sucursal(unaSucursal._id, unaSucursal.nombre, unaSucursal.direccion, unaSucursal.ciudad, unaSucursal.pais);
        lasSucursales.push(sucX);
        elCombo += `<option value="${unaSucursal._id}">${unaSucursal.nombre}</option>`;
    }
    $("#selectSucursales").html(elCombo);
}

function cargarDatosCompra() {
    mostrarDatosCompra();

}

//Funcion encargada de manejar la compra de productos a traves de un llamado a la API con metodo POST
function comprarProducto(idProd, despuesdeComprarProducto) {
    //Capturo la cantidad comprada desde el input
    const cantidad = $(`#inputProd`).val();
    const sucursal = $(`#selectSucursales`).val();
    //Si la cantidad es válida, creo el objeto para el llamado a la API
    if (sucursal !== null && sucursal != -1) {
        if (cantidad && cantidad > 0) {
            const data = {
                "cantidad": cantidad,
                "idProducto": idProd,
                "idSucursal": sucursal
            };
            $.ajax({
                type: 'POST',
                url: urlBase + 'pedidos',
                contentType: "application/json",
                data: JSON.stringify(data),
                beforeSend: cargarTokenEnRequest,
                success: navegar('detalleDeCompra', false, data),
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
    } else {
        ons.notification.alert("Seleccione una sucursal", { title: "Error" });
    }
}

//Funcion para mostrar el detalle de la compra recien realizada
function mostrarDatosCompra() {
    //Tomo los datos que pasé en la funcion navegar
    const unaCompra = this.data;
    if (unaCompra) {
        const idProd = unaCompra.idProducto;
        const productoComprado = obtenerProductoPorID(idProd);
        const subTotal = unaCompra.cantidad * productoComprado.precio;
        //Escribo el mensaje a mostrar
        const mensaje = `Producto <strong>${productoComprado.nombre}</strong>.
                            <br> Cantidad comprada: <strong>${unaCompra.cantidad}</strong>.<br>
                             Sub Total: <strong> $${subTotal}</strong>`;
        //Muestro el mensaje
        $("#pDetalleCompraMensaje").html(mensaje);
    } else {
        ons.notification.alert("Ocurrió un error, por favor contacte al administrador", { title: 'Oops!' });
    }
}

//Funcion que efectua el llamado a la API para mostrar todos los pedidos de un usuario
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

//Funcion que genera un listado de los pedidos realizado por el usuario
function mostrarPedidos(pedidos) {
    const miPedido = pedidos.data;
    //si hay algun pedido
    if (miPedido.length > 0) {
        //Recorro el array de pedidos y voy cargando la info
        for (let i = 0; i < miPedido.length; i++) {
            let elPedido = miPedido[i];
            let elProducto = elPedido.producto;
            let unaImagenUrl = `http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/assets/imgs/${elProducto.urlImagen}.jpg`;
            let unaCard = `<ons-card><div class="title">${elProducto.nombre}</div>
                            <ons-list>
                                <ons-list-item tappable>
                                <ons-list-item><img src=${unaImagenUrl} style="width: 200px"></ons-list-item>
                                <ons-list-item>Código: ${elProducto.codigo}</ons-list-item>
                                <ons-list-item>Etiquetas: ${elProducto.etiquetas}</ons-list-item>
                                <ons-list-item>Estado: ${elProducto.estado}</ons-list-item>
                                <ons-list-item>Sucursal donde retira: ${elPedido.sucursal.nombre}</ons-list-item>
                                <ons-list-item>Precio total: $ ${parseInt(elPedido.cantidad) * parseInt(elProducto.precio)}</ons-list-item>
                                <ons-list-item>Estado del pedido: ${elPedido.estado}</ons-list-item>
                                </ons-list-item>
                            </ons-list>`;
            // Si el estado del pedido es pendiente, muestro el boton para insertar comentario
            if (elPedido.estado == 'pendiente') {
                unaCard += `<ons-button onclick="showPrompt('${elPedido._id}')">Agregar comentario</ons-button>
                            </ons-card>`;
                //Si el pedido no es 'pendiente', deshabilito el boton
            } else {
                unaCard += `<ons-button onclick="showPrompt('${elPedido._id}')" disabled="true">Agregar comentario</ons-button>
                 </ons-card>`;
            }
            $("#divDetallePedidos").append(unaCard);
        }
        //Si no hay ningun pedido, muestro un cartel y navego hacia atras.
    } else {
        ons.notification.alert("No hay pedidos para mostrar", { title: 'Error' });
        navegarAtras();
    }
}

//Funcion que agrega el comentario
function agregarComentario(idPedido, miComentario) {
    console.log('idPedido: ' + idPedido);
    const elComentario = {
        comentario: miComentario
    };  

    $.ajax({
        type: 'PUT',
        url: urlBase + `pedidos/${idPedido}`,
        contentType: "application/json",
        data: JSON.stringify(elComentario),
        beforeSend: cargarTokenEnRequest,
        success: navegar('catalogo', false),
        error: errorCallback
    });
}

//#endregion

//#region Funciones Generales
//Funcion que muestra el Dialog para agregar comentario al pedido
function showPrompt(idPedido) {
    ons.notification.prompt('Ingrese un comentario')
        .then(function (input) {
            agregarComentario(idPedido, input);
            var message = input ? 'Gracias por su comentario' : 'El comentario no puede estar vacio';
            ons.notification.alert(message);
        });
}

/* Generales */
function errorCallback(error) {
    ons.notification.alert("Ha ocurrido un error. Por favor, intente nuevamente.", { title: 'Error!' });
    console.error(error);
}

// Función para cerrar el menú.
function cerrarMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .close() no es de jQuery, por lo tanto usamos JS nativo
    document.querySelector("#menu").close();
}
//#endregion

//#region Mapa

let posicionDelUsuario;
let miMapa;

//Funcion que se encarga de obtener las cordenadas del usuario
function cargarPosicionDelUsuario() {
    window.navigator.geolocation.getCurrentPosition(
        // Callback de éxito.
        function (pos) {
            posicionDelUsuario = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            };
            inicializarMapa();
        },
        // Calback de error.
        function () {
            posicionDelUsuario = {
                latitude: -34.903816878014354,
                longitude: -56.19059048108193
            };
            inicializarMapa();
        }
    );
}

//Inicializamos el Mapa
function inicializarMapa() {
    // Guardo referencia global a mi mapa.
    miMapa = L.map("contenedorDeMapa").setView([posicionDelUsuario.latitude, posicionDelUsuario.longitude], 13);
    // Vacío el mapa.
    miMapa.eachLayer(m => m.remove());
    // Dibujo la cartografía base.
    L.tileLayer(
        "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWNhaWFmYSIsImEiOiJjanh4cThybXgwMjl6M2RvemNjNjI1MDJ5In0.BKUxkp2V210uiAM4Pd2YWw",
        {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: "mapbox/streets-v11",
            accessToken: "your.mapbox.access.token"
        }
    ).addTo(miMapa);
    dibujarPosicionDelUsuarioHandler();
    encontrarSucursales();
}

//Dibujamos con un marcador en el mapa la posicion actual del usuario
function dibujarPosicionDelUsuarioHandler() {
    L.marker([posicionDelUsuario.latitude, posicionDelUsuario.longitude]).addTo(miMapa).bindPopup('Mi Ubicación').openPopup();
    miMapa.panTo(new L.LatLng(posicionDelUsuario.latitude, posicionDelUsuario.longitude));
}

//Recorremos las sucursales y llamamos a la API con las direcciones que obtenemos
function encontrarSucursales() {
    for (let i = 0; i < lasSucursales.length; i++) {
        let unaSucu = lasSucursales[i];
        buscarDireccion(unaSucu.direccion, unaSucu.ciudad, unaSucu.pais, unaSucu.nombre);
    }
}


//Función que usa la API de OpenStreetMap para buscar las coordenadas de una dirección.
function buscarDireccion(pDireccion, pCiudad, pPais, pNombre) {
    let urlX = `https://nominatim.openstreetmap.org/search?format=json&q=${pDireccion},${pCiudad},${pPais}`;
    console.log(urlX);
    $.ajax({
        type: 'GET',
        url: urlX,
        contentType: "application/json",
        success: function (data) {
            if (data.length > 0) {
                dibujarDistancia(data[0].lat, data[0].lon, pNombre);
            } else {
                alert("No se han encontrado datos");
            }
        },
        error: function (error) {
            console.log(error);
        }
    });
}


// Función que se encarga de dibujar un punto en el mapa y agregar una una línea desde la posición del usuario hasta el punto dibujado.
//TODO: si da tiempo, que se muestre despues del onshow o mostrar un loading
function dibujarDistancia(lat, lon, nombre) {
    // Dibujo el punto en el mapa.
    L.marker([lat, lon]).addTo(miMapa).bindPopup(nombre).openPopup();
    // Array con los puntos del mapa que voy a usar para la línea.
    const puntosLinea = [
        [posicionDelUsuario.latitude, posicionDelUsuario.longitude],
        [lat, lon]
    ];
    // Calculo la distancia usando la librería. Divido entre 1000 para obtener los km y me quedo con 2 decimales.
    const distancia = Number(miMapa.distance([posicionDelUsuario.latitude, posicionDelUsuario.longitude], [lat, lon]) / 1000).toFixed(2);
    // Dibujo una línea amarilla con un pop up mostrando la distancia.
    const polyline = L.polyline(puntosLinea, { color: 'yellow' }).addTo(miMapa).bindPopup(`Distancia ${distancia} km.`).openPopup();
    // Centro el mapa en la línea.
    miMapa.fitBounds(polyline.getBounds());
}


function prepareCallback(err, status) {
    if (err) {
        // En caso de cualquier tipo de error.
        ons.notification.alert(JSON.stringify(err));
    }
    if (status.authorized) {
        // Tenemos acceso y el escaner está inicializado.
    } else if (status.denied) {
        // El usuario rechazó el pedido, la pantalla queda en negro.
        ons.notification.alert('status.denied');
        // Podemos volver a preguntar mandando al usuario a la configuración de permisos con QRScanner.openSettings().
    } else {
        // Nos rechazaron solo por esta vez. Podríamos volver a hacer el pedido.
        ons.notification.toast("Nos cancelaron una sola vez", { timeout: 2000 });
    }
}

//#endregion

//#region Escaneo QR
// Función que me lleva a la pantalla de escaneo.
function irAlScan() {
    navegar("qrPage", false);
}

// Función que se dispara al ingresar a la página de escaneo.
function escanear() {
    alert("entro a la funcion escanear");
    // Si hay scanner
    if (window.QRScanner) {
        // Esto lo uso para mostrar la cam en la app.
        // Por defecto la vista previa queda por encima del body y el html.
        // Pero por un tema de compatibilidad con Onsen, queda por debajo de la page.
        // Mirar el css y ver cómo hay que hacer que esta page sea transparente para que se vea la cámara.
        window.QRScanner.show(
            function (status) {
                // Función de scan y su callback
                window.QRScanner.scan(scanCallback);
            }
        );
    } else {
        alert("No abre el scanner");
    }
}

function scanCallback(err, text) {
    alert("entro a la funcion scarCallback");
    if (err) {
        // Ocurrió un error o el escaneo fue cancelado(error code '6').
        ons.notification.alert(JSON.stringify(err));
    } else {
        alert("No hay error, voy a llamar a CargarQrPage");
        // Si no hay error escondo el callback y vuelvo a la pantalla anterior pasando el string que se escaneó con la url del producto.
        QRScanner.hide();
        //myNavigator.popPage({ data: { scanText: text } });
        cargarQrPage(text);
    }
}

// Función que carga el home, si hay algo escaneado trae el producto y lo muestra
function cargarQrPage(pUrl) {
    alert("llamé a cargarQrPage");
    // Si me pasaron datos por parámetro en la navegación.
    // Hacer this.data es lo mismo que hacer myNavigator.topPage.data
    if (pUrl) {
        ons.notification.alert(pUrl);
        $.ajax({
            type: "GET",
            url: pUrl,
            contentType: "application/json",
            beforeSend: cargarTokenEnRequest,
            success: mostrarProductoEscaneado,
            error: errorCallback,
            //complete: despuesCargarQrPage
        });
    }
}

//Funcion que nos muestra un list item con el producto escaneado
function mostrarProductoEscaneado(pResponse) {
    $("#divParaScanProducto").html('');
    ons.notification.toast("success", { timeout: 1500 });
    let r = pResponse.data[0];
    ons.notification.toast(JSON.stringify(r), { timeout: 5000 });
    let unItemList = `
    <ons-list-item>
        <div class="left">
            <img class="list-item__thumbnail" src="http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/assets/imgs/${r.urlImagen}.jpg">
        </div>
        <div class="center">
            <span class="list-item__title">${r.nombre}</span>
            <span class="list-item__subtitle">${r.etiquetas.join(',')}</span>
        </div>
        <div class="right">
            <span class="list-item__title">$${r.precio}</span>
        </div>
    </ons-list-item>`;
    $('#productos-list').html(unItemList);
}

function irAlFalsoScan() {
    myNavigator.pushPage("falsoScan.html");
}
function falsoScan() {
    cargarQrPage('http://ec2-54-210-28-85.compute-1.amazonaws.com:3000/api/productos?codigo=PRCODE001');
}
//#endregion