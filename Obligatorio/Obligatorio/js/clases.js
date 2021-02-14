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
    codigo,
    nombre,
    precio,
    urlImagen,
    estado,
    etiquetas
    )
    {
    this.codigo = codigo;
    this.nombre = nombre;
    this.precio = precio;
    this.urlImagen= urlImagen;
    this.estado = estado;
    this.etiquetas = etiquetas;
    }

}
