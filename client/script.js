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
