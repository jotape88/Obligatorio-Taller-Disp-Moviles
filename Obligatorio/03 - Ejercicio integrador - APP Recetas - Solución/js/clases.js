class Usuario {
    constructor(
        pId,
        pNombre,
        pApellido,
        pEmail,
        pDireccion,
        pPassword
    ) {
        this._id = pId;
        this.nombre = pNombre;
        this.apellido = pApellido;
        this.email = pEmail;
        this.direccion = pDireccion;
        this.password = pPassword;
    }    
}

class Receta {
    constructor (
        pId,
        pFecha,
        pNombre,
        pIngredientes,
        pPreparacion,
        pUrlImagen,
        pUsuario
    ) {
        this._id = pId;
        this.fecha = pFecha;
        this.nombre = pNombre;
        this.ingredientes = pIngredientes;
        this.preparacion = pPreparacion;
        this.urlImagen = pUrlImagen;
        this.usuario = pUsuario;
    }
}