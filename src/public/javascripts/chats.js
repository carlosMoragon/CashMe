document.addEventListener("DOMContentLoaded", () => {
    const chats = document.querySelectorAll(".list-group a");
    const chatHeader = document.querySelector(".card .chat-header");

    chats.forEach(chat => {
        chat.addEventListener('click', (e) => {
            e.preventDefault();
            const userName = chat.querySelector('h6').innerText;
            if (chatHeader) {
                chatHeader.innerText = userName;
            }
        });
    });

    const socket = io();
    const form = document.querySelector('#chat .card'); // Selección del formulario
    const input = document.querySelector('.message-input'); // Selección del campo de entrada
    const messages = document.querySelector('.message-list'); // Selección de la lista de mensajes

    if (form && input && messages) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (input.value) {
                socket.emit('chat', input.value); // Envía el mensaje al servidor
                input.value = ''; // Limpia el campo de entrada
            }
        });

        socket.on('chat', (msg) => {
            console.log("Mensaje recibido");
            const item = document.createElement("li");
            item.textContent = msg; // Asigna el texto del mensaje recibido
            messages.appendChild(item); // Añade el mensaje a la lista
        });
    } else {
        console.error('Formulario, entrada o lista de mensajes no encontrado en el DOM.');
    }
});
