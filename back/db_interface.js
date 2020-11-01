// Provide various methods to interface with the database
// Some low, and some high level.
// Also, crypto stuff.
"use strict";

const shajs = require('sha.js');
const crypto = require('crypto');

function sha256(msg){
	return shajs('sha256').update(msg).digest('hex');
}

// Low level functions

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
	    	resolve({err:err,result:result});
		});
	});
};
module.exports.get = async (query,tableName,r) => {
	return new Promise((resolve) => {
		r.table(tableName).run(function(err, result) {
		    if(err != null){
		    	resolve({error:err,result:null});
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
		email: email,
		rights: rights,
		name: name,
		salt: module.exports.make_salt(),
		shopping_lists:[]
	};
	user.pass = module.exports.hash(clear_password,user.salt);
	return rw.insert(user,"users",r);
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
			query = query.filter((doc) => {
				return doc('title').match(search).or(doc('description').match(search));
			});
		}
		query = query.orderBy(r.desc('rating'));
		query = query.limit(100);

		query = query.withFields('id','title','description','rating','tags');

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
		query = query.get(id);

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
			toreturn.title = result.title;
			toreturn.description = result.description;
			toreturn.rating = result.rating;
			toreturn.tags = result.tags;
			toreturn.ingredients = result.ingredients;
			toreturn.steps = result.steps;
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