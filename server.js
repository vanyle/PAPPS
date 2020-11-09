"use strict";

// Load config.
let config = {};
try{
	config = require('./config.js');
}catch(err){
	console.error("Unable to retreive config.");
	console.log(err.message);
	process.exit(1);
}
// Setup defaults for config.
config.http_port = config.http_port || 80;
config.https_port = config.https_port || 443;
config.host = config.host || "localhost";
config.https_secret = config.https_secret || null;

// find somewhere better to store this. It should remain constant on the same machine and be secret. Putting it in the source code is a bad idea.
const secret = config.session_secret || "rejdkfzps5688234";

// Load and setup libraries / external modules
const express = require('express');
const database = require('./back/database.js');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const RDBStore = require('session-rethinkdb')(session);
//const netstat = require('node-netstat'); // used to make deployement easier by detecting ports already in use and the processes associated.

let store = null;
let app = null;

database.setup(config, (r) => {
	// called when database is ready. Might never be called is the database does not work.
	store =	new RDBStore(r, {
	  browserSessionsMaxAge: 60000, // optional, default is 60000. After how much time should an expired session be cleared from the database
	  clearInterval: 60000, // optional, default is 60000. How often do you want to check and clear expired sessions
	});

	//console.log(store);

	start_webserver();
});

function process_file_content(content,basepath){
	let tomatch = "@include{";
	let include_start_index = 0;
	let include_stop_index = 0;

	for(let i = 0;i < content.length;i++){
		if(content.substring(i,i + tomatch.length) === tomatch){
			i += tomatch.length;
			include_start_index = i;
			while(content[i] !== '}') i++;
			include_stop_index = i;

			// perform substitution.
			let file_path = path.join(basepath,content.substring(include_start_index,include_stop_index));
			try{
				let substitution = fs.readFileSync(file_path);
				content = content.substring(0,include_start_index - tomatch.length) + substitution + content.substring(include_stop_index+1);
				i = include_start_index - tomatch.length;
			}catch(err){
				console.log("Warning, substitution failed in process_file_content: ");
				console.log(err.message);
			}
		}
	}
	return content;
}


function start_webserver(){

	// Setup app
	let app = express();

	app.use(session({
		secret: secret, 
		resave: true,
		store: store,
		saveUninitialized: false,
		cookie: {
			secure: false,
			name: "sessionid_data", // used so that people don't know what session manager is used.
			maxAge: 1000 * 60 * 60 * 24 * 7 // in milliseconds
		}
	}));

	app.get('/q',async (req,res) => {
		database.handle_query(req,res);
	});
	app.post('/q',async (req,res) => {
		database.handle_post_query(req,res);
	});

	app.use('/',(req,res,next) => {
		let rpath = req.path;
		if(rpath === '/'){
			rpath = '/index.html';
		}

		let file_path =  path.join('./client',path.normalize(rpath));

		if(fs.existsSync(file_path) && fs.lstatSync(file_path).isFile()){
			// use proprocessing on these 4 file types.
			if(file_path.endsWith('.html') || file_path.endsWith('.js') || file_path.endsWith('.css')){
					if(file_path.endsWith('.css')){
						res.writeHead(200, {
    						'Content-Type': 'text/css'
  						});
					}
					let content = fs.readFileSync(file_path,'utf8');
					res.write(process_file_content(content,"./client/"));
					res.end();
				}else{
					// send raw files of arbitrary size.
					let file_read_stream = fs.createReadStream(file_path);
					file_read_stream.on('data',(chunk) => {
						res.write(chunk);
					})
					file_read_stream.on('end',() => {
						res.end();
					})
				}
			return;
		}

		next();
	});
	app.use(express.raw({type: '*/*',limit: '2000kb',})); // to retreive bodies of post requests, with 2 Mo limit for image uploads (Most images are under 1 Mo)


	const RED_COLOR_CODE = "\u001b[31m";
	const YELLOW_COLOR_CODE = "\u001b[33m";
	const GREEN_COLOR_CODE = "\u001b[32m";
	const RESET_COLOR_CODE = "\u001b[0m";

	// HTTP setup.
	const httpServer = http.createServer(app);
	httpServer.listen(config.http_port, () => {
		console.log(GREEN_COLOR_CODE+'HTTP Server started. Access at http://'+config.host+":"+config.http_port+RESET_COLOR_CODE);
	});

	// HTTPS Setup.
	if(config.https_secret !== null){
		let credentials = null;
		try{
			const privateKey = fs.readFileSync(path.join(config.https_secret,'privkey.pem'), 'utf8');
			const certificate = fs.readFileSync(path.join(config.https_secret,'cert.pem'), 'utf8');
			const ca = fs.readFileSync(path.join(config.https_secret,'/chain.pem'), 'utf8');
			credentials = {
				key: privateKey,
				cert: certificate,
				ca: ca
			};
		}catch(err){
			console.log(RED_COLOR_CODE+"Unable to start HTTPS Server. Did you put the HTTPS secrets inside "+config.https_secret+" ?"+RESET_COLOR_CODE);
			console.log("Put an empty string inside https_secret in config.json to disable HTTPS and remove this error.")
			console.log(err.message);
		}

		if(credentials != null){
			const httpsServer = https.createServer(credentials, app);

			httpsServer.listen(config.https_port, () => {
				console.log(GREEN_COLOR_CODE+'HTTPS Server started. Access at https://'+config.host+":"+config.https_port+RESET_COLOR_CODE);
			});
		}
	}
}