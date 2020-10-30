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

let navElements = document.querySelectorAll('nav > a');
for(let i = 0;i < navElements.length;i++){
	let el = navElements[i];
	el.addEventListener('click',function(){ // fonction appelee lorsque le bouton est cliqué
		let sectionToShow = this.getAttribute('data-show');
		displaySection(sectionToShow);
	});
}

let displayed_section = location.hash;
displayed_section = displayed_section.substring(1,displayed_section.length);
if(displayed_section !== ""){
	displaySection(displayed_section);
}else{
	displaySection("home");
}

// Astuce pour avoir de la couleur dans la console.
// console.log(trucaafficher);
// marche tres bien dans 99% des cas.
console.log("%cHi :)","color: red;font-size:30px;");

(async () => {
	// Start the async stuff.
	
})();