var http = require('http');
var md5 = require('MD5');
var fs = require('fs');
var url = require('url');

var fileContext = (function() {
	var context_type = {
		'html'	:'text/html',
		'js'	:'text/javascript',
		'jpg'	:'image/jpeg',
		'css'	:'text/css'
	}

	return ( function( a ) {
		if ( typeof(context_type[a]) !== 'undefined' ) {
			return ( context_type[a] );
		}
		return ( 'text/html' ); 
	});
})();

httpServer = http.createServer(function(req, res) {
	// res.end('hello world');
	var path = '.'+ url.parse(req.url).pathname;
	path = ( (path == './')? './index.html' : path );

	if ( fs.existsSync(path) ){
		var extension = (tmp = path.split('.'))[ tmp.length - 1 ];

		fs.readFile( path, function(err, data) {
			if (err) throw err; 

			res.writeHead(200, {'Content-Type':fileContext(extension)});
			res.end( data );
		} );
	} 
})

httpServer.listen(1337);

var io = require('socket.io').listen(httpServer);
var users = {};
var messages = [];
var history = 3;
var funcs = [
	'bitchslap',
	'quit',
	'msg',
	'kick',
	'join',
	'nick',
	'users',
	'list',
	'part',
	'all',
	'test'
];

/**
* Server
**/

users['admin'] = {
	username : 'admin',
	id : 'admin',
	avatar : 'http://cyril-maitre.fr/realisation/supforum/css/images/avatar/admin.gif'
}

io.sockets.on('connection', function(socket) {

	var me;
	/**
	* Listing stuff
	**/

	for(var i in messages) {
		socket.emit('newmsg', messages[i]);
	}

	for(var k in users) {
		socket.emit('newusr', users[k]);
	}

	/**
	* Connection stuff
	**/

	socket.on('login', function(user) {
		console.log('Nouvel utilisateur');
		me = user;
		me.id = user.username;
		me.socketid = socket.id;
		me.avatar = 'https://cdn.local.epitech.eu/userprofil/profilview/' + user.intraname + '.jpg';
		socket.emit('logged');
		me.room = 'main';
		socket.join(me.room);
		socket.emit('roomJoin', me.room);
		users[me.id] = me;
		io.sockets.emit('newusr', me);
	})

	/**
	* Disconnection stuff
	**/

	socket.on('disconnect', function(user) {
		if(!me) {
			return false;
		}
		users[me.id] = null;
		io.sockets.emit('disusr', me);
	})

	socket.on('relog', function() {
		users[me.id] = null;
		io.sockets.emit('disusr', me);
	})

	/**
	* Messages stuff
	**/

	socket.on('newmsg', function(message) {
		if(message.message.substr(0, 1) == '/') {
			arrMsg = message.message.split(' ');
			if(funcs.indexOf(arrMsg[0].substr(1,arrMsg[0].length)) > -1 ) {
				doCmd(message);
				return;
			} else {
				date = new Date();
				message.h = date.getHours();
				message.m = date.getMinutes();
				message.message = 'Ceci n\'est pas une fonction valide.';
				message.username = 'server';
				socket.emit('notFunction', message);
				return;
			}
		}
		message.user = me;
		date = new Date();
		message.h = date.getHours();
		message.m = date.getMinutes();
		messages.push(message);
		if(message.length > history) {
			message.shift();
		}
		console.log(me.room);
		if(me.room !== undefined) {
			io.to(me.room).emit('newmsg', message);
		} else {
			io.sockets.emit('newmsg', message);			
		}
	})


	/**	
	* Funcs
	**/

	function doCmd(message) {
		arrMsg = message.message.split(' ');
		cmd = arrMsg[0].substr(1, arrMsg[0].length);
		subject = arrMsg[1];

		if(cmd == 'kick') {

		}
		else if(cmd == 'nick') {
			exists = false;
			for(var i in users) {
				if( (users[i].username).indexOf(subject) > -1) {
					exists = true;
				}
			}
			if(exists !== true) {
				var oldname = me.username;
				me.username = subject;
				message.message = oldname + ' a changé son pseudo en ' + subject;
				message.user = users['admin'];
				date = new Date();
				message.h = date.getHours();
				message.m = date.getMinutes();
				io.sockets.emit('newmsg', message);
			} else {
				message.message = 'Le pseudo ' + subject + ' est deja pris par quelqu\'un';
				message.user = users['admin'];
				date = new Date();
				message.h = date.getHours();
				message.m = date.getMinutes();
				socket.emit('newmsg', message);
			}
		}
		else if(cmd == 'users') {
			message.message = '';
			for(i in io.sockets.adapter.rooms[me.room]) {
				for(a in users) {
					if(users[a].socketid == i) {
						message.message += users[a].username + '<br>';
					}
				}
			}
			date = new Date();
			message.h = date.getHours();
			message.m = date.getMinutes();
			message.user = users['admin'];
			socket.emit('newmsg', message); 
		}
		else if(cmd == 'join') {
			askedRoom = subject;
			if(askedRoom.length < 10) {
				if(askedRoom == me.room) {
					return false;
				}
				socket.leave(me.room);
				
				for(i in io.sockets.adapter.rooms) {
					if(i == me.room) {
						date = new Date();
						message.h = date.getHours();
						message.m = date.getMinutes();
						message.message = 'L\'utilisateur ' + me.username + ' a quitte le channel.';
						message.user = users['admin'];
						socket.broadcast.to(i).emit('newmsg', message);
					}
				}

				me.room = askedRoom;
				date = new Date();
				message.h = date.getHours();
				message.m = date.getMinutes();
				message.message = 'Vous venez de rejoindre le channel : ' + askedRoom;
				message.user = users['admin'];
				socket.emit('newmsg', message);

				for(i in io.sockets.adapter.rooms) {
					if(i == askedRoom) {
						date = new Date();
						message.h = date.getHours();
						message.m = date.getMinutes();
						message.message = 'L\'utilisateur ' + me.username + ' a rejoint le channel.';
						message.user = users['admin'];
						socket.broadcast.to(i).emit('newmsg', message);
					}
				}
				socket.join(askedRoom);
				socket.emit('roomJoin', askedRoom);
			}
		}
		else if(cmd == 'list') {
			date = new Date();
			message.message = '';
			console.log(io.sockets.adapter.rooms);
			for(i in io.sockets.adapter.rooms) {
				if(i.length < 15) {
					if(i !== null) {
						if(subject !== undefined) {
							if(i.indexOf(subject) > -1) {
								message.message += i + '<br>';
							}
						} 
						else {
							message.message += i + '<br>';
						}
					}
				}
			}
			message.h = date.getHours();
			message.m = date.getMinutes();
			message.user = users['admin'];
			socket.emit('newmsg', message);
		}
		else if(cmd == 'part') {
			found = false;
			console.log(io.sockets.adapter.rooms);
			if(subject !== undefined) {
				for(i in io.sockets.adapter.rooms) {
					if(i.indexOf(subject) > -1) {
						found = true;
						io.sockets.adapter.rooms[i] = null;
					}
				}
				if(found === true){
					if(me.room == subject) {
						me.room = 'main';
						socket.emit('roomJoin', me.room);
						date = new Date();
						message.h = date.getHours();
						message.m = date.getMinutes();
						message.user = users['admin'];
						message.message = 'Vous avez quitter le channel ' + subject;
						socket.emit('newmsg', message);
						socket.join(me.room);
					}
				}
				else {
					date = new Date();
					message.h = date.getHours();
					message.m = date.getMinutes();
					message.user = users['admin'];
					message.message = 'Vous n\'etes même pas dans le channel ' + subject;
					socket.emit('newmsg', message);
				}
			}
			console.log(io.sockets.adapter.rooms);
		}
		else if(cmd == 'msg') {
			if(typeof(subject) !== 'undefined') {
				if(typeof(users[subject]) !== 'undefined') {
					i = (message.message.indexOf(subject) + subject.length); 
					wholemsg = message.message.substr(i+1, message.message.length);
					date = new Date();
					message.h = date.getHours();
					message.m = date.getMinutes();
					message.user = users[me.username];
					message.message = wholemsg;
					io.sockets.in(users[subject].socketid).emit('newmsg', message);
				} else {
					date = new Date();
					message.h = date.getHours();
					message.m = date.getMinutes();
					message.user = users['admin'];
					message.message = 'L\'user que vous essayez de pm n\'existe pas!';
					socket.emit('newmsg', message);
				}
			}
			else {
				date = new Date();
				message.h = date.getHours();
				message.m = date.getMinutes();
				message.user = users['admin'];
				message.message = 'Veuillez precisez un message et un utilisateur quand vous essayez de PM quelqu\'un. Ex: "/msg Toto Coucou Toto!"';
				socket.emit('newmsg', message);
			}
		}
		else if(cmd == 'bitchslap') {
			if(subject !== undefined) {
				if(arrMsg[2] !== undefined) {
					date = new Date();
					message.h = date.getHours();
					message.m = date.getMinutes();
					message.user = users['admin'];
					message.message = 'L\'user ' + me.username + ' vous bitchslapp avec ceci : <img src="' + arrMsg[2] + '">';
					io.sockets.in(users[subject].socketid).emit('newmsg', message);
				} else {
					date = new Date();
					message.h = date.getHours();
					message.m = date.getMinutes();
					message.user = users['admin'];
					message.message = 'Veuillez preciser un objet (url link) avec quoi vous voulez bitchslappé votre interlocuteur';
					socket.emit('newmsg', message);
				}
			} else {
				date = new Date();
				message.h = date.getHours();
				message.m = date.getMinutes();
				message.user = users['admin'];
				message.message = 'Veuillez preciser un user a bitchslappé!';
				socket.emit('newmsg', message);
			}
		}
		else if(cmd == 'all') {
			i = message.message.indexOf(cmd); 
			wholemsg = message.message.substr(i+3, message.message.length);
			date = new Date();
			message.h = date.getHours();
			message.m = date.getMinutes();
			message.user = users[me.username];
			message.message = 'ALL MSG : ' + me.username + ' dit a tout le monde : ' + wholemsg;
			socket.broadcast.emit('newmsg', message);
		}
		else if(cmd == 'test') {
			console.log(io.sockets.clients('cacao'));
		}
	}

});