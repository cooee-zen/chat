var pomelo = window.pomelo;
var username = "observer";
var users;
var rid = "zenparty";
var base = 1000;
var increase = 25;
var reg = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
var LOGIN_ERROR = "There is no server to log in, please wait.";
var LENGTH_ERROR = "Name/Channel is too long or too short. 20 character max.";
var NAME_ERROR = "Bad character in Name/Channel. Can only have letters, numbers, Chinese characters, and '_'";
var DUPLICATE_ERROR = "Please change your name to login.";
var entering;

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

//always view the most recent message when it is added
function scrollDown(base) {
	window.scrollTo(0, base);
};

// add message on board
function addMessage(from, text, time) {
	if(text === null) return;
	if(time == null) {
		// if the time is null or undefined, use the current time.
		time = new Date();
	} else if((time instanceof Date) === false) {
		// if it's a timestamp, interpret it
		time = new Date(time);
	}
	//every message you see is actually a table with 3 cols:
	//  the time,
	//  the person who caused the event,
	//  and the content
	var messageElement = $(document.createElement("table"));
	messageElement.addClass("message.observer");
	// sanitize
	text = util.toStaticHTML(text);
	var content = '<tr>' + '  <td class="nick observer">' + util.toStaticHTML(from) + ': ' + '</td>' + '  <td class="msg-text observer">' + text + '</td>' + '</tr>';
	messageElement.html(content);
	//the log is the stream that we view
	$("#chatHistory").append(messageElement);
	base += increase;
	scrollDown(base);
};

// show chat panel
function showChat() {
	scrollDown(base);
};

// show error
function showError(error) {
	addMessage("系统", error);
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
				showChat();
				addMessage("系统", "装弹完毕。");
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
		addMessage(data.from, data.msg);
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
		addMessage("系统", "与机体脱离。");
	});
});