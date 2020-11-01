// This file contains some fake data to populate the database.
// It is also used as documentation for what the database looks like.

"use strict";

let rw = require('./db_interface.js');
let shajs = require('sha.js');



// Warning, this function override the content of the database !
module.exports.populate_db = async (r) => {

	// ----------------------------------------------------------
	// user related
	await rw.deleteTable("users",r); // clear user table.
	await rw.createTable("users",r);

	rw.create_user("Augustus René Le Comte du Château",["delete_recipe","new_recipe","delete_comment"],"chaton","augustus.chateau@orange.fr");
	rw.create_user("Hervé Des Champs Des Bois",["delete_recipe","new_recipe"],"azerty","herve.champs@protonmail.com");
	rw.create_user("bob",[],"qwerty","bob.bob@gmail.com");

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

	// More tables will be required based on the features we'll need.

	console.log("Database overwritten. Fake data added.");
}