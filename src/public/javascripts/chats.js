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
    const emisor = "carlos";
    if (form && input && messages) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (input.value) {
                const messageContent = input.value;
                const chatHeaderText = chatHeader.textContent;

                socket.emit('chat', {
                    content_message: messageContent,
                    chat_header: chatHeaderText,
                    emisor: emisor,
                    date: getTodayDate()
                });

                fetch('/chat/sendMessage', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      content_message: messageContent,
                      chat_header: chatHeaderText,
                      emisor: emisor,
                      date: getTodayDate()
                    })
                  })
                  .then(response => response.json())
                  .then(data => console.log('Mensaje enviado:', data))
                  .catch(error => console.error('Error al enviar el mensaje:', error));
          
                //socket.emit('chat', `${input.value}<split>${author}<split>${fecha}`); // Envía el mensaje al servidor
                input.value = ''; // Limpia el campo de entrada
            }
        });

        let mine = false;
        socket.on('chat', (msg) => {
            const content_message = msg.content_message;
            const chat_header = msg.chat_header; //OJO CON ESTO
            const emisor = msg.emisor;
            const date = msg.date;

            console.log("Mensaje recibido");
            const item = document.createElement("li");

            const content = document.createElement("div");
            content.className = "content-message";

            const info_label = document.createElement("label");
            info_label.textContent = content_message;
            //info_label.className = "info-message";

            const author_label = document.createElement("label");
            author_label.textContent = emisor;
            //author_label.className = "author-message";

            const date_label = document.createElement("label");
            date_label.textContent = date;
            //date_label.className = "date-message";

            content.appendChild(author_label);
            content.appendChild(info_label);
            content.appendChild(date_label);
            item.appendChild(content);

            if(mine){
                item.className = "my-message message";
                info_label.className = "info-message";
                author_label.className = "author-message my-message";
                date_label.className = "date-message my-message";
                mine=false;
            }else{
                item.className = "other-message message";
                info_label.className = "info-message";
                author_label.className = "author-message other-message";
                date_label.className = "date-message other-message";
                mine=true;
            }
            
            messages.appendChild(item); // Añade el mensaje a la lista
        });
    } else {
        console.error('Formulario, entrada o lista de mensajes no encontrado en el DOM.');
    }
});

function getTodayDate(){
    const fecha = new Date();

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0'); // Mes (0-11) -> (1-12)
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');

    // Formatear como YYYY-MM-DD HH:mm
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}