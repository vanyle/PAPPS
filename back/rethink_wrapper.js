// A thin wrapper around some RethinkDB methods.


module.exports.createTable = async (tableName,conn,r) => {
	return new Promise((resolve) => {
		r.tableCreate(tableName).run(conn, function(err, result) {
	    	resolve({err:err,result:result});
		});
	});
}
module.exports.deleteTable = async (tableName,conn,r) => {
	return new Promise((resolve) => {
		r.tableDrop(tableName).run(conn, function(err, result) {
	    	resolve({err:err,result:result});
		});
	});
}
module.exports.listTable = async (conn,r) => {
	return new Promise((resolve) => {
		r.tableList().run(conn, (err,result) => {
			resolve({err:err,result:result});
		});
	});
}

// If data is an array, all elements of data are inserted.
// If data is an object, data is inserted.
module.exports.insert = async (data,tableName,conn,r) => {
	return new Promise((resolve) => {
		r.table(tableName).insert(data).run(conn, function(err, result) {
	    	resolve({err:err,result:result});
		});
	});
}
module.exports.get = async (query,tableName,conn,r) => {
	return new Promise((resolve) => {
		r.table(tableName).run(conn, function(err, cursor) {
		    if(err != null){
		    	resolve({error:err,result:null});
		    	return;
			}
		    cursor.toArray(function(err, result) {
		        if (err != null){
		        	resolve({error:err,result:null});
		    		return;
		        }
		        resolve({error:null,result:result});
		    });
		});
	});
}
