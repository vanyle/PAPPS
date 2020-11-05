let currentDataURL = "";

function getCurrentTags(){
    let tags = [];
    document.querySelectorAll(".recipe-tags-list > a").forEach((el) => {
        tags.push(el.getAttribute('data-tag'));
    });
    return tags;
}
function getCurrentIngredients(){
    let ingredients = [];
    document.querySelectorAll(".recipe-ingredients-list > li").forEach((el) => {
        ingredients.push(el.getAttribute('data-ingredient'));
    });
    return ingredients;
}
function getCurrentSteps(){
    let steps = [];
    document.querySelectorAll(".recipe-steps-list > li").forEach((el) => {
        steps.push(el.getAttribute('data-step'));
    });
    return steps;
}

async function loadNew() {
    title_input_dom.onkeyup = function(){
        document.querySelector('.recipe-title').innerHTML = text_formatter(this.value);
    };

    description_input_dom.onkeyup = function(){
        document.querySelector('.recipe-description').innerHTML = text_formatter(this.value);
    };
    image_input_dom.onchange = function(){
        // convert file to data url and display it.
        let file = image_input_dom.files[0];
        let reader  = new FileReader();
        reader.onload = function (e) {
            currentDataURL = e.target.result;
        }
        reader.onloadend = function(){
            // access to image as base64
            // this is a string that starts with data:image/
            document.querySelector('.recipe-image').src = currentDataURL;
        }
        reader.readAsDataURL(file);
    };

    let addTag = () => {
        let tag = tag_selector_dom.value;
        let current_tags = getCurrentTags();

        if(current_tags.length >= 6){
            toast('Pas plus de 6 tags sont autorisés !');
            return;
        }

        if(tag !== "" && current_tags.indexOf(tag) === -1){
            const delete_button = "<button class='small'><i class='fa fa-trash'></i></button>";
            let tagObject = document.createElement('a');
            tagObject.setAttribute('data-tag',tag);
            tagObject.className = 'tag';
            tagObject.innerHTML = tag + delete_button;
            document.querySelector(".recipe-tags-list").appendChild(tagObject);
            tag_selector_dom.value = "";

            let button = tagObject.querySelector('button');
            button.onclick = () => {
                button.parentElement.parentElement.removeChild(button.parentElement);
            }
        }else{
            toast('Tag invalide.');
        }
    };
    tag_button_dom.onclick = addTag;

    let addIngredient = () => {
        let current_ingredients = getCurrentIngredients();
        if(current_ingredients.length >= 100){
            toast('Pas plus de 100 ingrédients sont autorisés !');
            return;
        }
        let new_ingredient = ingredient_input_dom.value;
        if(new_ingredient.length >= 200 && new_ingredient.length > 0){
            toast('Le nom de ton ingrédient est trop long ! (Plus de 200 caractères) ou vide');
            return;
        }
        // too lazy to perform charset check. Let's let the server handle it.
        // They are html tag stripped anyway.
        const delete_button = "<button class='small'><i class='fa fa-trash'></i></button>";
        let ingredientObject = document.createElement('li');
        ingredientObject.setAttribute('data-ingredient',new_ingredient);
        ingredientObject.innerHTML += new_ingredient + delete_button;
        document.querySelector(".recipe-ingredients-list").appendChild(ingredientObject);
        ingredient_input_dom.value = "";

        let button = ingredientObject.querySelector('button');
        button.onclick = () => {
            button.parentElement.parentElement.removeChild(button.parentElement);
        }
    };
    ingredient_button_dom.onclick = addIngredient;
    ingredient_input_dom.onkeydown = (e) => {
        if(e.key === "Enter"){
            e.preventDefault();
            addIngredient();
        }
    };

    let addStep = () => {
        let current_steps = getCurrentSteps();
        if(current_steps.length >= 100){
            toast('Pas plus de 100 étapes sont autorisés !');
            return;
        }
        let new_step = step_input_dom.value;
        if(new_step.length >= 1000 && new_step.length > 0){
            toast('L\' étape est trop longue ! (Plus de 1000 caractères) ou vide');
            return;
        }
        // too lazy to perform charset check. Let's let the server handle it.
        // They are html tag stripped anyway.
        const delete_button = "<button class='small'><i class='fa fa-trash'></i></button>";
        let stepObject = document.createElement('li');
        stepObject.setAttribute('data-step',new_step);
        stepObject.innerHTML += text_formatter(new_step) + delete_button;
        document.querySelector(".recipe-steps-list").appendChild(stepObject);
        step_input_dom.value = "";

        let button = stepObject.querySelector('button');
        button.onclick = () => {
            button.parentElement.parentElement.removeChild(button.parentElement);
        }
    };
    step_button_dom.onclick = addStep;


    publish_button_dom.onclick = async () => {
        // Let's publish this bad boy !
        let recipeObject = {
            title: title_input_dom.value,
            description:description_input_dom.value,
            image: currentDataURL, // hope this works
            tags: getCurrentTags(),
            ingredients: getCurrentIngredients(),
            steps: getCurrentSteps()
        };
        console.log(recipeObject);

        let result = JSON.parse(await post_website('/q?type=make_recipe',recipeObject));
        if(result.error){
            toast('Impossible de créer la recette. Ce message explique pourquoi: '+result.error);
        }else{
        //console.log(result);
           location.href = '/recipe.html?id=' + result.id;
        }
    };
}

set_load_section_event('new',loadNew);