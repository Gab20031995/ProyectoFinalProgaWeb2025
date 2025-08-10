# api/api.py
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from db.db import init_db, get_db_connection
import uuid

# --- Modelos de datos ---
class Recipe(BaseModel):
    name: str
    category: str
    image_url: str = None
    instructions: str
    ingredients: str

class Lead(BaseModel):
    name: str
    email: str
    message: str

# --- URLs de la API externa ---
API_BASE_URL = "https://www.themealdb.com/api/json/v1/1"

# --- Aplicación FastAPI ---
app = FastAPI(
    title="Click&Cook Backend",
    description="Un intermediario para TheMealDB API, con base de datos local para recetas guardadas y creadas por el usuario."
)

# --- Evento de Inicio (Actualizado) ---
@app.on_event("startup")
def on_startup():
    """Llama a la inicialización de la base de datos y crea las tablas necesarias."""
    init_db()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Creación de la tabla 'user_recipes' (si no existe)
        create_recipes_table_query = """
        CREATE TABLE IF NOT EXISTS `user_recipes` (
            `id` VARCHAR(36) PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `category` VARCHAR(100) NOT NULL,
            `image_url` VARCHAR(255),
            `instructions` TEXT NOT NULL,
            `ingredients` TEXT NOT NULL,
            `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_recipes_table_query)
        print("Tabla 'user_recipes' asegurada.")

        # Creación de la nueva tabla 'leads'
        create_leads_table_query = """
        CREATE TABLE IF NOT EXISTS `leads` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `email` VARCHAR(255) NOT NULL,
            `message` TEXT NOT NULL,
            `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_leads_table_query)
        print("Tabla 'leads' asegurada.")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error al crear las tablas: {e}")
        exit(1)


# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints de TheMealDB ---
@app.get("/categories")
async def get_categories():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/categories.php")
        return response.json()

@app.get("/recipes/category/{category_name}")
async def get_recipes_by_category(category_name: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/filter.php?c={category_name}")
        return response.json()

@app.get("/recipes/random/{count}")
async def get_random_recipes(count: int = 12):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"{API_BASE_URL}/random.php") for _ in range(count)]
        responses = await asyncio.gather(*tasks)
        return {"meals": [res.json()["meals"][0] for res in responses]}

@app.get("/recipe/{recipe_id}")
async def get_recipe_details(recipe_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/lookup.php?i={recipe_id}")
        return response.json()

# --- ENDPOINTS PARA RECETAS GUARDADAS (DE LA API EXTERNA) ---
@app.post("/my-recipes/{recipe_id}")
def save_recipe(recipe_id: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos.")
    
    cursor = conn.cursor()
    query = "INSERT IGNORE INTO saved_recipes (recipe_id) VALUES (%s)"
    cursor.execute(query, (recipe_id,))
    conn.commit()
    
    affected_rows = cursor.rowcount
    
    cursor.close()
    conn.close()
    
    if affected_rows == 0:
        return {"message": "La receta ya estaba guardada."}
    return {"message": "Receta guardada con éxito."}

@app.get("/my-recipes")
async def get_saved_recipes():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos.")
        
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT recipe_id FROM saved_recipes ORDER BY added_at DESC")
    saved_ids = cursor.fetchall()
    
    cursor.execute("SELECT * FROM user_recipes ORDER BY created_at DESC")
    user_recipes_db = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    user_recipes_mapped = []
    for recipe in user_recipes_db:
        user_recipes_mapped.append({
            "idMeal": "local-" + recipe['id'],
            "strMeal": recipe['name'],
            "strCategory": recipe['category'],
            "strMealThumb": recipe['image_url'],
            "strInstructions": recipe['instructions'],
            "strIngredients": recipe['ingredients']
        })

    if not saved_ids:
        return {"meals": user_recipes_mapped}

    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"{API_BASE_URL}/lookup.php?i={item['recipe_id']}") for item in saved_ids]
        responses = await asyncio.gather(*tasks)
    
    full_recipes = [res.json()["meals"][0] for res in responses if res.status_code == 200 and res.json()["meals"]]
    
    all_my_recipes = full_recipes + user_recipes_mapped
    return {"meals": all_my_recipes}

@app.delete("/my-recipes/{recipe_id}")
def delete_recipe(recipe_id: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos.")
        
    cursor = conn.cursor()
    
    if recipe_id.startswith("local-"):
        actual_id = recipe_id.replace("local-", "")
        query = "DELETE FROM user_recipes WHERE id = %s"
        cursor.execute(query, (actual_id,))
    else:
        query = "DELETE FROM saved_recipes WHERE recipe_id = %s"
        cursor.execute(query, (recipe_id,))
    
    conn.commit()
    
    affected_rows = cursor.rowcount
    
    cursor.close()
    conn.close()
    
    if affected_rows == 0:
        return {"message": "La receta no se encontró en tus favoritos."}
    return {"message": "Receta eliminada con éxito."}

# --- NUEVOS ENDPOINTS PARA RECETAS DE USUARIO ---
@app.get("/user-recipe/{recipe_id}")
def get_user_recipe(recipe_id: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos.")
    
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM user_recipes WHERE id = %s"
    cursor.execute(query, (recipe_id,))
    recipe = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada.")
    
    return recipe

@app.post("/add-recipe")
def add_user_recipe(recipe: Recipe):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos.")
    
    try:
        cursor = conn.cursor()
        recipe_id = str(uuid.uuid4())
        
        query = """
        INSERT INTO user_recipes (id, name, category, image_url, instructions, ingredients) 
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (recipe_id, recipe.name, recipe.category, recipe.image_url, recipe.instructions, recipe.ingredients))
        conn.commit()
        
        return {"message": "Receta agregada con éxito.", "recipe_id": recipe_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar la receta: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@app.put("/user-recipe/{recipe_id}")
def update_user_recipe(recipe_id: str, updated_recipe: Recipe):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos.")
    
    try:
        cursor = conn.cursor()
        query = """
        UPDATE user_recipes
        SET name = %s, category = %s, image_url = %s, instructions = %s, ingredients = %s
        WHERE id = %s
        """
        cursor.execute(query, (updated_recipe.name, updated_recipe.category, updated_recipe.image_url, updated_recipe.instructions, updated_recipe.ingredients, recipe_id))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Receta no encontrada para actualizar.")
            
        return {"message": "Receta actualizada con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar la receta: {str(e)}")
    finally:
        cursor.close()
        conn.close()
        
# --- NUEVO ENDPOINT PARA EL FORMULARIO DE CONTACTO ---
@app.post("/submit-contact")
def submit_contact_form(lead: Lead):
    """Guarda la información del formulario de contacto en la tabla 'leads'."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="No se pudo conectar a la base de datos.")
    
    try:
        cursor = conn.cursor()
        query = "INSERT INTO leads (name, email, message) VALUES (%s, %s, %s)"
        cursor.execute(query, (lead.name, lead.email, lead.message))
        conn.commit()
        
        return {"message": "Mensaje enviado con éxito. ¡Gracias por contactarnos!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar el mensaje: {str(e)}")
    finally:
        cursor.close()
        conn.close()