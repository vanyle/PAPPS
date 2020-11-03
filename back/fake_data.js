// This file contains some fake data to populate the database.
// It is also used as documentation for what the database looks like.

"use strict";

let rw = require('./db_interface.js');
let fs = require('fs');
let path = require('path');

// used to get deterministic fake data: Linear congruential generator
// the randomness is poor but it's enough for the current application.
const x0 = 123;
const M = 256 * 256 * 256;
const A = 5 + 8 * 52; // a mod 8 = 5 for good quality randomness
const C = 1; // gcd(c,m) = 1
let rndInnerState = x0;
function seeded_random(){
	rndInnerState *= A;
	rndInnerState += C;
	rndInnerState %= M;
	return rndInnerState;
}
function seeded_pick(arr){
	return arr[Math.floor(seeded_random() % arr.length)];
}


// Warning, this function override the content of the database !
module.exports.populate_db = async (r) => {

	// -----------------------------------------------
	// Image related.

	await rw.deleteTable("images",r); // ignore errors if the table does not exist, this is a setup function
	await rw.createTable("images",r);

	let image_count = 0;

	// load images from doc with format doc/img*.jpg

	let image_paths = fs.readdirSync('doc');
	for(let i = 0;i < image_paths.length;i++){
		if(image_paths[i].endsWith('jpg') && image_paths[i].startsWith('img')){
			let full_path = path.join("./doc",image_paths[i]);
			let img_data = fs.readFileSync(full_path);
			// here, data is binary
			try{
				let res = await r.table('images').insert({data:img_data});
				image_count++;
			}catch(err){
				console.log(err.message);
			}
		}
	}
	console.log("Generated "+image_count + " images");

	// ----------------------------------------------------------
	// user related
	await rw.deleteTable("users",r); // clear user table.
	await rw.createTable("users",r);

	let names = ["Auguste","René","Charles","Manon","Iza","Bob","XxWarrior76xX","Quentin","Gabrielle","tom","ines","Emma"];
	let mail_extensions = ["@orange.fr","@gmail.com","@student-cs.fr","@protomail.com","@xyz.fr"];
	let right_sets = [[],["delete_recipe","make_recipe"],["delete_recipe","make_recipe","delete_comment"],["make_recipe"]];

	let passwords = ["azerty","qwerty","0987654321","bluck","iloveu","onmappellelovni","696969","pistache"];

	for(let i = 0;i < names.length;i++){
		let name = names[i];
		let email = name.toLowerCase() + seeded_pick(mail_extensions);
		let pass = seeded_pick(passwords);
		let rights = seeded_pick(right_sets);

		rw.create_user(name,rights,pass,email,r);
		console.log("Added user: "+name+" with pass: "+pass+ " and rights: "+rights);
	}

	console.log("Generated "+names.length+" users");

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

	let recipe_count = 0;
	let comment_count = 0;

	// generate some fake recipes:
	for(let i = 0;i < recipe_names.length;i++){
		for(let j = 0;j < adj_for_recipes.length;j++){
			let name = recipe_names[i] + " " + adj_for_recipes[j];
			let desc = seeded_pick(descriptions);
			let ingredients = [recipe_names[i],seeded_pick(recipe_names),seeded_pick(recipe_names)];
			let tags = [recipe_names[i].toLowerCase(),seeded_pick(tag_list).toLowerCase(),seeded_pick(tag_list).toLowerCase()];
			let steps = [];
			let step_count = 1 + seeded_random() % 11;

			for(let k = 0;k < step_count;k++){
				steps.push(seeded_pick(steps_set));
			}

			// pick a random user that is allowed to create recipes
			r.table('users').filter(r.row('rights').contains('make_recipe')).sample(1).run(async (err,one_user) => {
				if(err){
					console.log(err);
					return;
				}

				let image_id = (await r.table('images').sample(1).run())[0].id;

				let result = await rw.create_recipe(one_user[0].id,name,desc,tags,ingredients,steps,image_id,r);

				if(result.error == null){
					let recipe_id = result.result.id;
					let comment_number = seeded_random() % 19;

					recipe_count ++;

					if(comment_number > 0){
						r.table('users').sample(comment_number).run(async (err,picked_users) => {
							if(err){
								console.log(err);
								return;
							}
							if(!(picked_users instanceof Array)) return;

							for(let k = 0;k < picked_users.length;k++){
								comment_count ++;
								rw.create_comment(picked_users[k].id,recipe_id,seeded_pick(comments),r);
							}
						});
					}

					// add ratings!
					// small number of rating (7) to avoid central limit theorem and have 0 or 5 star rating in test dataset.
					let rating_number = seeded_random() % 7;
					if(rating_number > 0){
						r.table('users').sample(rating_number).run(async (err,picked_users) => {
							if(err){
								console.log(err);
								return;
							}
							if(!(picked_users instanceof Array)) return;

							for(let k = 0;k < picked_users.length;k++){
								let nbr = 6;
								while(nbr > 5){
									nbr = seeded_random() % 7;
								}

								rw.rate_recipe(picked_users[k].id,recipe_id,nbr,r);
							}
						});
					}

				}else{
					console.log("Error while generating recipe: "+result.error);
				}

			});

		}
	}


	// using setTimeout because there is not need for these to be very reliable.
	setTimeout(() => {
		console.log("Generated "+recipe_count+" recipes");
		console.log("Generated "+comment_count+" comments");
		console.log("Database overwritten. Fake data added.");
	},3000);
}