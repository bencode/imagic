var Canvas = require('canvas'),
	Http = require('http');


var server = Http.createServer(function(req, res) {
console.log(req.url)
	var url = req.url,
		pattern = /^\/([^?]+)(?:\?(.+))?$/,
		match = pattern.exec(url);

	if (!match) {
		return error(res, { statusCode: 304 });
	}

	var route = match[1];
		params = match[2] ? unparam(match[2]) : {};

	console.log('route:', route, ', params:', params);

	if (!routes[route]) {
		return error(res, { statusCode: 304 })
	}

	routes[route](params, req, res);
});


function unparam(qs) {
	var params = {},
		pattern = /^([^=]+)=(.*)$/,
		parts = qs.split('&');

	parts.forEach(function(part) {
		var m = pattern.exec(part);
		if (m) {
			try {
				params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
			} catch (e) {
				params[m[1]] = m[2];
			}
		}
	});

	return params;
}


var routes = {
	'mimg': function(params, req, res) {
		var src = params.src,
			width = parseInt(params.w, 10) || 100,
			height = parseInt(params.h, 10) || width;

		getUrlData(src, function(e, data) {
			if (e) {
				e.statusCode = 500;
				return error(res, e);
			}

			res.writeHead(200, {'Content-Type': 'image/jpeg'});

			var canvas = new Canvas(width, height),
				ctx = canvas.getContext('2d');

			var img = new Canvas.Image();
			img.src = data;

			ctx.drawImage(img, 0, 0, width, height);
			
			var stream = canvas.jpegStream();
			stream.on('data', function(imgdata) {
				res.write(imgdata);
			});

			stream.on('end', function() {
				res.end();
			});
		});
	}

};


var getUrlData = function(url, fn) {
	Http.get(url, function(res) {
		if (res.statusCode !== 200)	{
			return fn(res.statusCode);
		}

		var list = [];
		res.on('data', function(data) {
			list.push(data);
		});

		res.on('end', function() {
			fn(null, Buffer.concat(list));
		});
	});
};


var error = function(res, e) {
	res.writeHead(e.statusCode, { 'Content-Type': 'text/html'});
	res.end('<h1>' + (e.message || 'Error!!!') + '</h1>');
};


var host = '10.16.24.74',
	port = 10100;

server.listen(port, host);

console.log('Server running at ' + host + ':' + port);

