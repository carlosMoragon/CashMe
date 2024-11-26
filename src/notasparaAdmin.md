
# AdminBlog
- El administrador puede crear, ver y eliminar entradas que se verán en el apartado de `blog`.
```bash
http://localhost:3000/adminBlog
```

## Funcionalidades
- **Ver entradas de blog**: Muestra una lista de todas las entradas almacenadas en la base de datos.
- **Eliminar entradas**: Permite eliminar cualquier entrada de la base de datos.

---

# AdminContact
- El administrador puede ver y eliminar mensajes de contacto enviados por los usuarios.
```bash
http://localhost:3000/adminContact
```

## Funcionalidades
- **Ver mensajes de contacto**: Muestra una lista de todos los mensajes recibidos a través del formulario de contacto.
- **Eliminar mensajes**: Permite eliminar cualquier mensaje de la base de datos.

---

# Cómo funciona

- **adminBlog**: Muestra una lista de publicaciones de blog almacenadas en la base de datos. Permite eliminar publicaciones mediante un botón de eliminar en la interfaz.
- **adminContact**: Muestra una lista de mensajes de contacto almacenados en la base de datos. Permite eliminar mensajes mediante un botón de eliminar.


## Cómo acceder
Asegúrate de tener el servidor Express en funcionamiento:
```bash
npm start
```
Luego accede a las siguientes rutas:
- **AdminBlog**: `http://localhost:3000/adminBlog`
- **AdminContact**: `http://localhost:3000/adminContact`
