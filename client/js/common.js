// Common to all JS files. sets up the sections library, the header and stuff.
// Must be loaded at the end of the body, after all other JS Files.
// This creates some nice HTML rules

// <span data-require-auth="some rights"></span> this element will only be displayed if the user has the appropriate rights
// <span data-username=""></span> this element will contain the username of the user if we is logged in.
// <span data-show="home"></span> when clicked, the section named home will be displayed and all other sections will be hidden
// a section is an element with the class 'block'. The name of the section is the class it has.


// Navigation sections
let sections = [
	{
		"name":"home",
		"display":"Accueil",
		"auth":null, // what authentification is required to see the section
		"file":null // js file related to this section
	},
	{
		"name":"browse",
		"display":"Les recettes",
		"auth":null,
		"file":"recipe_section.js"
	},
	{
		"name":"new",
		"display":"Créer une recette",
		"auth":"make_recipe",
		"file":"new_section.js"
	},
	{
		"name":"shop",
		"display":"Liste de courses",
		"auth":"basic", // login required
		"file":null
	},
	{
		"name":"connect",
		"display":"Connexion",
		"auth":"no", // not being logged is required
		"file":"connect_section.js"
	},
	{
		"name":"me",
		"display":"@name",
		"auth":"basic",
		"file":"me_section.js",
		"span":true // displayed on the right outside of nav.
	}
];

// generate the header and nav
// load the js files if needed (ie the header is displayed.)

async function build_header(){
	auth = await is_login();

	for(let i in sections){
		let current = sections[i];
		let el = document.createElement("a");

		el.id = "header-username-link";

		if(window.notIndexHTML){
			el.href = '/index.html#' + current.name;
		}

		if(current.name){
			el.setAttribute('data-show',current.name);
		}
		el.setAttribute('data-require-auth',current.auth ? current.auth : "none");

		if(current.file){
			el.setAttribute('data-file',current.file);
		}

		el.innerHTML = text_formatter(current.display);


		if(current.span){
			document.querySelector("header").appendChild(el);
		}else{
			document.querySelector("nav").appendChild(el);
		}
	}
}

function notify(message) {
  var elem = document.createElement("div");

  elem.innerHTML = message;
  var notificationContainer = document.getElementById("notification-container");
  notificationContainer.appendChild(elem);

  elem.className = "message messageIn";

	function hideNotification() {
	    elem.className = "message messageOut";
	    animationEndCallback = (e) => {
	      elem.removeEventListener('animationend', animationEndCallback);
	      elem.outerHTML = "";
	    }
	    elem.addEventListener('animationend', animationEndCallback);
	}

	setTimeout(hideNotification,3000);

  elem.addEventListener('click',hideNotification);
}

var headerMenu = document.querySelector("#headerMenu");
var menuButton = document.getElementById("toggleMenuButton");
var menuButtonSandwich = document.getElementById("toggleMenuButtonInsideSandwich");
var menuButtonSandwichContainer = document.getElementById("sandwichButtonContainer");
var menuDisplayed = false;

function handleResize() {

	if(window.innerWidth > 600) {
		headerMenu.style.display = "flex";
		menuButton.style.display = "none";
		menuButtonSandwichContainer.style.display = "none";
	} else {
		console.log(menuDisplayed);
		if(menuDisplayed) {
			headerMenu.style.display = "flex";
		} else {
			headerMenu.style.display = "none";
		}
		menuButton.style.display = "flex";
		menuButtonSandwichContainer.style.display = "flex";
	}
}

function toggleMenuDisplay() {
	if(!menuDisplayed) {//we need to display it
		headerMenu.style.display = "flex";
		headerMenu.classList.add("menuIn");

		headerInCallback = (e) => {
			headerMenu.removeEventListener("animationend", headerInCallback);
			headerMenu.classList.remove("menuIn");
		}
		headerMenu.addEventListener("animationend",headerInCallback);

	} else {//hide it
		headerMenu.classList.add("menuOut");

		headerOutCallback = (e) => {
			headerMenu.removeEventListener("animationend", headerOutCallback);
			headerMenu.classList.remove("menuOut");
			headerMenu.style.display = "none";
		}
		headerMenu.addEventListener("animationend",headerOutCallback);
	}
	menuDisplayed = !menuDisplayed;
}

menuButton.addEventListener("click", toggleMenuDisplay);
menuButtonSandwich.addEventListener("click", toggleMenuDisplay);

window.addEventListener("load", handleResize);
window.addEventListener("resize", handleResize);
