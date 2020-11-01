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