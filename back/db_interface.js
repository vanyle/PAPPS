// Provide various methods to interface with the database
// Some low, and some high level.
// Also, crypto stuff.
"use strict";

const shajs = require('sha.js');
const crypto = require('crypto');

function sha256(msg){
	return shajs('sha256').update(msg).digest('hex');
}


// Return a UUID compliant with RFC 4122.
function uuid(){
	function rnd(){ // return a random integer between 0 and 15
		return crypto.randomBytes(1)[0] & 0xF;
	}

	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		let r = rnd(), v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

// Low level functions

const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyzáàâäãåæçéèêëìíîïðñòóôõöøùúûüýÿāăąęćĉċčłşśźżµß';

function is_made_up_of_arr(str,arr){
	for(let i = 0;i < str.length;i++){
		if(arr.indexOf(str[i]) == -1) return false;
	}
	return true;
}
function is_using_valid_tag_charset(str){
	const LOWERCASE_AND_SPACE = " " + LOWERCASE_CHARS;
	return is_made_up_of_arr(str,LOWERCASE_AND_SPACE);
}
function is_using_valid_ingredient_charset(str){
	const LOWERCASE_UPPERCASE_AND_SPACE = " " + LOWERCASE_CHARS + "0123456789" + "€$£¥" + LOWERCASE_CHARS.toUpperCase();
	return is_made_up_of_arr(str,LOWERCASE_UPPERCASE_AND_SPACE);
}


module.exports.hash = (msg,salt) => {
	const ROUNDS = 30;
	let result = msg + salt;
	for(let i = 0;i < ROUNDS;i++){
		result = sha256(result + msg + salt);
	}
	return result;
};

module.exports.make_salt = () => {
	const buf = crypto.randomBytes(32); // 32 * 8 = 256. Pass is as long as hash
	return buf.toString('hex');
};

module.exports.createTable = async (tableName,r) => {
	return new Promise((resolve) => {
		r.tableCreate(tableName).run(function(err, result) {
	    	resolve({err:err,result:result});
		});
	});
}
module.exports.deleteTable = async (tableName,r) => {
	return new Promise((resolve) => {
		r.tableDrop(tableName).run(function(err, result) {
	    	resolve({err:err,result:result});
		});
	});
};
module.exports.listTable = async (r) => {
	return new Promise((resolve) => {
		r.tableList().run((err,result) => {
			resolve({err:err,result:result});
		});
	});
};

// If data is an array, all elements of data are inserted.
// If data is an object, data is inserted.
module.exports.insert = async (data,tableName,r) => {
	return new Promise((resolve) => {
		r.table(tableName).insert(data).run(function(err, result) {
	    	if(err != null){
		    	resolve({error:"unable to write data to db, please retry",result:null});
		    	return;
			}
			resolve({error:null,result:result});
		});
	});
};
module.exports.get = async (query,tableName,r) => {
	return new Promise((resolve) => {
		r.table(tableName).run(function(err, result) {
		    if(err != null){
		    	resolve({error:"unable to retreive data from db, please retry",result:null});
		    	return;
			}
			resolve({error:null,result:result});
		});
	});
};


// High level functions
// rights is an array containing the list of rights of the user.
module.exports.create_user = (name,rights,clear_password,email,r) => {
	let user = {
		creation_time: new Date(),
		email: email,
		rights: rights,
		name: name,
		salt: module.exports.make_salt(),
		shopping_lists:[],
		calendar:[]
	};
	user.pass = module.exports.hash(clear_password,user.salt);
	return module.exports.insert(user,"users",r);
}

module.exports.create_image = async (data,r) => {
	return new Promise(async (resolve) => {
		if(typeof data !== "string"){
			resolve({error:"no image provided!"});
			return;
		}
		if(data.length >= 1024 * 1024){ // 1 Mo
			resolve({error:"image is too big"});
			return;
		}
		let allowedMimeTypes = ["jpeg","jpg","gif","png"];
		let headerLength = -1;
		for(let i = 0;i < allowedMimeTypes.length;i++){
			if(data.startsWith('data:image/'+allowedMimeTypes[i]+';base64,')){
				headerLength = ('data:image/'+allowedMimeTypes[i]+';base64,').length;
				break;
			}
		}

		if(headerLength == -1){
			resolve({error:"file is not a valid URI-base64 encoded image"});
		}

		console.log(data);
		console.log(headerLength);

		console.log("Snippets from base64 url:");
		console.log("a:"+data.substring(0,headerLength + 10)+" ()");
		console.log("b:"+data.substring(0,headerLength)+" ()");
		console.log("c:"+data.substring(headerLength,headerLength+10)+" ()");

		let buffer = Buffer.from(data.substring(headerLength,data.length), 'base64');

		// convert base64 to raw bytes.
		let res = await r.table('images').insert({data:buffer});
		if(res == null){
			resolve({error:"unable to write data to db, please retry"});
		}else{
			resolve({error:null,result:{id:res.generated_keys[0]}})
		}
	});
}

module.exports.create_recipe = async (user_id,title,description,tags,ingredients,steps,image_id,r) => {
	return new Promise((resolve) => {
		r.table("users").get(user_id).run((err,result) => {
			if(result === null){
				resolve({error:"no user with the given id exists"});
				return;
			}
			if(result.rights.indexOf('make_recipe') === -1){
				resolve({error:"user is not allowed to create recipes"});	
				return;
			}
			if(typeof title !== "string" || title.length >= 100){
				resolve({error:"bad title"});
				return;
			}
			if(typeof description !== "string" || description.length >= 600){
				resolve({error:"bad description"});
				return;
			}
			let tagValid = (tags instanceof Array) && tags.length <= 6;
			if(tagValid){
				for(let i = 0;i < tags.length;i++){
					tagValid = tagValid && typeof tags[i] === 'string' && tags[i].length <= 50 && is_using_valid_tag_charset(tags[i]);
					if(!tagValid) break;
				}
			}
			if(!tagValid){
				resolve({error:"bad tags"});
				return;
			}

			let ingredientValid = (ingredients instanceof Array) && ingredients.length <= 100 && ingredients.length >= 1;
			if(ingredientValid){
				for(let i = 0;i < ingredients.length;i++){
					ingredientValid = ingredientValid && typeof ingredients[i] === 'string' && ingredients[i].length <= 200 && is_using_valid_ingredient_charset(ingredients[i]);
					if(!ingredientValid) break;
				}
			}
			if(!ingredientValid){
				resolve({error:"bad ingredients"});
				return;
			}

			let stepsValid = (steps instanceof Array) && steps.length <= 100 && steps.length >= 1;
			if(stepsValid){
				for(let i = 0;i < steps.length;i++){
					stepsValid = stepsValid && typeof steps[i] === 'string' && steps[i].length <= 1000;
					if(!stepsValid) break;
				}
			}
			if(!stepsValid){
				resolve({error:"bad steps"});
				return;
			}

			let is_image = r.table("images").get(image_id).run();
			if(is_image === null){
				resolve({error:"no image with the given id exists"})
				return;
			}

			// everything is valid here.
			const recipe_to_insert = {
				creator_id:user_id,
				creation_time:new Date(), // new Date() creates a date representing the current time
				title:title,
				description:description,
				tags:tags,
				ingredients:ingredients,
				rating:[], // rating: {user_id:id,note:0 - 5}
				steps:steps,
				image_id:image_id,
				comments:[]
			};
			r.table("recipes").insert(recipe_to_insert).run(function(err, result) {
				if(err != null){
					resolve({error:"unable to retreive db results, please retry",result:null});
				}else{
		    		resolve({error:null,result:{id:result.generated_keys[0]}});
				}
			});
		});
	});
};

module.exports.delete_recipe = (user_id,recipe_id,r) => {
	return new Promise((resolve) => {
		r.table("users").get(user_id).run((err,user) => {
			if(user === null){
				resolve({error:"no user with the given id exists"});
				return;
			}
			r.table("recipes").get(recipe_id).run((err,recipe) => {
				if(recipe === null){
					resolve({error:"no recipe with the given id exists"});
					return;
				}
				let isAllowed = recipe.creator_id === user_id || (user.rights.indexOf('delete_recipe') !== -1);

				if(!isAllowed){
					resolve({error:"user is not allowed to delete this recipe"});
					return;
				}

				// TODO: delete images associated with recipe ?

				r.table("recipes").get(recipe_id).delete().run((err,result) => {
					if(err !== null){
						resolve({error:"unable to delete data from db, please retry."});
					}else{
						resolve({error:null,result:{'msg':'OK'}});
					}
				});
			});
		});
	});
}

module.exports.rate_recipe = (user_id,recipe_id,new_rating,r) => {
	return new Promise((resolve) => {
		r.table("users").get(user_id).run((err,user) => {
			if(user === null){
				resolve({error:"no user with the given id exists"});
				return;
			}
			r.table("recipes").get(recipe_id).run((err,recipe) => {
				if(recipe === null){
					resolve({error:"no recipe with the given id exists"});
					return;
				}
				
				new_rating = new_rating - 0; // to int conversion if possible (NaN if type is incorrect)

				if(!(typeof new_rating === "number" && new_rating >= 0 && new_rating <= 5)){
					resolve({error:"bad rating"});
					return;
				}

				const new_rating_obj = {
					note: new_rating,
					user_id: user_id
				}

				// if user has already rated the recipe, update his rating, else add a new rating;
				r.branch(
					r.table("recipes").get(recipe_id)('rating').filter({user_id:user_id}).count().gt(0), // if already rated.
					r.table("recipes").get(recipe_id).update({rating: r.row("rating").changeAt(
						// get index of rating.
						r.row("rating").offsetsOf((rating_element) => {return rating_element.user_id = user_id}).nth(0)
						,new_rating_obj)  }), // do this
					r.table("recipes").get(recipe_id).update({rating: r.row("rating").append(new_rating_obj)}) // else do this
				).run((err,res) => {
					if(err !== null){
						console.log(err.message);
						resolve({error:"something weng wrong, please retry"});
						return;
					}
					resolve({result:{msg:"OK"},error:null});
				});
				
			});
		});
	});
}

module.exports.create_comment = (user_id,recipe_id,comment_content,r) => {
	return new Promise((resolve) => {
		if(typeof user_id !== "string" || typeof recipe_id !== "string"){
			resolve({error:"bad get arguments",result:null});
			return;
		}
		if(typeof comment_content !== "string" || comment_content.length > 1000){
			resolve({error:"bad comment content",result:null});
			return;
		}
		r.table("recipes").get(recipe_id).run((err,recipe_data) => {
			if(err != null){
				console.log(err.message);
		    	resolve({error:"unable to retreive db results, please retry",result:null});
		    	return;
			}

			if(recipe_data === null){
				resolve({error:"no recipe with the given id exists"});
				return;
			}
			r.table("users").get(user_id).run((err,user_data) => {
				if(err != null){
					console.log(err.message);
			    	resolve({error:"unable to retreive db results, please retry",result:null});
			    	return;
				}
				if(user_data === null){
					resolve({error:"no user with the given id exists"});
					return;
				}

				const new_comment = {
					id: uuid(),
					name: user_data.name,
					user_id: user_data.id,
					content: comment_content,
					creation_time:new Date()
				};


				r.table("recipes").get(recipe_id).update({comments: r.row("comments").append(new_comment)}).run((err,res) => {
					if(err != null){
						console.log(err.message);
				    	resolve({error:"unable to update db, please retry",result:null});
				    	return;
					}
					resolve({error:null,result:{id:new_comment.id}});
				})
			});
		});
	});
};

module.exports.delete_comment = (user_id,recipe_id,comment_id,r) => {
	return new Promise((resolve) => {
		r.table("users").get(user_id).run((err,user) => {
			if(user === null){
				resolve({error:"no user with the given id exists"});
				return;
			}
			r.table("recipes").get(recipe_id).run((err,recipe) => {
				if(recipe === null){
					resolve({error:"no recipe with the given id exists"});
					return;
				}
				let comment = null;
				// retreive the comment.
				for(let i = 0;i < recipe.comments.length;i++){
					if(recipe.comments[i].id === comment_id){
						comment = recipe.comments[i];
						break;
					}
				}
				if(comment === null){
					resolve({error:"no comment with the given id exists"});
					return;
				}

				let isAllowed = (comment.user_id === user_id) || (user.rights.indexOf('delete_comment') !== -1);

				if(!isAllowed){
					resolve({error:"user is not allowed to delete this comment"});
					return;
				}

				// attempt to delete the comment if it still exist. (remember that all of this is async)
				r.table("recipes").get(recipe_id).update({
					comments: r.row("comments").filter((comment_element) => {
						return comment_element("id").ne(comment_id);
					})
				}).run((err,result) => {
					if(err !== null){
						console.log(err.message);
						resolve({error:"unable to delete comment from db, please retry."});
					}else{
						resolve({error:null,result:{'msg':'OK'}});
					}
				});
			});
		});
	});
}

module.exports.retreive_recipes = (tags,search,r) => {
	return new Promise((resolve) => {
		let query = r.table("recipes");

		// search by tags
		if(tags instanceof Array && tags.length >= 1 && tags.length <= 6){
			for(let i = 0;i < tags.length;i++){
				if(typeof tags[i] !== "string" || tags[i].length == 0 || tags[i].length > 50){
					resolve({err:"bad tag",result:null});
					return;
				}
			}
			query = query.filter((recipe) => {
				return recipe('tags').contains((tag) => {
					return r.expr(tags).contains(tag)
				});
			});
		}

		// search by query (s field in request)
		if(typeof search === "string" && search.length >= 1){
			if(search.length > 100){
				resolve({err:"query too long",result:null});
				return;
			}
			search = search.toLowerCase(); // lowercase match.
			query = query.filter((doc) => {
				return doc('title').downcase().match(search).or(doc('description').match(search));
			});
		}
		query = query.withFields('id','title','description','rating','tags','image_id');
		query = query.limit(100);

		query = query.orderBy(r.desc(function(recipe){
			return recipe('rating').avg('note').default(2.5) // - sign for desc
		}));

		// compute ratings
		query = query.merge(function(rec){return {rating:rec('rating').avg('note').default(2.5)}})


		query.run((err, result) => {
		    if(err != null){
		    	resolve({error:"unable to retreive db results, please retry",result:null});
		    	return;
			}
			resolve({error:null,result:result});
		});
	});
}
module.exports.retreive_recipe_by_id = (id,r) => {
	return new Promise((resolve) => {
		let query = r.table("recipes");
		query = query.get(id).merge(function(rec){return {rating:rec('rating').avg('note').default(2.5)}});

		query.run((err,result) => {
			if(err != null){
				console.log(err.message);
		    	resolve({error:"unable to retreive db results, please retry",result:null});
		    	return;
			}
			if(result === null){
				resolve({error:"no recipe with the given id exists"});
				return;
			}
			let toreturn = {}; // field filter. This is performed on a single object, so it's not costly.
			toreturn.id = result.id;
			toreturn.image_id = result.image_id;
			toreturn.title = result.title;
			toreturn.description = result.description;
			toreturn.rating = result.rating;
			toreturn.tags = result.tags;
			toreturn.ingredients = result.ingredients;
			toreturn.steps = result.steps;
			toreturn.creator_id = result.creator_id;
			toreturn.comments = result.comments;
			toreturn.creation_time = result.creation_time;

			resolve({error:null,result:toreturn});
		});
	});
}
module.exports.retreive_user_by_id = (id,r) => {
	return new Promise((resolve) => {
		let query = r.table("users");
		query = query.get(id);

		query.run((err,result) => {
			if(err != null){
				console.log(err.message);
		    	resolve({error:"unable to retreive db results, please retry",result:null});
		    	return;
			}
			if(result === null){
				resolve({error:"no user with the given id exists"});
				return;
			}
			let toreturn = {}; // field filter. This is performed on a single object, so it's not costly.
			toreturn.id = result.id;
			toreturn.rights = result.rights;
			toreturn.name = result.name;
			toreturn.shopping_lists = result.shopping_lists;
			toreturn.calendar = result.calendar;
			resolve({error:null,result:toreturn});
		});
	});
}
module.exports.check_login = (username,password,r) => {
	return new Promise((resolve) => {
		if(typeof username !== "string" || username.length < 1){
			resolve(false);
			return;
		}
		if(typeof password !== "string" || password.length < 1){
			resolve(false);
			return;
		}

		let query = r.table("users");
		query = query.filter((user) => {
			return user('name').eq(username);
		});

		query.run((err,result) => {
			if(err != null){
				console.log(err.message);
		    	resolve(false);
		    	return;
			}
			if(result.length !== 1){
				resolve(false);
				return;
			}
			let pass1 = result[0].pass;
			let pass2 = module.exports.hash(password,result[0].salt);

			if(pass1 === pass2){
				resolve(result[0]);
			}else{
				resolve(false);
			}
		});
	});
}
