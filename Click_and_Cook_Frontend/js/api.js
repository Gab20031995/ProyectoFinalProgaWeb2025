// Clave API de TheMealDB (Solo para desarrollo, en producción usa tu backend como proxy)
const MEAL_API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';
const BACKEND_API_BASE_URL = 'http://localhost:8000/api/'; // URL de tu backend FastAPI

/**
 * @param {string} endpoint - El endpoint de la API de TheMealDB (e.g., 'random.php', 'search.php?s=chicken')
 * @returns {Promise<any>} - La respuesta JSON de la API
 */
async function fetchMealAPI(endpoint) {
    try {
        const response = await fetch(`${MEAL_API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.meals || []; // La API de TheMealDB devuelve 'meals' o null
    } catch (error) {
        console.error(`Error fetching from TheMealDB API (${endpoint}):`, error);
        throw error; // Re-lanza el error para que sea manejado por el llamador
    }
}

/**
 * Busca recetas por nombre en TheMealDB API.
 * @param {string} query - El término de búsqueda.
 * @returns {Promise<Array>} - Un array de recetas.
 */
export async function searchRecipes(query) {
    return fetchMealAPI(`search.php?s=${query}`);
}

/**
 * Obtiene un número específico de recetas aleatorias de TheMealDB API.
 * @param {number} count - Número de recetas aleatorias a obtener.
 * @returns {Promise<Array>} - Un array de recetas aleatorias.
 */
export async function fetchRandomRecipes(count = 1) {
    const recipes = [];
    for (let i = 0; i < count; i++) {
        const result = await fetchMealAPI('random.php');
        if (result && result.length > 0) {
            recipes.push(result[0]); // Solo toma la primera receta de cada respuesta aleatoria
        }
    }
    return recipes;
}

/**
 * Obtiene una receta por su ID en TheMealDB API.
 * @param {string} id - El ID de la receta.
 * @returns {Promise<Object|null>} - La receta o null si no se encuentra.
 */
export async function getRecipeById(id) {
    const result = await fetchMealAPI(`lookup.php?i=${id}`);
    return result && result.length > 0 ? result[0] : null;
}

// --- Interacciones con tu Backend (FastAPI) ---

/**
 * Guarda una receta como favorita en tu base de datos interna.
 * @param {Object} recipeData - Datos de la receta a guardar (ej. idMeal, strMeal, strMealThumb).
 * @returns {Promise<Object>} - La respuesta de tu backend.
 */
export async function addFavoriteRecipe(recipeData) {
    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}recipes/favorite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${yourAuthToken}` // Si implementas autenticación
            },
            body: JSON.stringify(recipeData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error adding favorite recipe:', error);
        throw error;
    }
}

/**
 * Obtiene las recetas favoritas del usuario desde tu base de datos.
 * @returns {Promise<Array>} - Un array de recetas favoritas.
 */
export async function getMyRecipes() {
    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}recipes/my`, {
            // headers: { 'Authorization': `Bearer ${yourAuthToken}` } // Si implementas autenticación
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error fetching my recipes:', error);
        throw error;
    }
}

/**
 * Agrega una nueva receta creada por el usuario a tu base de datos.
 * @param {Object} recipeData - Datos de la receta creada por el usuario.
 * @returns {Promise<Object>} - La respuesta de tu backend.
 */
export async function addNewRecipe(recipeData) {
    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}recipes/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${yourAuthToken}`
            },
            body: JSON.stringify(recipeData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error adding new recipe:', error);
        throw error;
    }
}

// Puedes añadir más funciones para puntuaciones, comentarios, contacto, etc.