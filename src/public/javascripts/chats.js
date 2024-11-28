document.addEventListener("DOMContentLoaded", () => {
    const chats = document.querySelectorAll(".list-group a");
    const chatHeader = document.querySelector(".card .chat-header");

    chats.forEach(chat => {
        chat.addEventListener('click', (e) => {
            e.preventDefault();
    
            // Obtener el título del chat seleccionado (nombre del usuario o chat)
            const userName = chat.querySelector('h6').innerText;
            
            // Actualizar el encabezado del chat
            if (chatHeader) {
                chatHeader.innerText = userName;
            }
    
            // Hacer la solicitud al servidor para obtener los mensajes
            fetch('/chat/getMessages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_header: userName // Título del chat enviado en la solicitud
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error en la solicitud: ${response.status}`);
                }
                return response.json(); // Obtener los datos de respuesta en JSON
            })
            .then(data => {
                console.log('Mensajes recibidos:', data);
    
                // Renderizar cada mensaje recibido
                if (data && Array.isArray(data)) {
                    messages.innerHTML = ""; // Limpiar mensajes anteriores
                    data.forEach(message => {
                        renderMessage(message.contenido, message.emisor, message.fecha);
                    });
                } else {
                    console.log("No se encontraron mensajes.");
                }
            })
            .catch(error => console.error('Error al obtener los mensajes:', error));
        });
    });

    function renderMessage(content, emisor, date){
        //const usuario = document.getElementById("users-display").textContent.split("Chats of ")[1];
        let item = document.createElement("li");
    
        let contentDiv = document.createElement("div");
        content.className = "content-message";
    
        let info_label = document.createElement("label");
        info_label.textContent = content;
        //info_label.className = "info-message";
    
        let author_label = document.createElement("label");
        author_label.textContent = emisor;
        //author_label.className = "author-message";
    
        let date_label = document.createElement("label");
        date_label.textContent = date;
        //date_label.className = "date-message";
    
        contentDiv.appendChild(author_label);
        contentDiv.appendChild(info_label);
        contentDiv.appendChild(date_label);
        item.appendChild(contentDiv);
    
        if(emisor == usuario){
            item.className = "my-message message";
            info_label.className = "info-message";
            author_label.className = "author-message my-message";
            date_label.className = "date-message my-message";
        }else{
            item.className = "other-message message";
            info_label.className = "info-message";
            author_label.className = "author-message other-message";
            date_label.className = "date-message other-message";
        }
    
        messages.appendChild(item);
    }

    const socket = io();
    const form = document.querySelector('#chat .card'); // Selección del formulario
    const input = document.querySelector('.message-input'); // Selección del campo de entrada
    const messages = document.querySelector('.message-list'); // Selección de la lista de mensajes
    const usuario = document.getElementById("users-display").textContent.split("Chats of ")[1];
    if (form && input && messages) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (input.value) {
                const messageContent = input.value;
                const chatHeaderText = chatHeader.textContent;

                socket.emit('chat', {
                    content_message: messageContent,
                    chat_header: chatHeaderText,
                    emisor: usuario,
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
                      emisor: usuario,
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

        socket.on('chat', (msg) => {
            const content_message = msg.content_message;
            const chat_header = msg.chat_header; //OJO CON ESTO QUE NO SE NECESITA
            const emisor = msg.emisor;
            const date = msg.date;

            console.log("Mensaje recibido");
            renderMessage(content_message, emisor, date);
        });
    } else {
        console.error('Formulario, entrada o lista de mensajes no encontrado en el DOM.');
    }



    
    
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

});
