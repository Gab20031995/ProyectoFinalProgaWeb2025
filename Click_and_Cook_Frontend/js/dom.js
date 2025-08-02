/**
 * Renderiza tarjetas de recetas en un contenedor dado.
 * @param {Array<Object>} recipes - Un array de objetos de recetas.
 * @param {HTMLElement} containerElement - El elemento DOM donde se renderizarán las tarjetas.
 */
export function renderRecipeCards(recipes, containerElement) {
    if (!containerElement) {
        console.error('Container element for recipes not found.');
        return;
    }
    containerElement.innerHTML = ''; // Limpiar contenido previo

    if (!recipes || recipes.length === 0) {
        containerElement.innerHTML = '<p>No se encontraron recetas.</p>';
        return;
    }

    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.classList.add('card', 'recipe-card'); // Añade clase 'recipe-card' para estilos específicos

        // Asegúrate de que los nombres de las propiedades coincidan con la API de TheMealDB o tu backend
        const id = recipe.idMeal || recipe.id; // Puede venir de API externa o interna
        const title = recipe.strMeal || recipe.title;
        const imageUrl = recipe.strMealThumb || recipe.image_url;

        recipeCard.innerHTML = `
            <img src="${imageUrl}" alt="${title}" class="recipe-image">
            <h3>${title}</h3>
            <p class="recipe-category">${recipe.strCategory || ''}</p>
            <div class="card-actions">
                <a href="recipe-detail.html?id=${id}" class="btn btn-primary">Ver Receta</a>
                <button class="btn btn-secondary add-favorite-btn" data-recipe-id="${id}">Favorito</button>
            </div>
        `;
        containerElement.appendChild(recipeCard);

        // Agrega un event listener al botón de favorito
        const favoriteButton = recipeCard.querySelector(`.add-favorite-btn[data-recipe-id="${id}"]`);
        if (favoriteButton) {
            favoriteButton.addEventListener('click', async () => {
                // Aquí podrías obtener los datos completos de la receta antes de enviar
                // O enviar los datos básicos que ya tienes
                const basicRecipeData = {
                    idMeal: recipe.idMeal,
                    strMeal: recipe.strMeal,
                    strMealThumb: recipe.strMealThumb,
                    strCategory: recipe.strCategory,
                    strArea: recipe.strArea
                    // Añade más campos si son relevantes para guardar como favorito
                };
                try {
                    const response = await import('./api.js').then(module => module.addFavoriteRecipe(basicRecipeData));
                    showMessage('¡Receta añadida a favoritos!', 'success');
                    console.log('Receta favorita añadida:', response);
                } catch (error) {
                    showMessage('Error al añadir a favoritos.', 'error');
                    console.error('Error adding favorite:', error);
                }
            });
        }
    });
}

/**
 * Muestra un mensaje temporal al usuario.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - 'success', 'error', 'info'.
 */
export function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('global-message-container');
    if (!messageContainer) {
        const body = document.querySelector('body');
        const newContainer = document.createElement('div');
        newContainer.id = 'global-message-container';
        newContainer.style.position = 'fixed';
        newContainer.style.bottom = '20px';
        newContainer.style.right = '20px';
        newContainer.style.zIndex = '1000';
        body.appendChild(newContainer);
        messageContainer = newContainer;
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = message;
    messageElement.style.padding = '10px 20px';
    messageElement.style.margin = '5px 0';
    messageElement.style.borderRadius = '5px';
    messageElement.style.color = 'white';
    messageElement.style.opacity = '0';
    messageElement.style.transition = 'opacity 0.5s ease-in-out';

    if (type === 'success') {
        messageElement.style.backgroundColor = '#4CAF50'; /* Verde */
    } else if (type === 'error') {
        messageElement.style.backgroundColor = '#F44336'; /* Rojo */
    } else {
        messageElement.style.backgroundColor = '#2196F3'; /* Azul */
    }

    messageContainer.appendChild(messageElement);

    setTimeout(() => {
        messageElement.style.opacity = '1';
    }, 10); // Pequeño retraso para que la transición funcione

    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.addEventListener('transitionend', () => messageElement.remove());
    }, 3000); // El mensaje desaparece después de 3 segundos
}

// Puedes añadir más funciones para renderizar formularios, gráficos, etc.