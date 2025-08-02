import { fetchRandomRecipes } from './api.js';
import { renderRecipeCards, showMessage } from './dom.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Click & Cook - DOM completamente cargado.');
    loadInitialContent();
    setupNavigationEvents();
    // Otras inicializaciones o eventos globales
});

function loadInitialContent() {
    // Dependiendo de la página, cargar contenido específico
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === '' || currentPage === 'index.html') {
        // Lógica específica para la página de inicio
        // Por ejemplo, podríamos cargar algunas recetas destacadas aquí
        // fetchRandomRecipes(3).then(recipes => {
        //     const container = document.getElementById('featured-recipes-container');
        //     if (container) {
        //         renderRecipeCards(recipes, container);
        //     }
        // }).catch(error => console.error('Error al cargar recetas destacadas:', error));
    } else if (currentPage === 'explore.html') {
        // Lógica para la página de exploración
        const searchButton = document.getElementById('search-button');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                const searchInput = document.getElementById('search-input');
                // Llama a la función de búsqueda de api.js
                // Por ejemplo: searchRecipes(searchInput.value);
                showMessage('Buscando recetas...', 'info');
            });
        }
    }
    // Añade más lógica para otras páginas según sea necesario
}

function setupNavigationEvents() {
    // Ejemplo de cómo podrías manejar eventos de navegación si tuvieras SPA
    // Por ahora, como son HTML separados, no es tan crítico aquí.
    // Pero si quieres "precargar" contenido al hacer hover, podrías añadirlo.
}

// Puedes añadir funciones globales aquí que se usen en varias partes del sitio
// Por ejemplo, una función para mostrar mensajes de éxito/error en el sitio
window.displayGlobalMessage = showMessage;