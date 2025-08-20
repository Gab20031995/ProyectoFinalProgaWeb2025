document.addEventListener('DOMContentLoaded', () => {

    // --- Selectores del DOM ---
    const exploreGrid = document.getElementById('explore-grid');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const searchInput = document.getElementById('search-input');
    const detailModal = document.getElementById('recipe-detail-modal');
    const subNavButtons = document.querySelectorAll('.sub-nav button');

    // Selectores para la nueva sección "Agregar Receta"
    const addRecipeForm = document.getElementById('add-recipe-form');
    const recipeNameInput = document.getElementById('recipe-name');
    const recipeCategoryInput = document.getElementById('recipe-category');
    const recipeImageInput = document.getElementById('recipe-image');
    const recipeInstructionsInput = document.getElementById('recipe-instructions');
    const recipeIngredientsInput = document.getElementById('recipe-ingredients');

    // Nuevos selectores para el modal de edición
    const editRecipeModal = document.getElementById('edit-recipe-modal');
    const editRecipeForm = document.getElementById('edit-recipe-form');
    const editRecipeIdInput = document.getElementById('edit-recipe-id');
    const editRecipeNameInput = document.getElementById('edit-recipe-name');
    const editRecipeCategoryInput = document.getElementById('edit-recipe-category');
    const editRecipeImageInput = document.getElementById('edit-recipe-image');
    const editRecipeInstructionsInput = document.getElementById('edit-recipe-instructions');
    const editRecipeIngredientsInput = document.getElementById('edit-recipe-ingredients');

    // --- Estado de la aplicación ---
    let allRecipes = [];
    let allCategories = [];
    let currentView = 'explorar'; 

    // --- URLs de la API ---
    const API_BASE_URL = 'http://127.0.0.1:8000';
    const API_URL_CATEGORIES = `${API_BASE_URL}/categories`;
    const API_URL_FILTER_BY_CATEGORY = `${API_BASE_URL}/recipes/category/`;
    const API_URL_LOOKUP_BY_ID = `${API_BASE_URL}/recipe/`;
    const API_URL_RANDOM = `${API_BASE_URL}/recipes/random/12`;
    const API_URL_MY_RECIPES = `${API_BASE_URL}/my-recipes`;
    const API_URL_ADD_RECIPE = `${API_BASE_URL}/add-recipe`;
    const API_URL_USER_RECIPE = `${API_BASE_URL}/user-recipe`;


    // --- Funciones de Renderizado ---
    const renderRecipeCards = (recipes) => {
        exploreGrid.innerHTML = '';
        if (!recipes || recipes.length === 0) {
            exploreGrid.innerHTML = '<p class="section-subtitle">No se encontraron recetas para esta vista.</p>';
            return;
        }
        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.dataset.recipeId = recipe.idMeal || recipe.id;
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${recipe.strMealThumb || recipe.image_url}" alt="Imagen de ${recipe.strMeal || recipe.name}">
                </div>
                <div class="card-content">
                    <h3>${recipe.strMeal || recipe.name}</h3>
                    <p>Categoría: ${recipe.strCategory || recipe.category}</p>
                    <button class="btn btn-small open-detail-btn">Ver más</button>
                </div>
            `;
            exploreGrid.appendChild(card);
        });
    };

    const renderCategoryButtons = (categories) => {
        categoryFiltersContainer.innerHTML = '';
        const allButton = document.createElement('button');
        allButton.className = 'btn-filter active';
        allButton.textContent = 'Todos';
        allButton.dataset.category = 'all';
        categoryFiltersContainer.appendChild(allButton);

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'btn-filter';
            button.textContent = category.strCategory;
            button.dataset.category = category.strCategory;
            categoryFiltersContainer.appendChild(button);
        });
    };

    const showDetailModal = (recipe) => {
        const ingredients = [];
        const ingredientsString = recipe.strIngredients || recipe.ingredients;
        if (ingredientsString) {
             ingredientsString.split('\n').forEach(ing => {
                 ingredients.push(ing);
             });
        }

        detailModal.querySelector('#detail-recipe-img').src = recipe.strMealThumb || recipe.image_url;
        detailModal.querySelector('#detail-recipe-title').textContent = recipe.strMeal || recipe.name;
        detailModal.querySelector('#detail-recipe-desc').textContent = `Categoría: ${recipe.strCategory || recipe.category}`;
        detailModal.querySelector('#detail-recipe-instructions').textContent = recipe.strInstructions || recipe.instructions;
        const ingredientsList = detailModal.querySelector('#detail-recipe-ingredients');
        ingredientsList.innerHTML = '';
        ingredients.forEach(ing => {
            const li = document.createElement('li');
            li.textContent = ing.trim();
            ingredientsList.appendChild(li);
        });

        const favoriteButton = detailModal.querySelector('#btn-favorite');
        const editButton = document.getElementById('btn-edit');
        const deleteButton = document.getElementById('btn-delete');

        const recipeId = recipe.idMeal || recipe.id;
        const isLocal = isLocalRecipe(recipeId);

        favoriteButton.style.display = 'none';
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';

        if (currentView === 'mis-recetas') {
            if (isLocal) {
                editButton.style.display = 'inline-block';
                deleteButton.style.display = 'inline-block';
            } else {
                deleteButton.style.display = 'inline-block';
            }
        } else {
            favoriteButton.style.display = 'inline-block';
        }

        if (favoriteButton) favoriteButton.dataset.recipeId = recipeId;
        if (editButton) editButton.dataset.recipeId = recipeId;
        if (deleteButton) deleteButton.dataset.recipeId = recipeId;

        detailModal.classList.add('visible');
    };

    const openEditModal = (recipe) => {
        const recipeId = recipe.idMeal || recipe.id;
        editRecipeIdInput.value = isLocalRecipe(recipeId) ? recipeId.replace("local-", "") : recipeId;
        editRecipeNameInput.value = recipe.strMeal || recipe.name;
        editRecipeCategoryInput.value = recipe.strCategory || recipe.category;
        editRecipeImageInput.value = recipe.strMealThumb || recipe.image_url;
        editRecipeInstructionsInput.value = recipe.strInstructions || recipe.instructions;
        editRecipeIngredientsInput.value = recipe.strIngredients || recipe.ingredients;
        editRecipeModal.classList.add('visible');
        detailModal.classList.remove('visible');
    };

    const isLocalRecipe = (recipeId) => {
        return recipeId && recipeId.toString().startsWith('local-');
    };


    // --- Funciones de Lógica y API ---
    const fetchRecipesByCategory = async (categoryName) => {
        exploreGrid.innerHTML = '<p class="section-subtitle">Cargando recetas...</p>';
        try {
            const response = await fetch(`${API_URL_FILTER_BY_CATEGORY}${categoryName}`);
            const data = await response.json();
            allRecipes = data.meals;
            renderRecipeCards(allRecipes);
        } catch (error) {
            console.error('Error fetching recipes by category:', error);
        }
    };

    const fetchRandomRecipes = async () => {
        exploreGrid.innerHTML = '<p class="section-subtitle">Buscando inspiración...</p>';
        try {
            const response = await fetch(API_URL_RANDOM);
            const data = await response.json();
            allRecipes = data.meals;
            renderRecipeCards(allRecipes);
        } catch (error) {
            console.error('Error fetching random recipes:', error);
        }
    };

    const fetchMyRecipes = async () => {
        exploreGrid.innerHTML = '<p class="section-subtitle">Cargando tus recetas guardadas...</p>';
        try {
            const response = await fetch(API_URL_MY_RECIPES);
            const data = await response.json();
            allRecipes = data.meals;
            renderRecipeCards(allRecipes);
        } catch (error) {
            console.error('Error fetching my recipes:', error);
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await fetch(API_URL_CATEGORIES);
            const data = await response.json();
            allCategories = data.categories;
            renderCategoryButtons(allCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchRecipeDetails = async (recipeId) => {
        try {
            const isLocal = isLocalRecipe(recipeId);
            let data;

            if (isLocal) {
                const localRecipe = allRecipes.find(r => (r.idMeal || r.id) === recipeId);
                if (localRecipe) {
                    showDetailModal(localRecipe);
                }
                return;
            } else {
                const response = await fetch(`${API_URL_LOOKUP_BY_ID}${recipeId}`);
                data = await response.json();
                if (data.meals && data.meals.length > 0) {
                    showDetailModal(data.meals[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching recipe details:', error);
        }
    };

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

    const deleteRecipeFromFavorites = async (recipeId) => {
        try {
            const response = await fetch(`${API_URL_MY_RECIPES}/${recipeId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            alert(result.message);
            if (response.ok) {
                detailModal.classList.remove('visible');
                fetchMyRecipes();
            }
        } catch (error) {
            console.error('Error deleting recipe:', error);
            alert('No se pudo eliminar la receta.');
        }
    };

    const addRecipe = async (recipeData) => {
        try {
            const response = await fetch(API_URL_ADD_RECIPE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recipeData)
            });
            const result = await response.json();
            alert(result.message);
            addRecipeForm.reset();
        } catch (error) {
            console.error('Error adding recipe:', error);
            alert('No se pudo agregar la receta.');
        }
    };

    const updateRecipe = async (recipeId, recipeData) => {
        try {
            const response = await fetch(`${API_URL_USER_RECIPE}/${recipeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recipeData)
            });
            const result = await response.json();
            alert(result.message);
            if (response.ok) {
                editRecipeModal.classList.remove('visible');
                fetchMyRecipes();
            }
        } catch (error) {
            console.error('Error updating recipe:', error);
            alert('No se pudo actualizar la receta.');
        }
    };


    // --- Manejadores de Eventos ---
    subNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            subNavButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const view = button.dataset.view;
            const sections = document.querySelectorAll('.content-wrapper section');
            const filters = document.querySelector('.filters-container');

            sections.forEach(section => section.classList.remove('active'));

            if (view === 'explorar') {
                currentView = 'explorar';
                document.getElementById('explorar').classList.add('active');
                if (filters) filters.style.display = 'flex';
                fetchRandomRecipes();
            } else if (view === 'mis-recetas') {
                currentView = 'mis-recetas';
                document.getElementById('explorar').classList.add('active');
                if (filters) filters.style.display = 'none';
                fetchMyRecipes();
            } else if (view === 'agregar-receta') {
                currentView = 'agregar-receta';
                document.getElementById('agregar-receta').classList.add('active');
            }
        });
    });

    addRecipeForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const ingredientsArray = recipeIngredientsInput.value.split('\n').filter(ing => ing.trim() !== '');

        const recipeData = {
            name: recipeNameInput.value,
            category: recipeCategoryInput.value,
            image_url: recipeImageInput.value,
            instructions: recipeInstructionsInput.value,
            ingredients: ingredientsArray.join('\n')
        };

        addRecipe(recipeData);
    });

    editRecipeForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const recipeId = editRecipeIdInput.value;
        const ingredientsArray = editRecipeIngredientsInput.value.split('\n').filter(ing => ing.trim() !== '');

        const recipeData = {
            name: editRecipeNameInput.value,
            category: editRecipeCategoryInput.value,
            image_url: editRecipeImageInput.value,
            instructions: editRecipeInstructionsInput.value,
            ingredients: ingredientsArray.join('\n')
        };

        updateRecipe(recipeId, recipeData);
    });


    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredRecipes = allRecipes.filter(recipe =>
            (recipe.strMeal || recipe.name).toLowerCase().includes(searchTerm)
        );
        renderRecipeCards(filteredRecipes);
    });

    categoryFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-filter')) {
            document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.dataset.category;
            if (category === 'all') {
                fetchRandomRecipes();
            } else {
                fetchRecipesByCategory(category);
            }
        }
    });

    document.body.addEventListener('click', (e) => {
        const recipeCardButton = e.target.closest('.open-detail-btn');
        const closeModalButton = e.target.matches('.close-modal');
        const favoriteButton = e.target.closest('#btn-favorite');
        const editButton = e.target.closest('#btn-edit');
        const deleteButton = e.target.closest('#btn-delete');

        if (recipeCardButton) {
            const recipeId = recipeCardButton.closest('.recipe-card').dataset.recipeId;
            fetchRecipeDetails(recipeId);
        }
        if (closeModalButton) {
            e.target.closest('.modal-overlay').classList.remove('visible');
        }
        if (favoriteButton) {
            const recipeId = favoriteButton.dataset.recipeId;
            if (!isLocalRecipe(recipeId)) {
                saveRecipeToFavorites(recipeId);
            } else {
                alert("Las recetas que tú creaste ya están en tu lista.");
            }
        }
        if (editButton) {
            const recipeId = editButton.dataset.recipeId;
            const recipe = allRecipes.find(r => (r.idMeal || r.id) === recipeId);
            if (recipe) {
                openEditModal(recipe);
            }
        }
        if (deleteButton) {
            const recipeId = deleteButton.dataset.recipeId;
            if (confirm('¿Estás seguro de que quieres eliminar esta receta de tus favoritos?')) {
                deleteRecipeFromFavorites(recipeId);
            }
        }
    });

    //  Carga Inicial de la Página 
    const init = () => {
        fetchCategories();
        fetchRandomRecipes();
        document.querySelector('.sub-nav button[data-view="explorar"]').classList.add('active');
    };

    init();
});