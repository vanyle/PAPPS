const cp = require('child_process');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
let db_url = null; // config load is needed to init these
let db_port = null;
let config = {};
let mongo_process = null;
let mongo_client = null;
let db = null;

let json_logs = false; // mongod uses JSON logs with version >= 4.4

const DB_NAME = "PAPS";

const RED_COLOR_CODE = "\u001b[31m";
const YELLOW_COLOR_CODE = "\u001b[33m";
const GREEN_COLOR_CODE = "\u001b[32m";
const RESET_COLOR_CODE = "\u001b[0m";

function manage_shutdown(){
	console.log("Shutting down database.");
	// The server is about to be shutdown, cleanly shutdown the database also to prevent data corruption
	mongo_client.close();
}

function process_query_from_database(data){
	try{
		if(json_logs){
			let query = JSON.parse(data);
			// query.s contains severity of message.
			// I = info, W = warning, E = error.

			if(query.s === 'I'){
				//console.log("MongoDB: INFO ["+query.t.$date+"] "+query.msg)
			}else if(query.s === "W"){
				console.log("MongoDB:"+YELLOW_COLOR_CODE+" WARNING"+RESET_COLOR_CODE+" ["+query.t.$date+"] "+query.msg);			
			}else if(query.s === "E"){
				console.log("MongoDB:"+RED_COLOR_CODE+" ERROR"+RESET_COLOR_CODE+" ["+query.t.$date+"] "+query.msg+": "+query.attr.error);		
			}
		}else{
			console.log(data);
		}
	}catch(err){
		console.log(RED_COLOR_CODE+err.message+RESET_COLOR_CODE);
		console.log(data);
	}

}

module.exports.setup = (c) => {
	config = c;
	config.mongo_program = config.mongo_program || "mongod"; // set default value
	config.mongo_host = config.mongo_host || "localhost";
	config.mongo_port = config.mongo_port || 27017;
	config.db_path = config.db_path || "./db/";
	db_url = config.mongo_host;
	db_port = config.mongo_port;

	// create database folder for first time initialization:
	if(config.db_path === "./db/" && !fs.existsSync(config.db_path)){
		fs.mkdirSync(config.db_path);
		console.log("Created directory "+config.db_path+" for database.");
	}

	console.log("Starting database ...");

	cp.exec(config.mongo_program+" --version", (err,stdout,stderr) => {
		if(err){
			console.log(RED_COLOR_CODE+"Unable to start database:"+RESET_COLOR_CODE);
			console.log(err.message);
			console.log("Is it installed ? You can install mongodb using the tutorial provided in README.md");
			console.log("If the database is installed, \"mongod --version\" should print the version installed.")
			process.exit(1);
		}

		let version = stdout.split("\n",2)[0].split("v",3)[2];

		console.log("Your mongod version is:",version);
		version = version.split(".");
		if(version[0] >= 4 && version[1] >= 4){
			console.log("JSON logs enabled");
			json_logs = true;
		}else{
			console.log("JSON logs disabled");
			json_logs = false;
		}

		// database seems to be properly installed.

		mongo_process = cp.spawn(config.mongo_program,["--dbpath=" + config.db_path,"--bind_ip=" + config.mongo_host,"--port=" + config.mongo_port]);
		
		let databuffer = "";
		mongo_process.stdout.on('data', (data) => {
			// convert data from buffer to string:
			data = data + "";

			// add data to buffer until a line break is found.
			for(let i = 0;i < data.length;i++){
				if(data[i] == '\n'){
					// process the JSON and flush the buffer
					process_query_from_database(databuffer);
					databuffer = "";
				}else{
					databuffer += data[i];
				}
			}
		});
		mongo_process.on('close', (code) => {
			console.log(`Mongod process exited with code ${code}`);
			process.exit(0);
		});

		process.on('SIGHUP',manage_shutdown); // called when terminal is closed
		process.on('SIGINT',manage_shutdown); // called when Ctrl-C
		process.on('SIGTERM',manage_shutdown);

		console.log(GREEN_COLOR_CODE+"Database started."+RESET_COLOR_CODE);

		// This is where the url for connecting to the database is built.
		// This should be customizable because a lot of options (like auth) can be put here.
		const url = "mongodb://" + db_url + ":" + db_port;
		// connect to db.
		MongoClient.connect(url,{useUnifiedTopology: true}, async (err, client) => {
			if(err !== null){
				console.log(RED_COLOR_CODE+"Unable to connect to database. Something weird is going on. Read MongoDB logs for more informations."+RESET_COLOR_CODE);
			}
			console.log(GREEN_COLOR_CODE+"Connected successfully to the database"+RESET_COLOR_CODE);
			
			mongo_client = client;
			db = mongo_client.db(DB_NAME);

			if(config.put_fake_data){
				console.log(YELLOW_COLOR_CODE+"Overwriting database with fake data, because put_fake_data=true in config.json"+RESET_COLOR_CODE)
				console.log(YELLOW_COLOR_CODE+"Stop the process if this was an error, you have 5 seconds to do so (use Ctrl-C)"+RESET_COLOR_CODE);
				setTimeout( () => {
					require('../doc/fake_data.js').populate_db(db);
					console.log("Database overwrited.")
				},5 * 1000);
			}

			/*const recipe = {
				title:"Frites",
				tags:["Vegan","Gras","Patate"],
				ingredients:["Pommes de terre","Huile de colza","Sel"],
				rating:5,
				content:"Faire frire les <b>patates</b> et c'est prêt :)",
				comments:[
					{
						user:1, // userid
						content:"J'aime beaucoup, merci pour cette recette."
					}
				]
			};

			const result1 = await recipes.deleteMany({}); // remove all recipes.

			const result = await recipes.insertOne(recipe);

			recipes.find({}).toArray(function(err, docs) {
				console.log("Found the following records");
				console.log(docs)
			});*/
		});
	});

};


function send_error(res,msg){
	res.send({'error':msg});
}

module.exports.handle_query = (req,res) => {
	if(db == null){
		send_error(res,"database not ready. Please wait a bit.");
		return;
	}

	if(req.query.type === "recipes"){
		const recipes = db.collection('recipes');
		recipes.find({}).toArray(function(err, docs) {
			res.send(docs);
		});
	}else{
		send_error(res,"type option not recognized");
	}
}