var https = require('http');
var options = {
	hostname: 'www.facebook.com',
	path: '/teddy.isidor',
	method: 'GET',
	headers: {
		'user-agent': 'Mozilla/5.0',
		'Content-Type': 'application/json'
	}
};
var content = '';
var request = https.request( options, function(res) {
	console.log(res)
	//res.setEncoding("utf8");
	res.on("data", function (chunk) {
		content += chunk;
	});

	res.on("end", function () {
		console.log( content );
	});

} );

request.end();


