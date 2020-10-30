"use strict";
let config = {};
try{
	config = require('./config.json');
}catch(err){
	console.error("Unable to retreive config.");
	console.log(err.message);
	process.exit(1);
}

let express = require('express');
let app = express();


// TODO: add auth stuff somewhere around here.
app.use('/',express.static('client'));
app.get('/',(req,res) => {
	res.sendFile(__dirname + "/client/index.html");
});

app.get('/file',async (req,res) => {
	fm.handle_query(req,res);
});

app.listen(config.port);
console.log("Listening at "+config.host+":"+config.port);