"use strict";
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
let rethinkdb = require('rethinkdbdash');
const rw = require('./db_interface.js');

let db_host = null; // config load is needed to init these
let db_port = null;
let config = {};
let db_process = null;
let db_client = null;
let client_started = false;

let json_logs = false; // mongod uses JSON logs with version >= 4.4

const DB_NAME = "PAPS";

const RED_COLOR_CODE = "\u001b[31m";
const YELLOW_COLOR_CODE = "\u001b[33m";
const GREEN_COLOR_CODE = "\u001b[32m";
const RESET_COLOR_CODE = "\u001b[0m";

function manage_shutdown(){
	console.log("Shutting down database.");
	// The server is about to be shutdown, cleanly shutdown the database also to prevent data corruption
	// Nothing do to :) (the process is a child and gets a clean error code.)
}

function process_logs_from_database(data){
	console.log("[RethingDB]",data);
}
function process_errors_from_client(msg){
	//console.log(RED_COLOR_CODE+"Unable to connect to database. Something weird is going on. Read the database logs for more informations."+RESET_COLOR_CODE);
	console.log(msg);
	//process.kill(process.pid, "SIGINT"); // clean shutdown of the db
}

function start_db_client(callback){
	client_started = true;
	// connect to db.
	rethinkdb = rethinkdb({
		host: db_host, // connect to one host and discover the others
		port: db_port,
		pool: true,
		discovery: true,
		silent:true,
		log: process_errors_from_client
	});
	console.log(GREEN_COLOR_CODE+"Connected successfully to the database at "+db_host+":"+db_port+RESET_COLOR_CODE);

	if(config.put_fake_data){
		console.log(YELLOW_COLOR_CODE+"Overwriting database with fake data, because put_fake_data=true in config.json"+RESET_COLOR_CODE)
		console.log(YELLOW_COLOR_CODE+"Stop the process if this was an error, you have 5 seconds to do so (use Ctrl-C)"+RESET_COLOR_CODE);
		setTimeout( () => {
			require('./fake_data.js').populate_db(rethinkdb);
		},3 * 1000);
	}
	callback(rethinkdb);
}

async function processStdinCommand(cmd){
	cmd = cmd.trim();
	if(cmd === 'list_users'){
		let users = await rethinkdb.table('users').run();
		let sessions = await rethinkdb.table('session').run();

		if(users.length == 0){
			console.log("No users in db.");
			return;
		}

		console.log("Users:")
		for(let i in users){
			let isco = false;
			let toPrint = "	"+users[i].name+" "+users[i].id+" "+users[i].rights.join(',')+" ";
			for(let j = 0;j < sessions.length;j++){
				if(sessions[j].session.user_id === users[i].id && sessions[j].session.co){
					toPrint += GREEN_COLOR_CODE + "CONNECTED" + RESET_COLOR_CODE
					isco = true;
					break;
				}
			}
			if(!isco){
				toPrint += RED_COLOR_CODE + "NOT CONNECTED" + RESET_COLOR_CODE;
			}
			console.log(toPrint);
		}
	}else if(cmd.startsWith('new_user ')){
		cmd = cmd.split(' ');
		let username = cmd[1];
		let password = cmd[2];
		let rights = ['make_recipe'];
		if(cmd.length >= 4){
			rights = cmd[3].split(',');
		}
		let email = "a.a@a.com";

		console.log("Creating user: "+username+" with password: "+password+" and rights: "+rights.join('|'));
		let result = await rw.create_user(username,rights,password,email,rethinkdb);
		if(result.error){
			console.log(result.error);
		}else{
			console.log("Created user with id: "+result.result.generated_keys[0]);
		}
	}else{
		console.log("Command: "+cmd+" not recognized. See README.md for the list of commands");
	}
}

function setupStdin(){
	process.stdin.resume();
	process.stdin.setEncoding('utf8');

	let databuffer = "";
	process.stdin.on('data', function(data) {
		data = data + "";

		// add data to buffer until a line break is found.
		for(let i = 0;i < data.length;i++){
			if(data[i] == '\n'){
				// process the logs and flush the buffer
				processStdinCommand(databuffer);
				databuffer = "";
			}else{
				databuffer += data[i];
			}
		}
	});
}

module.exports.setup = (c,callback) => {
	config = c;
	config.db_program = config.db_program || "rethinkdb"; // set default value
	config.db_host = config.db_host || "localhost";
	config.db_port = config.db_port || 27017;
	config.db_path = config.db_path || "./db/";
	config.db_more_arguments = config.db_more_arguments || [];
	db_host = config.db_host;
	db_port = config.db_port;

	// create database folder for first time initialization:
	if(config.db_path === "./db/" && !fs.existsSync(config.db_path)){
		fs.mkdirSync(config.db_path);
		console.log("Created directory "+config.db_path+" for database.");
	}

	console.log("Starting database ...");

	cp.exec(config.db_program+" --version",{cwd:"./back/"}, (err,stdout,stderr) => {
		if(err){
			console.log(RED_COLOR_CODE+"Unable to start database:"+RESET_COLOR_CODE);
			console.log(err.message);
			console.log("Is it installed ? You can install mongodb using the tutorial provided in README.md");
			console.log("If the database is installed, \"mongod --version\" should print the version installed.")
			process.exit(1);
		}

		let version = stdout.split("\n",2)[0].split("-",2)[0].split(" ")[1];

		console.log("Your rethinkdb version is:",version);

		// database seems to be properly installed.

		let command_line_options = [
			"-d", path.join("..",config.db_path),
			"--bind",config.db_host,
			"--driver-port",config.db_port,
			"--cluster-port",config.db_port+1,
			"--http-port",config.db_port+2];

		command_line_options = command_line_options.concat(config.db_more_arguments);

		console.log("Running: "+config.db_program+" "+command_line_options.join(" "));

		db_process = cp.spawn(config.db_program,command_line_options,{cwd:"./back/"});
		
		let databuffer = "";
		db_process.stdout.on('data', (data) => {
			// convert data from buffer to string:
			data = data + "";

			// add data to buffer until a line break is found.
			for(let i = 0;i < data.length;i++){
				if(data[i] == '\n'){
					// process the logs and flush the buffer
					process_logs_from_database(databuffer);
					if(databuffer.indexOf("Listening on driver address") !== -1 && !client_started){
						start_db_client(callback);
					}
					databuffer = "";
				}else{
					databuffer += data[i];
				}
			}
		});
		let errdatabuffer = "";
		db_process.stderr.on('data', (data) => {
			// convert data from buffer to string:
			data = data + "";

			// add data to buffer until a line break is found.
			for(let i = 0;i < data.length;i++){
				if(data[i] == '\n'){
					// process the logs and flush the buffer
					console.log(errdatabuffer);
					errdatabuffer = "";
				}else{
					errdatabuffer += data[i];
				}
			}
		});
		db_process.on('close', (code) => {
			console.log(`Database process exited with code ${code}`);
			process.exit(0);
		});

		process.on('SIGHUP',manage_shutdown); // called when terminal is closed
		process.on('SIGINT',manage_shutdown); // called when Ctrl-C
		process.on('SIGTERM',manage_shutdown);

		console.log(GREEN_COLOR_CODE+"Database started."+RESET_COLOR_CODE);

		setupStdin();
	});

};


function send_error(res,msg){
	res.send({'error':msg});
}
function send_response(res,result){
	if(result.error !== null){
		send_error(res,result.error);
	}else{
		res.send(result.result);
	}
}

// -------------------------------------------------------
// Endpoint definitions here.

module.exports.handle_query = async (req,res) => {
	if(!client_started){
		send_error(res,"database not ready. Please wait a bit.");
		return;
	}

	if(req.query.type === "recipes"){
		let tags = req.query.tags || "";
		if(tags === ""){
			tags = [];
		}else{
			tags = tags.split("|")
		}
		let search = req.query.s;

		let result = await rw.retreive_recipes(tags,search,rethinkdb);
		send_response(res,result);
	// -----------------------------------------------
	}else if(req.query.type === "image"){
		let id = req.query.id;
		if(typeof id !== "string" || id.length < 1){
			send_error(res,"id not provided");
			return;
		}
		let result = await rethinkdb.table("images").get(id);
		if(result === null){
			send_error(res,"no image with the given id exists")
		}else{
			res.setHeader('Content-Type', 'image/jpg');
			res.send(result.data);
		}
	}else if(req.query.type === "recipe"){
		let id = req.query.id;
		if(typeof id !== "string" || id.length < 1){
			send_error(res,"id not provided");
			return;
		}
		let result = await rw.retreive_recipe_by_id(id,rethinkdb);
		send_response(res,result);
	// -----------------------------------------------
	}else if(req.query.type === "unlog"){
		req.session.destroy(() => {
			res.send({msg:"session destroyed."});
		});
	}else if(req.query.type === "log"){
		let username = req.query.name;
		let password = req.query.pass;

		let login_result = await rw.check_login(username,password,rethinkdb);
		if(login_result !== false){
			
			req.session.co = true;
			req.session.username = username;
			// maybe also store user_id and stuff like that
			req.session.permissions = login_result.rights;
			req.session.user_id = login_result.id;

			res.send({co:'OK'});
		}else{
			res.send({co:'NOOK'});
		}
	}else if(req.query.type === "uinfo"){
		if(req.session.co){
			let result = await rw.retreive_user_by_id(req.session.user_id,rethinkdb);
			if(result.error){
				send_error(res,result.error);
			}else{
				res.send(result.result);
			}
		}else{
			send_error(res,"you need to be logged in to perform this request");
		}
	}else if(req.query.type === "uname"){
		let id = req.query.id;
		if(typeof id !== "string" || id.length < 1){
			send_error(res,"id not provided")
			return;
		}
		let result = await rw.retreive_user_by_id(id,rethinkdb);
		send_response(res,result);
	}else{
		send_error(res,"type option not recognized");
	}
}
module.exports.handle_post_query = async (req,res) => {
	if(!client_started){
		send_error(res,"database not ready. Please wait a bit.");
		return;
	}

	let body = req.body + "";
	if(body.length >= 2000*1000){ // basic ddos protection, this check is not really necessary as express already does it.
		send_error(res,'body is too big. (size = '+body.length+')');
		return;
	}

	if(req.query.type === "make_recipe"){
		if(!req.session.co){
			send_error(res,"you need to be logged in to perform this request");
			return;
		}
		try{
			body = JSON.parse(body);
		}catch(err){
			send_error(res,"invalid json in body.");
			return;
		}

		let image_result = await rw.create_image(body.image,rethinkdb)
		if(image_result.error == null){
			image_result = image_result.result.id;
			// create_recipe should check the types of everything.
			let result = await rw.create_recipe(req.session.user_id,body.title,body.description,body.tags,body.ingredients,body.steps,image_result,rethinkdb);
			send_response(res,result);
		}else{
			send_response(res,image_result);
		}


	}else if(req.query.type === "delete_recipe"){
		if(!req.session.co){
			send_error(res,"you need to be logged in to perform this request");
			return;
		}
		let id = req.query.id;
		if(typeof id !== "string" || id.length < 1){
			send_error(res,"id not provided");
			return;
		}
		send_response(res,await rw.delete_recipe(req.session.user_id,id,rethinkdb));
	}else if(req.query.type === "make_comment"){
		if(!req.session.co){
			send_error(res,"you need to be logged in to perform this request");
			return;
		}
		let id = req.query.id;
		if(typeof id !== "string" || id.length < 1){
			send_error(res,"id not provided");
			return;
		}
		try{
			body = JSON.parse(body);
		}catch(err){
			send_error(res,"invalid json in body.");
			return;
		}

		let result = await rw.create_comment(req.session.user_id,id,body.content,rethinkdb);
		send_response(res,result);
	}else if(req.query.type === "delete_comment"){
		if(!req.session.co){
			send_error(res,"you need to be logged in to perform this request");
			return;
		}
		let id = req.query.id;
		if(typeof id !== "string" || id.length < 1){
			send_error(res,"id not provided");
			return;
		}
		let cid = req.query.cid;
		if(typeof cid !== "string" || cid.length < 1){
			send_error(res,"cid not provided");
			return;
		}
		send_response(res,await rw.delete_comment(req.session.user_id,id,cid,rethinkdb));
	}else if(req.query.type === "rate"){
		if(!req.session.co){
			send_error(res,"you need to be logged in to perform this request");
			return;
		}
		let id = req.query.id;
		if(typeof id !== "string" || id.length < 1){
			send_error(res,"id not provided");
			return;
		}

		// at this point, rate is a string, rate_recipe checks that it's a valid nuber
		send_response(res,await rw.rate_recipe(req.session.user_id,id,req.query.rate,rethinkdb));
	}else{
		send_error(res,"type option not recognized");
	}
}