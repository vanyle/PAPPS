// This file contains some fake data to populate the database.
// It is also used as documentation for what the database looks like.

"use strict";

let rw = require('./db_interface.js');
let shajs = require('sha.js');


let rndInnerState = 123;
// used to get deterministic fake data.
function seeded_random(){
	rndInnerState *= 37;
	rndInnerState += 31;
	rndInnerState %= 10000;
	return rndInnerState;
}
function seeded_pick(arr){
	return arr[Math.floor(seeded_random() % arr.length)];
}


// Warning, this function override the content of the database !
module.exports.populate_db = async (r) => {

	// ----------------------------------------------------------
	// user related
	await rw.deleteTable("users",r); // clear user table.
	await rw.createTable("users",r);

	let names = ["Auguste","René","Charles","Manon","Iza","Bob","XxWarrior76xX","Quentin","Gabrielle","tom","ines","Emma"];
	let mail_extensions = ["@orange.fr","@gmail.com","@student-cs.fr","@protomail.com","@xyz.fr"];
	let right_sets = [[],["delete_recipe","new_recipe"],["delete_recipe","new_recipe","delete_comment"]];

	let passwords = ["azerty","qwerty","0987654321","bluck","iloveu","onmappellelovni","696969","pistache"];

	for(let i = 0;i < names.length;i++){
		let name = names[i];
		let email = name.toLowerCase() + seeded_pick(mail_extensions);
		let pass = seeded_pick(passwords);
		let rights = seeded_pick(right_sets);

		rw.create_user(name,rights,pass,email,r);
		console.log("Added user: "+name+" with pass: "+pass);
	}

	// --------------------------------------------------
	// recipes related
	await rw.deleteTable("recipes",r); // ignore errors if the table does not exist, this is a setup function
	await rw.createTable("recipes",r);


	let recipe_names = ["Frite","Gateau","Glace","Steak","Pâtes","Tomates","Poulet","Champignons","Tarte","Roulade","Cheesecake"];
	let adj_for_recipes = ["à la poêle","au chocolat","à la vanille","au poivre","bolognaise","carbonara","à l'italienne","à la française","au curry","au four","avec des champignons","au citron"];

	let steps_set = [
		"Faire frire",
		"Mettre au four à 220 °C",
		"Mélanger les ingredients",
		"Saler et poivrer",
		"Faire revenir les oignons",
		"Battre le blanc en neige",
		"Ajouter du dentifrice",
		"Mettre au réfrigérateur pendant 30 minutes",
		"Eplucher les carottes"
	];

	let comments = [
		"J'aime beaucoup, merci pour cette recette.",
		"Je conseille de laisser au frigo plutôt 45 minutes",
		"Bof, j'ai été déçu",
		"Excellent !😍😍 ",
		"👌"
	];

	let tag_list = ["dessert","vegan","gras","petit dejeuné","plat principal","viande","sucré","vanile","chocolat"];

	let descriptions = [
		"Des frites croutillantes pour vos soirées entre amis.",
		"Une glace à la vanille, idéal à déguster en été !",
		"Une description provocante et pertinente qui innove"
	];

	// generate some fake recipes:
	for(let i = 0;i < recipe_names.length;i++){
		for(let j = 0;j < adj_for_recipes.length;j++){
			let name = recipe_names[i] + " " + adj_for_recipes[j];
			let desc = seeded_pick(descriptions);
			let tags = [adj_for_recipes[j],recipe_names[i],seeded_pick(tag_list),seeded_pick(tag_list)];
			let ingredients = [recipe_names[i],seeded_pick(recipe_names).toLowerCase(),seeded_pick(recipe_names).toLowerCase()];
			let steps = [];
			let step_count = 1 + seeded_random() % 10;
			for(let k = 0;k < step_count;k++){
				steps.push(seeded_pick(steps_set));
			}

			// pick a random user. this is annoying to do ...
			r.table('users').sample(1).run(async (err,one_user) => {
				if(err){
					console.log(err);
					return;
				}
				let result = await rw.create_recipe(one_user[0].id,name,desc,tags,ingredients,steps,r);

				if(result.err == null){
					let recipe_id = result.result.generated_keys[0];
					console.log("Added recipe for "+name+" by "+one_user[0].name+" ("+one_user[0].id+") with id="+recipe_id);

					let comment_count = seeded_random() % 20;

					if(comment_count > 0){
						r.table('users').sample(comment_count).run(async (err,picked_users) => {
							if(err){
								console.log(err);
								return;
							}
							if(!(picked_users instanceof Array)) return;
							console.log("Generating "+picked_users.length+" comments for "+name);
							for(let k = 0;k < picked_users.length;k++){
								let result = await rw.create_comment(picked_users[k].id,recipe_id,seeded_pick(comments),r);
							}
						});
					}
				}

			});

		}
	}

	// More tables will be required based on the features we'll need.

	console.log("Database overwritten. Fake data added.");
}