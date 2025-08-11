// js/main.js
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LÓGICA PARA EL MENÚ RESPONSIVE (HAMBURGUESA) ---
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('nav-visible');
        });
    }
    
    // --- URLs DEL BACKEND ---
    const API_BASE_URL = 'http://127.0.0.1:8000';
    const API_URL_RANDOM = `${API_BASE_URL}/recipes/random/10`;
    const API_URL_LOOKUP_BY_ID = `${API_BASE_URL}/recipe/`;
    const API_URL_MY_RECIPES = `${API_BASE_URL}/my-recipes`;
    const API_URL_CONTACT = 'http://127.0.0.1:8000/submit-contact';


    // --- 2. SELECTORES DEL DOM ---
    const detailModal = document.getElementById('recipe-detail-modal');
    const contactForm = document.getElementById('contact-form');


    // --- 3. LÓGICA DEL CARRUSEL (SWIPER.JS) - CORREGIDO ---
    const swiperContainer = document.querySelector('.recipe-swiper');

    if (swiperContainer) {
        const swiper = new Swiper(swiperContainer, {
            loop: true,
            spaceBetween: 30,
            autoplay: {
              delay: 3000,
              disableOnInteraction: false,
            },
            breakpoints: {
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });

        const fetchAndRenderCarousel = async () => {
            const swiperWrapper = document.querySelector('.recipe-swiper .swiper-wrapper');
            if (!swiperWrapper) return;
            try {
                const response = await fetch(API_URL_RANDOM);
                const data = await response.json();
                const recipes = data.meals;

                if (recipes) {
                    swiperWrapper.innerHTML = '';
                    recipes.forEach(recipe => {
                        const slide = document.createElement('div');
                        slide.className = 'swiper-slide';
                        slide.innerHTML = `
                            <div class="recipe-card">
                                 <div class="card-image-container">
                                    <img src="${recipe.strMealThumb}" alt="Imagen de ${recipe.strMeal}">
                                </div>
                                <div class="card-content">
                                    <h3>${recipe.strMeal}</h3>
                                    <button class="btn btn-small open-detail-btn" data-recipe-id="${recipe.idMeal}">Ver Receta</button>
                                </div>
                            </div>
                        `;
                        swiperWrapper.appendChild(slide);
                    });
                    
                    swiper.update();
                    swiper.loopDestroy();
                    swiper.loopCreate();

                } else {
                    swiperWrapper.innerHTML = '<p>No se pudieron cargar las recetas.</p>';
                }
            } catch (error) {
                console.error("Error al cargar recetas para el carrusel:", error);
                swiperWrapper.innerHTML = '<p>Error de conexión. Intenta de nuevo más tarde.</p>';
            }
        };

        fetchAndRenderCarousel();
    }


    // --- 4. LÓGICA DEL MODAL ---

    const saveRecipeToFavorites = async (recipeId) => {
        try {
            const response = await fetch(`${API_URL_MY_RECIPES}/${recipeId}`, {
                method: 'POST'
            });
            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error('Error saving recipe:', error);
            alert('No se pudo guardar la receta.');
        }
    };

    const showDetailModal = (recipe) => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (recipe[`strIngredient${i}`]) {
                ingredients.push(`${recipe[`strMeasure${i}`] || ''} ${recipe[`strIngredient${i}`]}`);
            }
        }
        detailModal.querySelector('#detail-recipe-img').src = recipe.strMealThumb;
        detailModal.querySelector('#detail-recipe-title').textContent = recipe.strMeal;
        detailModal.querySelector('#detail-recipe-desc').textContent = `Categoría: ${recipe.strCategory}`;
        detailModal.querySelector('#detail-recipe-instructions').textContent = recipe.strInstructions;
        const ingredientsList = detailModal.querySelector('#detail-recipe-ingredients');
        ingredientsList.innerHTML = '';
        ingredients.forEach(ing => {
            const li = document.createElement('li');
            li.textContent = ing.trim();
            ingredientsList.appendChild(li);
        });

        const favoriteButton = detailModal.querySelector('#btn-favorite');
        const deleteButton = document.getElementById('btn-delete');
        
        if(favoriteButton) favoriteButton.style.display = 'block';
        if (deleteButton) deleteButton.style.display = 'none';
        
        if(favoriteButton) favoriteButton.dataset.recipeId = recipe.idMeal;

        detailModal.classList.add('visible');
    };

    const fetchRecipeDetails = async (recipeId) => {
        try {
            const response = await fetch(`${API_URL_LOOKUP_BY_ID}${recipeId}`);
            const data = await response.json();
            if (data.meals && data.meals.length > 0) {
                showDetailModal(data.meals[0]);
            }
        } catch (error) {
            console.error('Error al buscar detalles de la receta:', error);
        }
    };


    // --- 5. MANEJADORES DE EVENTOS ---

    document.body.addEventListener('click', (e) => {
        const detailButton = e.target.closest('.open-detail-btn');
        const closeModalButton = e.target.matches('.close-modal');
        const favoriteButton = e.target.closest('#btn-favorite');

        if (detailButton) {
            const recipeId = detailButton.dataset.recipeId;
            fetchRecipeDetails(recipeId);
        }
        if (closeModalButton) {
            e.target.closest('.modal-overlay').classList.remove('visible');
        }
        if (favoriteButton) {
            const recipeId = favoriteButton.dataset.recipeId;
            saveRecipeToFavorites(recipeId);
        }
    });

    // --- 6. LÓGICA DEL FORMULARIO DE CONTACTO ---
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(API_URL_CONTACT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert(result.message);
                    contactForm.reset();
                } else {
                    alert(`Error: ${result.detail}`);
                }
            } catch (error) {
                console.error('Error al enviar el formulario:', error);
                alert('Hubo un problema al enviar tu mensaje. Intenta de nuevo más tarde.');
            }
        });
    }
});