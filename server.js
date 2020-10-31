"use strict";

// Load config.
let config = {};
try{
	config = require('./config.json');
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


// Load and setup libraries / external modules
const express = require('express');
const database = require('./back/database.js');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

database.setup(config);

// Setup app
let app = express();

// TODO: add auth stuff somewhere around here.
app.use('/',express.static('client'));
app.get('/',(req,res) => {
	res.sendFile(__dirname + "/client/index.html");
});

app.get('/q',async (req,res) => {
	database.handle_query(req,res);
});


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