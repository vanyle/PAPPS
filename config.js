module.exports = {
	
	"http_port":8080,
	"https_port":443,
	"host":"localhost",

	"db_host":"127.0.0.1",
	"db_program":"rethinkdb",
	"db_path":"./db/",
	// you can add a db_port open to change the default database port.

	// common options in db_more_arguments:
	// --no-http-admin : disable http adminitration console
	// --join host:port : ip of a node to join a cluster if we need multiple servers to keep up with demand
	"db_more_arguments":[],
	"https_secret":"./secret/",
	"session_secret":"rejdkfzps5688234", // must we changed when in production for security reasons. Must be the same for all nodes in the cluster

	"put_fake_data":false
}
