// A small library used to manage AJAX queries and section tabs.

// Usage:
// set_load_section_event('section_name',() => {
//		// stuff to do when the section loads.
// });



// ----------------------------------------------------
// AJAX and API related

// Allows to fetch the content of a website with AJAX (no cross origin content of course)
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

// The methods below provide a full implementation of most of the requests available.

async function get_all_recipes(){
	let content = await get_website("/q?type=recipes");
	let recipeList = JSON.parse(content);

	if(recipeList.error) return []; // provide a nice error message here.

	return recipeList;
}


async function is_login(){
	let content = JSON.parse(await get_website("/q?type=uinfo"));
	if(content.error) return false;

	return content;
}

async function login(username,password){
	let content = JSON.parse(await get_website("/q?type=log&name="+username+"&pass="+password));
	if(content.error) return false;

	return content;
}

// ------------------------------------------------------
// Section related

let section_load_events = {};

function set_load_section_event(section_name,function_name){
	section_load_events[section_name] = function_name;	
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

	(section_load_events[section_name] || function(){})();
}

async function display_nav(){
	let auth = await is_login();
	document.querySelectorAll('[data-require-auth]').forEach((el) => {
		let auth_required = el.getAttribute('data-require-auth');
		if(
			(auth_required === null ||
			(auth_required === 'basic' && auth) ||
			(auth && auth.rights.indexOf(auth_required) !== -1)) ||
			(auth_required == 'no' && !auth)
		){
			el.style.display = '';
		}else{
			el.style.display = 'none';
		}
	});
	document.querySelectorAll('[data-username]').forEach((el) => {
		el.innerHTML = auth ? auth.name : "";
	});
}

addEventListener('load',async () => {
	// Add events for the navigation buttons
	let navElements = document.querySelectorAll('nav > a');
	for(let i = 0;i < navElements.length;i++){
		let el = navElements[i];
		el.addEventListener('click',function(){ // fonction appelee lorsque le bouton est cliqué
			let sectionToShow = this.getAttribute('data-show');
			displaySection(sectionToShow);
		});
	}

	display_nav();

	// Retreive the hash in the url and display the proper section
	// This is so that when a user reloads, he still sees the same page
	let displayed_section = location.hash;
	displayed_section = displayed_section.substring(1,displayed_section.length);
	if(displayed_section !== ""){
		displaySection(displayed_section);
	}else{
		displaySection("home");
	}
});