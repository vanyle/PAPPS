// This file contains some fake data to populate the database.
// It is also used as documentation for what the database looks like.

"use strict";

let rw = require('./db_interface.js');
let shajs = require('sha.js');



// Warning, this function override the content of the database !
module.exports.populate_db = async (r) => {

	// --------------------------------------------------
	// recipes related
	await rw.deleteTable("recipes",r); // ignore errors if the table does not exist, this is a setup function
	await rw.createTable("recipes",r);


	const recipe1 = {
		creator_id:1,
		creation_time:new Date(), // new Date() creates a date representing the current time
		title:"Frites",
		description:"Des frites croutillantes pour vos soirées entre amis.",
		tags:["Vegan","Gras","Patate"],
		ingredients:["Pommes de terre","Huile de colza","Sel"],
		rating:5,
		steps:["Faire frire les <b>patates</b>","c'est prêt :)"],
		comments:[
			{
				userid:"e33cd1f5-21d7-4655-a8dd-1199ffd6cdcb", // userid
				content:"J'aime beaucoup, merci pour cette recette."
			}
		]
	};

	await rw.insert(recipe1,"recipes",r);

	const recipe2 = {
		creator_id:0,
		creation_time:new Date(), // new Date() creates a date representing the current time
		title:"Glace à la vanille",
		tags:["Dessert","vanille","sucré"],
		description:"Une glace à la vanille, idéal à déguster en été !",
		ingredients:["Crème fraiche","Sucre roux","Extrait de vanile"],
		rating:4,
		steps:["Tout mélanger","Mettre au réfrigérateur pendant 30 minutes"],
		comments:[
			{
				userid:"a7032d0e-ff6a-4142-9622-bad619866af9", // userid
				content:"Je conseille de laisse au frigo plutôt 45 minutes"
			}
		]
	};

	await rw.insert(recipe2,"recipes",r);


	// ----------------------------------------------------------
	// user related
	await rw.deleteTable("users",r);
	await rw.createTable("users",r);

	let user1 = {
		rights: ["admin","view"],
		name:"Augustus René Le Comte du Château",
		salt: rw.make_salt(), // make_salt connects to League servers to retreive the freshest salt available.
		shopping_lists:[
			{
				name:"Banquet de Pâques",
				content:[
					"Saumon",
					"Pain",
					"Tomates"
				]
			},
			{
				name:"Repas de dimanche",
				content:[
					"Huile d'olive",
					"Mozzarella"
				]
			}
		]
	};
	user1.pass = rw.hash("chaton",user1.salt); // assumption: the users have no idea what they are doing when choosing their passwords.

	await rw.insert(user1,"users",r);

	let user2 = {
		rights:["view"],
		name:"Hervé Des Champs Des Bois",
		salt: rw.make_salt(),
		shopping_lists:[
			{
				name:"Principale",
				content:[
					"Chocolat Noir",
					"Crème fraîche"
				]
			}
		]
	};

	user2.pass = rw.hash("azerty",user2.salt);

	await rw.insert(user2,"users",r);

	let user3 = {
		rights:["view"],
		name:"bob",
		salt: rw.make_salt(),
		shopping_lists:[
			{
				name:"Courses",
				content:[
					"Meth",
					"Beuh"
				]
			}
		]
	};

	user3.pass = rw.hash("qwerty",user3.salt);

	await rw.insert(user3,"users",r);

	// More tables will be required based on the features we'll need.

	console.log("Database overwritten. Fake data added.");
}