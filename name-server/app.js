var http = require('http');
var url = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;

// Connection URL
var mongoUrl = 'mongodb://localhost:27017/name';

var port = 8086;

// The unused names that can be assigned.
var unusedNames;

function simpleResponse(res, text) {
	res.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8', "Access-Control-Allow-Origin": "*"});
	res.write(text);
	res.end();
}

function findUid(db, uid, callback) {
	// Get the uids collection
	var collection = db.collection('uids');
	// Find uid
	collection.find({"uid": uid}).toArray(function(err, docs) {
		console.log("Found the following records");
		console.dir(docs);
		callback(docs);
	});
}

/*
Return a random name from unused names, and splice it.
*/
function getRandomName() {
	if (unusedNames.length == 0) {
		console.log("not enough name.");
		return "guest";
	} else {
		var index = Math.floor(Math.random() * (unusedNames.length - 1));
		var name = unusedNames[index].name;
		console.log("unusedNames[index] = " + unusedNames[index]);
		console.log("index = " + index + ", name = " + name);
		// remove the name from unused names array.
		unusedNames.splice(index, 1);
		return name;
	}
}

function assignName(db, uid, callback) {
	// Get the name by uid
	var name = getRandomName();

	// Get the names collection
	var collection = db.collection('names');
	// Update the document with 'used: 1'.
	collection.update({"name": name}, {$set: {"used": 1}}, function(err, result) {
		console.log("err = " + err + ", result = " + result);
		// Get the uids collection
		var uidsCollection = db.collection('uids');
		// Find uid
		uidsCollection.insert({"uid": uid, "name": name, "lottery": 0}, {w: 1}, function(err, result) {
			if (err) {
				console.log("err = " + err);
				name = "guest";
			}
			callback(name);
		});
	});
}

/*
Add names to collection "names".
*/
function addNames(db, names, callback) {
	// Convert names to json array
	var array = [];
	for (var i in names) {
		array.push({"_id": i, "name": names[i].trim(), "used": 0});
	}
	// Get the names collection
	var collection = db.collection('names');
	// add names
	collection.insertMany(array, function(err, result) {
		if (!err) {
			console.log("Inserted " + result.n + " documents into the names collection");

			// set unusedNames
			unusedNames = array;
		} else {
			console.log("err = " + err);
		}
		callback(result);
	});
}

/*
Init collections "names".
*/
function initDb(res) {
	// Read the names.
	fs.readFile('names.txt', 'utf-8', function(err, data) {
		var splits = data.split('\n');
		// Use connect method to connect to the Server
		MongoClient.connect(mongoUrl, function(err, db) {
			console.log("Connected correctly to server");
			addNames(db, splits, function(result) {
				db.close();

				simpleResponse(res, "add Names result: " + result);
			});
		});
	});
}

/*
Read unused names from collection "names".
*/
function getUnusedNames(db, next) {
	if (!unusedNames) {
		// Get the names collection
		var collection = db.collection('names');
		// add names
		collection.find({'used' : 0}).toArray(function(err, docs) {
			unusedNames = docs;
			next(db);
		});
	} else {
		next(db);
	}
}

function onRequest(req, res) {
	console.log("url = " + req.url);
	var arg = url.parse(req.url, true).query;
	if (arg.init) {
		initDb(res);
	} else if (arg.uid) {
		// Use connect method to connect to the Server
		MongoClient.connect(mongoUrl, function(err, db) {
			console.log("Connected correctly to server");
			findUid(db, arg.uid, function(docs) {
				if (docs.length == 0) {
					// not find.
					getUnusedNames(db, function(db) {
						console.log("unusedNames = " + unusedNames);
						assignName(db, arg.uid, function(name){
							db.close();

							simpleResponse(res, name);
						});
					});
				} else {
					db.close();

					simpleResponse(res, docs[0].name);
				}
			});
		});
	} else if (arg.lottery) {
		// Use connect method to connect to the Server
		MongoClient.connect(mongoUrl, function(err, db) {
			console.log("lottery");
			var collection = db.collection('uids');
			collection.find({'lottery' : 0}).toArray(function(err, docs) {
				if (docs.length == 0) {
					db.close();

					console.log('no locky man');
					simpleResponse(res, JSON.stringify({'all': undefined, 'lucky': undefined}));
					return;
				}

				for (var i in docs) {
					console.log('name: ' + docs[i].name);
				}

				// choose the lucy man
				var lucky = (Math.random() * docs.length) | 0;
				var luckyCollection = db.collection('uids');
				console.log('lucky man: ' + docs[lucky].name);
				luckyCollection.update({'uid': docs[lucky].uid}, {$set: {'lottery' : 1}}, function(err, result) {
					db.close();

					// simpleResponse(res, 'lucky man: ' + docs[lucky].name);
					simpleResponse(res, JSON.stringify({'all': docs, 'lucky': lucky}));
				});
			});
		});
	} else {
		simpleResponse(res, "invalid parameter");
	}
}

http.createServer(onRequest).listen(port);

console.log("Web server has started.");
console.log("Please log on http://127.0.0.1:" + port + "/?uid=youruid");