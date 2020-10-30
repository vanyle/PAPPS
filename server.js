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

function handle_query(req,res){

}



// TODO: add auth stuff somewhere around here.
app.use('/',express.static('client'));
app.get('/',(req,res) => {
	res.sendFile(__dirname + "/client/index.html");
});

app.get('/q',async (req,res) => {
	handle_query(req,res);
});

app.listen(config.port);
console.log("Listening at "+config.host+":"+config.port);