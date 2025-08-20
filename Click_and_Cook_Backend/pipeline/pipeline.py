# pipeline.py (Versión Final con Carpetas Locales)

import os
import logging
import pandas as pd
import mysql.connector
from datetime import datetime
from prefect import task, flow
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.append(PROJECT_ROOT)

from db.db import DB_CONFIG

LOG_DIR = os.path.join(SCRIPT_DIR, "logs") 
os.makedirs(LOG_DIR, exist_ok=True)
log_file_path = os.path.join(LOG_DIR, f"pipeline_run_{datetime.now().strftime('%Y%m%d')}.log")

logging.basicConfig(
    filename=log_file_path,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# TAREAS DEL PIPELINE 

@task
def extract_all_recipe_ids() -> list[str]:
    """Extrae todos los IDs únicos de la tabla user_recipes."""
    logging.info("Extrayendo todos los IDs de recetas de usuario...")
    try:
        with mysql.connector.connect(**DB_CONFIG) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT id FROM user_recipes")
            recipe_ids = [row[0] for row in cursor.fetchall()]
            logging.info(f"Se encontraron {len(recipe_ids)} IDs de recetas para procesar.")
            return recipe_ids
    except mysql.connector.Error as err:
        logging.error(f"Error al extraer IDs de recetas: {err}", exc_info=True)
        return []

@task
def process_and_load_recipe(recipe_id: str):
    """Ejecuta el ETL para una sola receta y la carga en la tabla 'cleaned'."""
    logging.info(f"--- Procesando receta ID: {recipe_id} ---")
    
    try:
        with mysql.connector.connect(**DB_CONFIG) as conn:
            # 1. EXTRACT
            query = f"SELECT * FROM user_recipes WHERE id = '{recipe_id}'"
            df_raw = pd.read_sql(query, conn)

            if df_raw.empty:
                logging.warning(f"No se encontraron datos para la receta ID: {recipe_id}")
                return {"status": "skipped", "id": recipe_id}

            records_read = len(df_raw)
            logging.info(f"Extraídos {records_read} registros para la receta {recipe_id}.")

            # 2. TRANSFORM
            df_clean = df_raw.dropna(subset=['instructions', 'ingredients'])
            df_clean.loc[:, 'image_url'] = df_clean['image_url'].fillna("assets/default_recipe.png")
            df_clean.loc[:, 'category'] = df_clean['category'].str.lower()
            
            records_cleaned = len(df_clean)
            records_removed = records_read - records_cleaned
            logging.info(f"Transformación para {recipe_id} completa. Eliminados: {records_removed}, Limpios: {records_cleaned}")

            # 3. LOAD
            if not df_clean.empty:
                cursor = conn.cursor()
                cursor.execute("CREATE TABLE IF NOT EXISTS user_recipes_cleaned LIKE user_recipes;")
                
                for _, row in df_clean.iterrows():
                    query_load = """
                        INSERT INTO user_recipes_cleaned (id, name, category, image_url, instructions, ingredients, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            name = VALUES(name),
                            category = VALUES(category),
                            image_url = VALUES(image_url),
                            instructions = VALUES(instructions),
                            ingredients = VALUES(ingredients);
                    """
                    cursor.execute(query_load, tuple(row))
                conn.commit()
                logging.info(f"Datos limpios para {recipe_id} cargados/actualizados en 'user_recipes_cleaned'.")
            
            # 4. BACKUP
            backup_dir = os.path.join(SCRIPT_DIR, "backups") 
            os.makedirs(backup_dir, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = os.path.join(backup_dir, f"backup_recipe_{recipe_id}_{timestamp}.csv")
            df_raw.to_csv(backup_file, index=False)
            logging.info(f"Backup de datos crudos para {recipe_id} guardado en {backup_file}")
            
            return {"status": "success", "id": recipe_id, "removed": records_removed}

    except Exception as e:
        logging.error(f"Error procesando la receta {recipe_id}: {e}", exc_info=True)
        return {"status": "failed", "id": recipe_id}

# FLUJO PRINCIPAL

@flow(name="ETL de Recetas de Usuario v2")
def recipe_etl_flow_v2():
    """Flujo ETL que procesa cada receta de usuario de forma individual."""
    recipe_ids = extract_all_recipe_ids()
    if not recipe_ids:
        logging.info("--- Fin del pipeline: No hay recetas para procesar. ---")
        return

    results = process_and_load_recipe.map(recipe_ids)
    
    logging.info("--- Resumen de la Ejecución del Pipeline ---")
    print("Flujo completado. Revisa el archivo de log para ver los detalles.")

if __name__ == "__main__":
    recipe_etl_flow_v2()