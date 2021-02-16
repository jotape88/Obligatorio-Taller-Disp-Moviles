/*jshint esversion: 6 */
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


class Producto{
    constructor(
        p_Id,
        pCodigo,
        pNombre,
        pPrecio,
        pUrlImagen,
        pEstado,
        pEtiquetas
    ) {
        this._id = p_Id;
        this.codigo = pCodigo;
        this.nombre = pNombre;
        this.precio = pPrecio;
        this.urlImagen= pUrlImagen;
        this.estado = pEstado;
        this.etiquetas = pEtiquetas;
    }
}
