var pomelo = window.pomelo;
var username = "observer";
var users;
var rid = "zenparty";
var reg = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
var LOGIN_ERROR = "There is no server to log in, please wait.";
var LENGTH_ERROR = "Name/Channel is too long or too short. 20 character max.";
var NAME_ERROR = "Bad character in Name/Channel. Can only have letters, numbers, Chinese characters, and '_'";
var DUPLICATE_ERROR = "Please change your name to login.";
var entering;
var comments = [];
var INTERVAL = 3; // seconds
var lastSent = 0; // the timestamp of last added message.

util = {
	urlRE: /https?:\/\/([-\w\.]+)+(:\d+)?(\/([^\s]*(\?\S+)?)?)?/g,
	//  html sanitizer
	toStaticHTML: function(inputHtml) {
		inputHtml = inputHtml.toString();
		return inputHtml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	},
	//pads n with zeros on the left,
	//digits is minimum length of output
	//zeroPad(3, 5); returns "005"
	//zeroPad(2, 500); returns "500"
	zeroPad: function(digits, n) {
		n = n.toString();
		while(n.length < digits)
		n = '0' + n;
		return n;
	},
	//it is almost 8 o'clock PM here
	//timeString(new Date); returns "19:49"
	timeString: function(date) {
		var minutes = date.getMinutes().toString();
		var hours = date.getHours().toString();
		return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
	},

	//does the argument only contain whitespace?
	isBlank: function(text) {
		var blank = /^\s*$/;
		return(text.match(blank) !== null);
	}
};

function pushMessage(from, text) {
	var timestamp = (new Date()).getTime();
	if (comments.length == 0 && timestamp - lastSent > INTERVAL * 1000) {
		addMessage(from, text);
	} else {
		comments.push({
			'from': from,
			'text': text
		});
	}
}

// add message on board
function addMessage(from, text) {
	if(text === null) return;
	//every message you see is actually a table with 2 cols:
	//  the person who caused the event,
	//  and the content
	var messageElement = $(document.createElement("div"));
	messageElement.addClass("demo");
	// sanitize
	text = util.toStaticHTML(text);
	from = util.toStaticHTML(from);
	var content = '<p>' + from + ': ' + text + '</p>';
	messageElement.html(content);
	//the log is the stream that we view
	var length = $("#comments_container").children().length;
	messageElement.hide();
	$("#comments_container").prepend(messageElement);
	messageElement.show('slow');

	console.log("add message: " + from + ", " + text);
	lastSent = (new Date()).getTime();
};

// check the comments
function check() {
	if (comments.length == 0) {
		console.log("empty task");
	} else {
		var comment = comments.shift();
		addMessage(comment.from, comment.text);
	}
}

// show error
function showError(error) {
	// pushMessage("系统", error);
	console.log("系统: " + error);
}

// log in with observer account
function login() {
	//query entry of connection
	queryEntry(username, function(host, port) {
		pomelo.init({
			host: host,
			port: port,
			log: true
		}, function() {
			var route = "connector.entryHandler.enter";
			pomelo.request(route, {
				username: username,
				rid: rid
			}, function(data) {
				if(data.error) {
					showError(DUPLICATE_ERROR);
					return;
				}
				// pushMessage("系统", "装弹完毕。");
				console.log("系统: 装弹完毕。");
			});
		});
	});
}

// query connector
function queryEntry(uid, callback) {
	var route = 'gate.gateHandler.queryEntry';
	pomelo.init({
		host: window.location.hostname,
		port: 3014,
		log: true
	}, function() {
		pomelo.request(route, {
			uid: uid
		}, function(data) {
			entering = true;
			pomelo.disconnect();
			if(data.code === 500) {
				showError(LOGIN_ERROR);
				return;
			}
			callback(data.host, data.port);
		});
	});
};

$(document).ready(function() {
	// generate a random name
	username += (Math.random() * 1000) | 0;

	// when first time into chat room.
	login();

	// wait message from the server.
	pomelo.on('onChat', function(data) {
		pushMessage(data.from, data.msg);
		$("#chatHistory").show();
	});

	// update user list
	pomelo.on('onAdd', function(data) {
		var user = data.user;
	});

	// update user list
	pomelo.on('onLeave', function(data) {
		var user = data.user;
	});

	// handle disconect message, occours when the client is disconnect with servers
	pomelo.on('disconnect', function(reason) {
		if (entering) {
			entering = false;
			return;
		}
		// pushMessage("系统", "机体脱离。");
		console.log("系统: 机体脱离");
	});
});

var i = 0
function keypress(event) {
	var key = event.keyCode || event.which || event.charCode;
	if (key == 32) {
		pushMessage("系统", "空格键" + i);
		i++;
	}
}

// document.onkeypress = keypress;

window.setInterval(check, INTERVAL * 1000);