const url = ( window.location.hostname.includes('localhost') )
            ? 'http://localhost:3000/api/auth/'
            : 'https://restserver-curso-fher.herokuapp.com/api/auth/'; // TODO: Corregir esta url

let usuario = null;
let socket = null;

// Referencias HTML
const txtUid = document.querySelector('#txtUid');
const txtMensaje = document.querySelector('#txtMensaje');
const ulUsuarios = document.querySelector('#ulUsuarios');
const ulMensajes = document.querySelector('#ulMensajes');
const btnSalir = document.querySelector('#btnSalir');

// Validar JWT
const validarJWT = async() => {

    const token = localStorage.getItem('token') || '';

    if(token.length <= 10){
        window.location = 'index.html';
        throw new Error('No hay token');
    }

    const resp = await fetch( url, {
        headers: { 'x-token': token }
    } );

    const {usuario: userDB, token: tokenDB} = await resp.json();
    localStorage.setItem('token', tokenDB);

    usuario = userDB;

    document.title = usuario.nombre;

    await conectarSocket();
}

const conectarSocket = async () => {
    socket = io ({
        'extraHeaders': { 
            'x-token': localStorage.getItem('token')
        }
    });

    socket.on('connect', () => { console.log('Socket online'); });

    socket.on('disconnect', () => { console.log('Socket offline'); });

    socket.on('recibir-mensajes', dibujarMensajes);

    socket.on('usuarios-activos', dibujarUsuarios);

    socket.on('mensaje-privado', (payload) => {
        console.log(payload);
    });

}

const dibujarUsuarios = ( usuarios = [] ) => {
    let usersHtml = '';

    usuarios.forEach( user => {
        usersHtml += `
            <li>
                <p>
                    <h5 class="text-success"> ${user.nombre} </h5>
                    <span class="fs-6 muted"> ${user.uid} </span>
                </p>
            </li>
        `;

    })

    ulUsuarios.innerHTML = usersHtml;
}

txtMensaje.addEventListener('keyup', ({keyCode}) => {

    const mensaje = txtMensaje.value;
    const uid = txtUid.value;

    // keyCode 13 es el ENTER
    if(keyCode !== 13){
        return;
    }

    if(mensaje.length === 0){
        return;
    }

    socket.emit('enviar-mensaje', { mensaje , uid });

    txtMensaje.value = '';

})

const dibujarMensajes = ( mensajes = [] ) => {
    let mensajesHtml = '';

    mensajes.forEach( mensaje => {
        mensajesHtml += `
            <li>
                <p>
                    <span class="text-primary"> ${mensaje.nombre} </span>
                    <span> ${mensaje.mensaje} </span>
                </p>
            </li>
        `;

    })

    ulMensajes.innerHTML = mensajesHtml;
}

const main = async () => {

    await validarJWT();

}

main();

