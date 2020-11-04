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
	if(recipeList.error) return [];
	return recipeList;
}
async function get_recipes_from_search(search){
	let content = await get_website("/q?type=recipes&s="+search);
	let recipeList = JSON.parse(content);
	if(recipeList.error) return [];
	return recipeList;
}
async function get_recipe(id){
	let content = await get_website("/q?type=recipe&id=" + id);
	let data = JSON.parse(content);
	if(data.error) return false;
	return data;
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
async function deconnect(){
	let content = JSON.parse(await get_website("/q?type=unlog"));
	if(content.error) return false;

	return content;
}

// -----------------------------------------------------
// This function converts non-safe strings (that might include tags) into pretty formatted string.
// Format rules:
// @name -> name of the user if he is connected, "Toi" otherwire
// *bold*
// ~strikethrough~
// #italic#
// `monospace` // also usable for pixel arts
// {bouncing{
// }turning}
// §comic sans ms§
// ¤zoom in and out¤
// ¨rainbow¨
// \¨ escape character.

// text_formatter("<script> This is eval </script> ^^ ¨ but @name love *rainbows* ¨ \\\\ \\* this is not bold \\*") ==
// &lt;script&gt; This is eval &lt;/script&gt; ^^ <span class="rainbow"> but ... love <b>rainbows</b> </span> \ * this is not bold *

function text_formatter(input_text){
	// clean tags
	let cleaner = document.createElement('div');
	cleaner.innerText = input_text;
	input_text = cleaner.innerHTML;

	let parseInfo = [
		{'delimiter':'*','b':false,'start':'<b>','end':'</b>'},
		{'delimiter':'~','b':false,'start':'<span class="strike">','end':'</span>'},
		{'delimiter':'#','b':false,'start':'<em>','end':'</em>'},
		{'delimiter':'`','b':false,'start':'<pre>','end':'</pre>'},
		{'delimiter':'{','b':false,'start':'<span class="bounce">','end':'</span>'},
		{'delimiter':'}','b':false,'start':'<span class="spin">','end':'</span>'},
		{'delimiter':'§','b':false,'start':'<span class="comic">','end':'</span>'},
		{'delimiter':'¤','b':false,'start':'<span class="zoommove">','end':'</span>'},
		{'delimiter':'¨','b':false,'start':'<span class="rainbow">','end':'</span>'}
	];

	const patterns = [
		{'match':'@name','replace':auth ? auth.name : "Toi"}
	];

	// parse styles
	let output_text = "";
	for(let i = 0;i < input_text.length;i++){
		// if 2 \ in a row, skip them
		if(input_text[i] === '\\' && input_text[i+1] === '\\'){
			output_text += "\\";
			i++;
			continue;
		}
		if(input_text[i] === '\\') continue;

		let match = false;
		for(let j in parseInfo){
			if(input_text[i] === parseInfo[j].delimiter && input_text[i-1] !== '\\'){

				output_text += parseInfo[j].b ? parseInfo[j].end : parseInfo[j].start;					
				parseInfo[j].b = !parseInfo[j].b;
				match = true;
				break;
			}
		}
		if(match) continue;
		for(let j in patterns){
			if(input_text.substring(i,i + patterns[j].match.length) === patterns[j].match){
				output_text += patterns[j].replace;
				i += patterns[j].match.length - 1;
				match = true;
			}
		}
		if(match) continue;
		output_text += input_text[i];
	}
	return output_text;
}

function formatTime(date){
	// formats time based on french day notation:
	// 30 septembre 2011.
	return new Intl.DateTimeFormat('fr', { month: 'long',day:'2-digit',year:'numeric' }).format(date);
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
		toShow[j].style.display = 'block';
	}
	location.hash= '#' + section_name;

	(section_load_events[section_name] || function(){})();
}

async function display_nav(){
	let auth = await is_login();

	let loadCount = 0;
	let loadCountRequired = 0;

	// finish only when all scripts are loaded.
	return new Promise( (resolve) => {
		document.querySelectorAll('[data-require-auth]').forEach((el) => {
			let auth_required = el.getAttribute('data-require-auth');
			if(
				(auth_required === "none" ||
				(auth_required === 'basic' && auth) ||
				(auth && auth.rights.indexOf(auth_required) !== -1)) ||
				(auth_required == 'no' && !auth)
			){
				if(el.getAttribute('data-file')){
					// load the js data-file:
					let script = document.createElement('script');
					script.onload = () => {
						loadCount ++;
						if(loadCountRequired == loadCount){
							resolve();
						}
					}
					loadCountRequired ++;
					script.src = 'js/' + el.getAttribute('data-file');
					document.head.appendChild(script); // not needed for execution but it's nice to now what scripts have been loaded.
					
				}
				el.style.display = '';
			}else{
				el.style.display = 'none';
			}
		});
		document.querySelectorAll('[data-username]').forEach((el) => {
			if(auth){
				el.innerHTML = auth.name;
			}
		});
	});
}

addEventListener('load',async () => {
	
	await build_header(); // generate the navigation buttons

	// Add events for the navigation buttons
	document.querySelectorAll('[data-show]').forEach((el) => {
		el.addEventListener('click',function(){ // fonction appelee lorsque le bouton est cliqué
			let sectionToShow = this.getAttribute('data-show');
			displaySection(sectionToShow);
		});
	});

	await display_nav();

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