# 💬 Chat Simulator

Este simulador permite probar el sistema de chat usando las APIs REST del backend sin necesidad de WebSockets. Simula un chat en tiempo real usando polling.

## 🚀 Cómo usar

### Paso 1: Instalar dependencias
```bash
cd simulate
npm install
```

### Paso 2: Asegúrate de que el backend esté corriendo
```bash
# En otra terminal, ir al backend y ejecutar:
cd ../backend
npm run dev
```

### Paso 3: Abrir dos terminales para simular dos usuarios

#### Terminal 1 (Usuario 1):
```bash
cd simulate
npm run start
```

#### Terminal 2 (Usuario 2):
```bash
cd simulate  
npm run start
```

### Paso 4: Configurar cada terminal
1. **Selecciona un usuario diferente en cada terminal** (1, 2, o 3)
2. **Selecciona con quién quieres chatear** (debe ser el otro usuario)
3. **¡Empieza a escribir mensajes!**

## 👥 Usuarios disponibles para testing

1. **TestUser** - `test@example.com` (password: 123456)
2. **Maria** - `maria@example.com` (password: 123456)  
3. **FixedUser** - `fixed@example.com` (password: 123456)

## 📝 Comandos disponibles

- **Escribir mensaje**: Solo escribe el mensaje y presiona Enter
- **`/help`** - Mostrar ayuda
- **`/refresh`** - Actualizar mensajes manualmente
- **`/clear`** - Limpiar pantalla y mostrar historial completo
- **`/exit`** - Salir del chat

## 🔄 Cómo funciona

1. **Autenticación**: Se autentica con el backend usando JWT
2. **Envío de mensajes**: Usa la API REST `POST /api/messages`
3. **Recepción**: Hace polling cada 2 segundos a `GET /api/messages/conversation/:user1/:user2`
4. **Actualización en tiempo real**: Muestra nuevos mensajes automáticamente

## 🖥️ Ejemplo de uso

```
Terminal 1:                    Terminal 2:
User: TestUser                 User: Maria
─────────────────────────────────────────────────
> Hola Maria!                  
                              [10:30:15] TestUser: Hola Maria!
                              > Hola! ¿Cómo estás?
[10:30:20] Maria: Hola! ¿Cómo estás?
> Todo bien, ¿y tú?
                              [10:30:25] TestUser: Todo bien, ¿y tú?
```

## ⚠️ Requisitos

- Backend corriendo en `localhost:3000`
- Node.js y npm instalados
- Los usuarios deben existir en la base de datos (creados durante las pruebas anteriores)

## 🔧 Troubleshooting

**Error de conexión**: Verifica que el backend esté corriendo en el puerto 3000
**Error de login**: Verifica que los usuarios existan en la base de datos
**No se ven mensajes**: Prueba el comando `/refresh` o verifica los permisos de la API
