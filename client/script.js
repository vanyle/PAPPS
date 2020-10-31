// Permet avec AJAX de récupérer le contenu du site à url avec une requete GET.
// Usage: let content = await get_website("/q?type=info");
function get_website(url){
	return new Promise( (resolve) => {
		let httpRequest = new XMLHttpRequest();
		httpRequest.onreadystatechange = () => {
			if(httpRequest.readyState === XMLHttpRequest.DONE){
				resolve(httpRequest.responseText);
			}
		};
		httpRequest.open('GET', url, true);
		httpRequest.send();
	});
}


// Shows a specific section of the website.
function displaySection(section_name){
	// Hide all other section
	let toHide = document.getElementsByClassName('block');
	for(let j = 0;j < toHide.length;j++){
		toHide[j].style.display = 'none'; // hide.
	}
	// Show the right section
	let toShow = document.getElementsByClassName(section_name);
	for(let j = 0;j < toShow.length;j++){
		toShow[j].style.display = ''; // default display style.
	}
	location.hash= '#' + section_name;
}


function titleToID(title) {
        return title.replace("/ /g","-");
}

function displayRecipeCard(title, description, image, rating = 0) {
        var id = titleToID(title);
        var elemHTML = '<div class="list-card" id="' + id + '"> <img class="list-recipe-image" src="' + image +'" alt="Photo de la recette" width="150px"/> <div class="list-recipe-info-container"> <div class="list-recipe-info-top"> <h3 class="list-recipe-title">' + title + '</h3> <div class="sc"> </div> </div><p class="list-recipe-description">' + description + '</p> </div> </div>';
        var list_cont = document.querySelector("#recipe-list-container");
        var inn = list_cont.innerHTML;
        inn += elemHTML;
        list_cont.innerHTML = inn;

        var elem = document.getElementById(id);
        var starContainer = elem.querySelector(".sc");
        var SR = new StarRating(starContainer, rating);
        SR.setRating(rating);
        return SR;

}



// If you need to put color in the console.
// This can be used for cool login functions or to indicate to the user that he should not copy paste anything here.
// console.log("%cHi :)","color: red;font-size:30px;");

// Start of the code
(async () => {
	// Add events for the navigation buttons
	let navElements = document.querySelectorAll('nav > a');
	for(let i = 0;i < navElements.length;i++){
		let el = navElements[i];
		el.addEventListener('click',function(){ // fonction appelee lorsque le bouton est cliqué
			let sectionToShow = this.getAttribute('data-show');
			displaySection(sectionToShow);
		});
	}

	// Retreive the hash in the url and display the proper section
	// This is so that when a user reloads, he still sees the same page
	let displayed_section = location.hash;
	displayed_section = displayed_section.substring(1,displayed_section.length);
	if(displayed_section !== ""){
		displaySection(displayed_section);
	}else{
		displaySection("home");
	}
})();
