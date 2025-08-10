# db/db.py
import mysql.connector
from mysql.connector import errorcode

# Tus credenciales de la base de datos
DB_CONFIG = {
    'host': "127.0.0.1",
    'port': "3307",
    'user': "root",
    'password': "123Queso.",
    'database': "recetas_db"
}

def get_db_connection():
    """Crea y devuelve una nueva conexión a la base de datos."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Error al conectar a la base de datos: {err}")
        return None

def init_db():
    """
    Crea la base de datos y la tabla de recetas guardadas si no existen.
    Esta función se llama al iniciar la aplicación FastAPI.
    """
    db_name = DB_CONFIG['database']
    try:
        # Conectamos sin especificar la base de datos para poder crearla
        conn_params_without_db = DB_CONFIG.copy()
        conn_params_without_db.pop('database')
        
        conn = mysql.connector.connect(**conn_params_without_db)
        cursor = conn.cursor()
        
        # Creamos la base de datos si no existe
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` DEFAULT CHARACTER SET 'utf8'")
        print(f"Base de datos '{db_name}' asegurada.")
        
        # Ahora nos conectamos a nuestra base de datos específica
        conn.database = db_name

        # Creamos la tabla si no existe
        table_name = "saved_recipes"
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS `{table_name}` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `recipe_id` VARCHAR(10) NOT NULL UNIQUE,
            `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_table_query)
        print(f"Tabla '{table_name}' asegurada.")
        
        cursor.close()
        conn.close()

    except mysql.connector.Error as err:
        print(f"Error durante la inicialización de la base de datos: {err}")
        exit(1) # Salimos si no podemos inicializar la BD