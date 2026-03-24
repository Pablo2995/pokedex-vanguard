# 🚀 Pokédex Vanguard

Bienvenido a **Pokédex Vanguard**, una aplicación web interactiva Full-Stack que no solo funciona como un catálogo de Pokémon tradicional, sino que expande la experiencia integrando mecánicas de Roleplay (RPG), un sistema de clima inmersivo, captura, entrenamiento de tu propio equipo y batallas multijugador en tiempo real.

---

## ✨ Características Principales

*   📖 **Catálogo en Tiempo Real:** Busca y filtra Pokémon velozmente aprovechando los índices optimizados en base de datos.
*   🎒 **Gestión de Equipo RPG:** Captura y entrena hasta 6 Pokémon. Gana experiencia, sube de nivel y descubre evoluciones.
*   ✨ **Genética y Variocolor:** Sistema que otorga aleatoriamente IVs (Valores Individuales) únicos y un 5% de probabilidad de capturar Pokémon *Shiny*.
*   🌦️ **Clima Dinámico Inmersivo:** Efectos visuales de clima (Lluvia, Nieve, Tormenta, Despejado) que rotan aleatoriamente y afectan factores ambientales.
*   🌐 **Combate Online (WebSockets):** Conéctate simultáneamente con otros entrenadores y únete a un sistema de emparejamiento (Matchmaking) automático para luchar en tiempo real usando `Socket.IO`.
*   🔄 **Sistema de Intercambio (Transacciones SQL):** Reforzado con transacciones seguras (Atomicity), garantizando que los Pokémon siempre pasen a manos de sus respectivos entrenadores sin pérdida de datos.
*   🌿 **Modo Aventura:** Explora rutas, entrena, descubre líderes de gimnasio y gestiona tu propio inventario con el sistema de caché del navegador sin latencia.

---

## 🛠️ Tecnologías Utilizadas

Este proyecto adopta patrones de desarrollo modernos separando las responsabilidades claramente entre el cliente y el servidor.

**Frontend (Cliente):**
*   **React (Vite):** Framework principal para renderizar la interfaz a gran velocidad.
*   **Zustand:** Sistema de manejo global de estado ultra-ligero (En reemplazo de Redux) para persistir datos del jugador (Niveles, inventario) localmente.
*   **Framer Motion:** Librería sofisticada para transiciones, modales y animaciones del menú.
*   **Socket.io-client:** Canal de conexión ininterrumpido en tiempo real con el servidor de batallas.
*   **Axios:** Cliente HTTP para la lectura ágil de datos del backend.

**Backend (Servidor):**
*   **Node.js & Express:** Configuración del API RESTful para el manejo estandarizado de rutas (`/pokemon`, `/entrenadores`, `/capturar`).
*   **Socket.IO:** Lógica principal que intercepta las señales online para crear las "Salas de Juego" multijugador (`io.on('join_queue')`).
*   **MySQL2:** Driver moderno de bases de datos relacionales configurado mediante un "Connection Pool" para optimizar la carga simultánea de usuarios.
*   **Joi:** Validador seguro para todos los datos que los usuarios introducen a la plataforma antes de guardarlos en BD.
*   **Express Rate-Limit:** Cortafuegos que previene el spam de peticiones e inyecciones de denegación de servicio en los Endpoints públicos.

---

## ⚙️ Instalación y Configuración (Local)

Para arrancar el proyecto en tu máquina local necesitarás tener instalado [Node.js](https://nodejs.org/) y [MySQL Server](https://dev.mysql.com/).

### 1. Base de Datos (MySQL)

Asegúrate de ejecutar el servidor MySQL nativo. En el entorno de la aplicación dispones del script `setup.sql` o `setup_extra.sql` (en la raíz) de los cuales puedes volcar los datos.  
Si tienes credenciales o acceso de permisos en Linux que arreglar, puedes usar en tu terminal:

```bash
sudo bash fix_mysql.sh
```
*(Y asegurarte de que existe el esquema `pokedex_2026`).*

### 2. Levantar el Backend (Servidor)

Abre tu terminal, ingresa a la carpeta del servidor e instala las dependencias:

```bash
cd backend
npm install
npm run dev
```

El servidor detectará variables del entorno o fallback local e iniciará en `http://localhost:5000`. Verás el mensaje: `🚀 SERVIDOR VANGUARD ONLINE`.

### 3. Levantar el Frontend (Cliente Visual)

Abre otra pestaña de la terminal, accede a la carpeta de React e instálalo:

```bash
cd frontend
npm install
npm run dev
```

Abre en tu navegador la dirección que aparezca en consola (Normalmente `http://localhost:5173`). ¡Eso es todo!

---

## 📂 Arquitectura del Repositorio

```text
📦 Pokedex/
 ┣ 📂 backend/
 ┃ ┣ 📂 routes/       (Controladores REST)
 ┃ ┣ 📜 server.js     (Raíz del server web y eventos MultiPlayer)
 ┃ ┗ 📜 db.js         (Conector principal a MySQL)
 ┣ 📂 frontend/
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📂 components/ (Piezas aisladas de UI ej. PokemonCard, BattleOnline)
 ┃ ┃ ┣ 📜 App.jsx     (Corazón visual que unifica los componentes y modales)
 ┃ ┃ ┗ 📜 store.js    (Logica del motor de estado global de Zustand)
 ┃ ┗ 📜 index.html    (Canvas principal del navegador)
 ┣ 📜 setup.sql       (Archivos de construcción de la BD)
 ┗ 📜 README.md       (Manifiesto actual)
```

Desarrollado con 💻 y ☕. *Gotta catch 'em all!*
