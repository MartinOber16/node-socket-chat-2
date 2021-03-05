const { Socket } = require('socket.io');
const { comprobarJWT } = require('../helpers');
const { ChatMensajes } = require('../models');

const chatMensajes = new ChatMensajes();

const socketController = async ( socket = new Socket(), io ) => {

    const usuario = await comprobarJWT(socket.handshake.headers['x-token']);
    if( !usuario ) {
        return socket.disconnect();
    }
    
    // Agregar el usuario conectado
    console.log(`Se conecto ${usuario.nombre}`);
    chatMensajes.conectarUsuario(usuario)
    io.emit('usuarios-activos', chatMensajes.usuariosArr);
    socket.emit('recibir-mensajes', chatMensajes.ultimos10 );

    // Conectarlo a una sala especial
    socket.join( usuario.id ); // sala global, socket.id y ahora usuario.id

    // Limpiar cuando alguien se desconecta
    socket.on('disconnect', () => {
        console.log(`Se desconecto ${usuario.nombre}`);
        chatMensajes.desconectarUsuario(usuario._id);
        io.emit('usuarios-activos', chatMensajes.usuariosArr)
    });

    socket.on('enviar-mensaje', (payload) => {
        const { uid, mensaje } = payload;

        if( uid ){
            // Mensaje privado
            socket.to( uid ).emit('mensaje-privado', {nombre: usuario.nombre, mensaje })
        } else {
            chatMensajes.enviarMensaje(usuario.id, usuario.nombre, mensaje);
            io.emit('recibir-mensajes', chatMensajes.ultimos10 );
        }
    })
}

module.exports = {
    socketController
}