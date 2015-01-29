var READY = 0;
var GETTING = 1;
var ANIMATING = 2;

var status = READY;
var docs;

var hostname = '120.24.59.174';

function getName(index) {
	var name = docs.all[index].name;
	var uid = docs.all[index].uid;
	// console.log("name : " + name + ", uid: " + uid);

	if (uid.indexOf('|') != -1 && uid.length >= 4) {
		var length = uid.length;
		var phoneNumber = uid.substring(length - 4, length);
		if (phoneNumber != 'null') {
			name += '|' + phoneNumber;
		}
	}
	// console.log("lucky man: " + name);

	return name;
}

function keypress(event) {
	var key = event.keyCode || event.which || event.charCode;
	if (status == READY) {
		if (key == 13) {
			$.get('http://' + hostname + ':8086/?lottery=true', function(result) {
				console.log(result);
				docs = JSON.parse(result);
				startAnimate();
			});
			status = GETTING;
		}
	}

	if (status == ANIMATING) {
		if (key == 32) {
			$("#text > p").text(getName(docs.lucky));

			status = READY;
		}
	}
}

function animate() {
	// console.log('animate');

	if (status == ANIMATING) {
		if (!docs || !docs.all) {
			$("#text > p").text('竟然没有人来抽？奖品都是我的啦，哈哈');

			status = READY;
		} else if (docs.all.length == 1) {
			$("#text > p").text('一人独享：' + getName(0));

			status = READY;
		} else {
			var length = docs.all.length;
			var index = (Math.random() * length) | 0;
			$("#text > p").text(getName(index));

			requestAnimationFrame(animate);
		}
	}
}

function startAnimate() {
	status = ANIMATING;

	requestAnimationFrame(animate);
}

document.onkeypress = keypress;