# 🍳 Click&Cook: Tu App de Recetas

2025- II Programación Web

**Entregable grupal #4**

**Profesor:** Alejandro Zamora Esquivel

**Alumnos:**
* Gabriel Corrales Mora.
* Jeralin Mayerlin Flores Hernández.
* Jean Rabbat Sánchez.

---
### DEMO
**Click&Cook** es un proyecto de aplicación web full-stack que permite a los usuarios explorar, guardar y gestionar recetas de cocina. La aplicación consume datos de la API pública **TheMealDB** para ofrecer un catálogo global de platillos y utiliza una base de datos propia para que los usuarios puedan guardar sus recetas favoritas y añadir sus propias creaciones.

Además, el sistema incluye un pipeline de datos automatizado con **Prefect** que procesa las recetas creadas por el usuario, garantizando la calidad de los datos, generando backups y registrando cada paso del proceso.

### ✨ Características

* **Exploración de Recetas:** Navega por miles de recetas obtenidas de una API externa.
* **Búsqueda y Filtros:** Busca recetas por nombre y fíltralas por categoría.
* **Detalles Completos:** Visualiza los detalles de cualquier receta, incluyendo ingredientes e instrucciones, en un modal interactivo.
* **Gestión de Recetas Propias (CRUD):** Los usuarios pueden **C**rear, **L**eer, **A**ctualizar y **E**liminar sus propias recetas a través de una interfaz amigable.
* **Guardar Favoritas:** Guarda recetas de la API externa en tu colección personal.
* **Pipeline de Datos Automatizado (ETL):** Un sistema robusto procesa las recetas creadas por los usuarios. Este pipeline **E**xtrae los datos, los **T**ransforma (limpiando datos nulos y estandarizando categorías) y los **C**arga a una tabla de datos limpios, además de generar backups en CSV y logs de calidad.
* **Interfaz Responsiva:** Diseño moderno y adaptable a dispositivos móviles y de escritorio.

### 🛠️ Tecnologías Utilizadas

Este proyecto está construido con las siguientes tecnologías:

**Frontend**
* **HTML:** Para la estructura semántica de la aplicación.
* **CSS:** Para el diseño y la apariencia visual.
* **JavaScript (ES6+):** Para la interactividad, manipulación del DOM y comunicación con el backend.
* **Swiper.js:** Para el carrusel de recetas populares en la página de inicio.

**Backend**
* **Python:** Como lenguaje de programación del servidor.
* **FastAPI:** Framework web de alto rendimiento para construir la API.
* **Uvicorn:** Servidor ASGI para ejecutar la aplicación FastAPI.
* **httpx:** Cliente HTTP asíncrono para realizar peticiones a la API TheMealDB.

**Base de Datos**
* **MySQL:** Para almacenar las recetas guardadas y las creadas por el usuario.
* **mysql-connector-python:** Conector oficial para la interacción entre Python y MySQL.

**Pipeline de Datos (ETL)**
* **Prefect:** Orquestador de flujos de trabajo para programar y monitorear el pipeline.
* **Pandas:** Utilizado para la manipulación y limpieza eficiente de los datos.

**Despliegue**
* **Docker & Docker Compose:** Para crear un entorno de desarrollo contenido, reproducible y fácil de levantar.

---
### 🚀 Instalación y Puesta en Marcha

Existen dos métodos para ejecutar el proyecto. El método con Docker es el más recomendado.

#### Método 1: Usando Docker (Recomendado)

Este método levanta el backend y la base de datos en contenedores aislados con un solo comando.

**Prerrequisitos:**
* Tener instalado **Docker** y **Docker Compose**.

**Pasos:**
1.  Clona el repositorio (si aplica).
2.  Navega a la carpeta raíz del backend: `cd Click_and_Cook_Backend`
3.  Revisa el archivo `docker-compose.yml` y asegúrate de que la contraseña en `DB_PASSWORD` y `MYSQL_ROOT_PASSWORD` sea la que deseas.
4.  Ejecuta el siguiente comando. La primera vez puede tardar unos minutos mientras se descargan y construyen las imágenes.
    ```bash
    docker-compose up --build
    ```
5.  ¡Listo! El backend estará corriendo en `http://localhost:8000`. Para usar el frontend, simplemente abre el archivo `Click_and_Cook_Frontend/index.html` en tu navegador.

#### Método 2: Configuración Manual (Alternativa)

**Prerrequisitos:**
* Python 3.8+
* Un servidor de MySQL en ejecución.

**Pasos:**
1.  **Configura el Backend:**
    * Navega a la carpeta `Click_and_Cook_Backend`.
    * Crea y activa un entorno virtual:
        ```bash
        python -m venv venv
        # En Windows:
        .\venv\Scripts\Activate.ps1
        ```
    * Instala las dependencias:
        ```bash
        pip install -r requirements.txt
        ```
    * Crea un archivo `.env` en la raíz de `Click_and_Cook_Backend` con tus credenciales:
        ```env
        DB_HOST=localhost
        DB_PORT=3307 # O el puerto de tu MySQL
        DB_USER=root
        DB_PASSWORD=tu_contraseña
        DB_NAME=recetas_db
        ```
    * Inicia el servidor:
        ```bash
        uvicorn api.api:app --reload
        ```
2.  **Inicia el Frontend:**
    * Abre el archivo `Click_and_Cook_Frontend/index.html` en tu navegador.

---
### ⚙️ Ejecución del Pipeline de Datos

El pipeline está diseñado para ser ejecutado y programado por **Prefect**. Para un entorno de desarrollo completo:
1.  **Terminal 1:** Inicia el servidor de Prefect: `prefect server start`
2.  **Terminal 2:** Despliega el pipeline: `prefect deploy ...`
3.  **Terminal 3:** Inicia un worker: `$env:PREFECT_API_URL=...` y `prefect worker start ...`

Para una ejecución manual y sencilla, puedes ejecutar el script directamente:
```bash
python pipeline/pipeline.py

📂 Estructura del Proyecto

PROYECTO_FINAL/
│
├── Click_and_Cook_Backend/
│   ├── api/
│   │   └── api.py          # Lógica principal de la API con FastAPI
│   ├── db/
│   │   └── db.py           # Conexión e inicialización de la BD
│   ├── pipeline/
│   │   ├── backups/        # Backups en CSV generados por el pipeline
│   │   ├── logs/           # Logs de ejecución del pipeline
│   │   └── pipeline.py     # Script del pipeline ETL con Prefect
│   ├── .env                # (Local) Credenciales para desarrollo manual
│   ├── Dockerfile          # Instrucciones para construir la imagen del backend
│   ├── docker-compose.yml  # Orquestador de servicios (backend + db)
│   └── requirements.txt    # Dependencias de Python
│
└── Click_and_Cook_Frontend/
    ├── assets/             # Imágenes y logos
    ├── css/
    │   └── styles.css      # Estilos de la aplicación
    ├── js/
    │   ├── main.js         # Lógica de la página principal y contacto
    │   └── recetas.js      # Lógica de la página de recetas
    ├── index.html          # Página de inicio
    ├── recetas.html        # Página de exploración y gestión de recetas
    ├── nosotros.html       # Página "Sobre Nosotros"
    └── contacto.html       # Página de contacto