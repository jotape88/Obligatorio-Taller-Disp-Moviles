ons.ready(todoCargado)

function todoCargado() {
    // Guardo la referencia al elemento myNavigator en la variable que creamos a tales efectos.
    // No puedo seleccionar el elemento con $("#myNavigator") porque quiero específicamente el elemento del DOM y no el objeto que devuelve jQuery.
    myNavigator = document.querySelector('#myNavigator');
}

function verProducto(numeroProducto) {
    navegar(`paginaProducto${numeroProducto}`, false);
}

// En caso de que haya un error, lo muestro en un alert.
// En caso se que la compra sea exitosa, muestro la pantalla del detalle.
function comprar(numeroCard) {
    const cantidad = $(`#inputCantidad${numeroCard}`).val();
    if (cantidad) {
        const datos = {
            cantidadComprada: cantidad,
            articuloComprado: numeroCard
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

/* Variables globales */
// Para guardar el componente navegador.
let myNavigator;


/* Navegación */

/*
  Existen diversas formas de navegar por las pantallas utilizando myNavigator.
  De momento, nos interesan:
    myNavigator.pushPage(`paginaDestino.html`); // Nos muestra la página de destino, agregándola al stack de navegación.
    myNavigator.popPage(); // Nos muestra la página anterior del stack de navegación y elimina la que estamos viendo.
    myNavigator.resetToPage(`paginaDestino.html`); // Nos muestre la página de destino reseteando el stack de navegación.
    Podemos hacer nuestra propia función de navegación que nos permita ir a cualquier página y saber si tiene que reiniciar o no el stack.
        Además, nuestra función de navegación recibirá un parámetro datos, que se utilizará para pasar información extra en nuestra pantalla de destino cuando llamaoms al pushPage().
*/

function navegar(paginaDestino, resetStack, datos) {
    if(resetStack) {
        myNavigator.resetToPage(`${paginaDestino}.html`)
    } else {
        myNavigator.pushPage(`${paginaDestino}.html`, {data: datos})
    }
    cerrarMenu();
}

function navegarAtras() {
    myNavigator.popPage();
    cerrarMenu();
}

/* Menú */
// Función para abrir el menú.
function abrirMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .open() no es de jQuery.
    document.querySelector("#menu").open();
}

// Función para cerrar el menú.
function cerrarMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .close() no es de jQuery.
    document.querySelector("#menu").close();
}

// Ciclo de vida de la pantalla de detalle de compra.
function detalleCompraOnInit() {
    console.log('detalleCompraOnInit');
}

function detalleCompraOnShow() {
    console.log('detalleCompraOnShow');
    cargarDetalleCompra();
}

function detalleCompraOnHide() {
    console.log('detalleCompraOnHide');
}

function detalleCompraOnDestroy() {
    console.log('detalleCompraOnDestroy');
}

// Obtiene los datos que llegaorn por parámetro al navegar a la pantalla.
    // Con los datos obtenidos, arma el mensaje y lo muestra en la pantalla.
function cargarDetalleCompra() {
    const datos = myNavigator.topPage.data;
    const mensaje = `Ha comprado el producto ${datos.articuloComprado}. Cantidad comprada: ${datos.cantidadComprada}.`;
    $("#pDetalleCompraMensaje").html(mensaje);
}