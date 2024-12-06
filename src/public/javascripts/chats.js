document.addEventListener("DOMContentLoaded", () => {
    const chats = document.querySelectorAll(".list-group a");
    const chatHeader = document.querySelector(".card .chat-header");

    let isDeleting = false;

    chats.forEach(chat => {
        chat.addEventListener('click', (e) => {
            e.preventDefault();

            if (isDeleting) return;

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

            if(content_message == "CREACIONCHAT" &&
                chat_header == "" &&
                emisor == "" &&
                date == ""
            ){
                location.reload();
            }else{
                console.log("Mensaje recibido");
                renderMessage(content_message, emisor, date);
            }

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

    const create_chat_button = document.querySelector('#create-button');
    const delete_chat_button = document.querySelector('#delete-button');
    create_chat_button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Se EJECUTA");
        document.getElementById('div_create_chat').style.display = 'block';

    });
        
        // Al pulsar el botón de eliminar, se activa el modo de eliminar
    delete_chat_button.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('div_delete_chat').style.display = 'block';
        isDeleting = true; // Activar modo de eliminación

        // Obtener todos los enlaces <a> dentro de #all_chats
        const chatLinks = document.querySelectorAll('#all_chats a');

        // Cambiar color cuando el ratón pasa por encima de cada <a>
        chatLinks.forEach((chatLink) => {
            chatLink.addEventListener('mouseover', () => {
                chatLink.style.backgroundColor = 'red'; // Cambiar el fondo a rojo cuando el ratón está encima
            });

            chatLink.addEventListener('mouseout', () => {
                chatLink.style.backgroundColor = ''; // Restaurar el color original cuando el ratón se va
            });

            // Añadir un evento de click para eliminar
            chatLink.addEventListener('click', (e) => {
                if (isDeleting) { // Solo se ejecuta si estamos en modo de eliminación
                    e.preventDefault(); // Evitar que ejecute la función del chat

                    // Aquí capturamos la información del chat seleccionado
                    const chatName = chatLink.innerText.split("\n")[0]; // Obtener el texto del enlace
                    console.log("Eliminando el chat:", chatName);

                    // Aquí puedes realizar la acción de eliminación, por ejemplo, hacer una solicitud a un servidor
                    fetch('/chat/deleteChat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ chatName: chatName }) // Enviar el nombre del chat a eliminar
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log("Chat eliminado:", data);
                        // Realiza las actualizaciones necesarias en la interfaz
                    })
                    .catch(error => console.error("Error al eliminar el chat:", error));
                    
                    // Desactivar el modo de eliminación después de eliminar
                    isDeleting = false;
                    document.getElementById('div_delete_chat').style.display = 'none'; // Ocultar el div
                    setTimeout(function() {
                        location.reload();
                    }, 500);
                }
            });
        });
    });


    const accept_creation = document.querySelector('#accept_creation');
    const cancel_creation = document.querySelector('#cancel_creation');
    const titulo = document.querySelector('#titulo'); // Obtener el input del título
    const selectedUsers = [document.getElementById("users-display").textContent.split("Chats of ")[1]];
/*    const selectedUsers = []; // Inicializamos como un array vacío.

    accept_creation.addEventListener('click', (e) => {
        e.preventDefault();

        // Limpia el array en cada click para evitar duplicados
        selectedUsers.length = 0;

        // Obtener el usuario principal de "users-display" si existe
        const mainUser = document.getElementById("users-display")?.textContent.split("Chats of ")[1]?.trim();
        if (mainUser) {
            selectedUsers.push(mainUser);
        }

        // Añadir usuarios seleccionados de los checkboxes
        document.querySelectorAll('#check_usuarios .form-check-input:checked').forEach((checkbox) => {
            selectedUsers.push(checkbox.id); // Añadir el id del checkbox seleccionado al array
        });

        // Validar que se seleccionaron usuarios
        if (selectedUsers.length === 0) {
            alert("Por favor, selecciona al menos un usuario.");
            return;
        }

        const tituloValue = titulo.value.trim(); // Asegúrate de que el título no tiene espacios extras

        // Verificar que el título no esté vacío
        if (!tituloValue) {
            alert("Por favor, ingresa un título para el chat.");
            return;
        }

        console.log("Usuarios seleccionados:", selectedUsers);
        console.log("Título del chat:", tituloValue);

        // Fetch para enviar la solicitud al servidor
        fetch('/chat/createChat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                titulo: tituloValue, // Título del chat
                usuarios: selectedUsers, // Lista de usuarios seleccionados
                date: getTodayDate(), // Fecha de creación
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta del servidor:', data);
            if (data.error) {
                alert(data.error); // Mostrar el error si se recibe uno
            }
        })
        .catch(error => console.error('Error al enviar el mensaje:', error));

        // Cerrar el modal
        document.getElementById('div_create_chat').style.display = 'none';

        // Emitir evento al socket
        socket.emit('chat', {
            content_message: "CREACIONCHAT",
            chat_header: "",
            emisor: "",
            date: "",
        });

        setTimeout(() => {
            location.reload();
        }, 500);
    });
*/
    
    
    accept_creation.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('#check_usuarios .form-check-input').forEach(function(checkbox) {
            if (checkbox.checked) {
                selectedUsers.push(checkbox.value); // Añadir el id del checkbox seleccionado al array
            }
        });
        const tituloValue = titulo.value.trim(); // Asegúrate de que el valor no tiene espacios extras
    
        // Verificar que el título no esté vacío
        if (!tituloValue) {
            alert("Por favor, ingresa un título para el chat.");
            return;
        }
    
        console.log("Valor del título:", tituloValue); // Verifica que el valor es correcto
        
        //Este es el fetch del boton: buscar el boton (bueno, no se si me basta o no, con el bonton)
        fetch('/chat/createChat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: tituloValue, // Título del chat
                usuarios: selectedUsers, // Lista de usuarios seleccionados
                date: getTodayDate() // Fecha de creación
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta del servidor:', data);
            if (data.error) {
                alert(data.error); // Mostrar el error si se recibe uno
            }
        })
        .catch(error => console.error('Error al enviar el mensaje:', error));
        document.getElementById('div_create_chat').style.display = 'none';

        socket.emit('chat', {
            content_message: "CREACIONCHAT",
            chat_header: "",
            emisor: "",
            date: ""
        });

        setTimeout(function() {
            location.reload();
        }, 500);
    });
    

    cancel_creation.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('div_create_chat').style.display = 'none';
    });


    // Obtener los elementos relevantes
    const searchInput = document.getElementById("search_content");
    const searchButton = document.getElementById("search_button");
    const userContainer = document.getElementById("check_usuarios");

    // Función para filtrar los usuarios basados en el texto de búsqueda
    searchButton.addEventListener("click", function(e) {
        e.preventDefault(); // Prevenir el comportamiento por defecto del botón
        const searchText = searchInput.value.trim().toLowerCase(); // Obtener el texto de búsqueda y convertirlo a minúsculas

        // Obtener todos los usuarios (divs con clase .form-check)
        const users = userContainer.querySelectorAll(".form-check");

        // Recorrer cada usuario y verificar si el nombre coincide con el texto de búsqueda
        users.forEach(user => {
            const userName = user.querySelector('label').textContent.trim().toLowerCase(); // Obtener el nombre del usuario desde el texto del label
            const regex = new RegExp(searchText, "i"); // Crear una expresión regular con el texto de búsqueda (insensible a mayúsculas/minúsculas)

            // Mostrar o esconder el usuario según si coincide con la búsqueda
            if (regex.test(userName)) {
                user.style.display = "block"; // Mostrar el usuario
            } else {
                user.style.display = "none"; // Ocultar el usuario
            }
        });
    });
    function getMessages() {
        console.log("Ejecutando getMessages...");
        fetch('/chat/getMessages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_header: chatHeader // Asegúrate de que `chatHeader` tiene un valor
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
            renderMessages(data); // Llamamos a la función para renderizar los mensajes
        })
        .catch(error => {
            console.error('Error al obtener los mensajes:', error);
        });
    }
    
    function renderMessages(messages) {
        console.log("Renderizando mensajes...");
        const messagesContainer = document.querySelector('.message-list');
        messagesContainer.innerHTML = ""; // Limpiar la lista actual de mensajes
    
        // Renderizar cada mensaje
        messages.forEach(message => {
            let item = document.createElement("li");
            let contentDiv = document.createElement("div");
            contentDiv.className = "content-message";
            
            let info_label = document.createElement("label");
            info_label.textContent = message.contenido;
            let author_label = document.createElement("label");
            author_label.textContent = message.emisor;
            let date_label = document.createElement("label");
            date_label.textContent = message.fecha;
    
            contentDiv.appendChild(author_label);
            contentDiv.appendChild(info_label);
            contentDiv.appendChild(date_label);
            item.appendChild(contentDiv);
            messagesContainer.appendChild(item);
        });
    }
    



});
