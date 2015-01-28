var fs = require('fs');

var out = [];

fs.readFile('in.txt', 'utf-8', function(err, data) {
		if (err) {
			console.log('no in.txt.');
			return;
		}
		
		var splits = data.split('\n');
		for (var i in splits) {
			splits[i] = splits[i].trim();
			if (splits[i] != '') {
				out.push(splits[i]);
			}
		}

		for (var i in out) {
			// console.log(i + ": " + out[i]);	
		}

		fs.writeFile('names.txt', out.join('\n'), function(err) {
			console.log('write file complete.');
		});
	});
