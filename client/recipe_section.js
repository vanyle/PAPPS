// Code related to the recipe list section (also called browse)



function titleToID(title) {
        return title.replace("/ /g","-");
}

function displayLoadCardList(){
    document.querySelector("#recipe-list-container").innerHTML = `
            <div class='force_center big_padding'>
            <i class="fas fa-circle-notch fa-spin fa-3x"></i>
            </div>`;
}

function resetRecipeCardList(){
	document.querySelector("#recipe-list-container").innerHTML = "";
}

function buildRecipeCard(id, title, description, image, rating = 0) {
    var elemHTML = '<a class="recipe-card-link" href="recipe.html?id=' + id + '">';
    elemHTML += '<div class="list-card" id="' + id + '">';
    elemHTML += '<img class="list-recipe-image" src="' + image +'" alt="Photo de la recette" width="150px"/>';
    elemHTML += '<div class="list-recipe-info-container"><div class="list-recipe-info-top"> <h3 class="list-recipe-title">' + title + '</h3>';
    elemHTML += '<div class="sc" data-id="' + id + '" data-rating="' + rating + '"> </div> </div><p class="list-recipe-description">' + description + '</p> </div> </div></a>';
    return elemHTML;
}


async function loadRecipeList() {
	displayLoadCardList();
	var recipeList = await get_all_recipes();
    resetRecipeCardList();
	//show recipes
    var recipesHTML = "";
	recipeList.forEach((recipe, i) => {
        recipesHTML += buildRecipeCard(recipe.id, recipe.title, recipe.description,"media/paps.png",recipe.rating/5);
    });
    // update dom only once for better perf
    document.querySelector("#recipe-list-container").innerHTML = recipesHTML;
    document.querySelectorAll(".sc").forEach(async (element) => {
        // build the star ratings.
        let sr = new StarRating(element,element.getAttribute('data-rating'));
        if(await is_login()){
            sr.activateRating(() => {
                let id = element.getAttribute('')
            });
        }
    });
}


set_load_section_event('browse',loadRecipeList);