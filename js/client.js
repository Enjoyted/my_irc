(function($){

	var socket = io.connect('http://localhost:1337');
	var msgtpl = $("#msgtpl").html();
	$("#msgtpl").remove();
	var lastmsg = false;

	/**									**
	* Login stuff
	**/
	$('#loginform').submit(function(event) {
		event.preventDefault();
		socket.emit('login', {
			username : $('#username').val(),
			intraname : $('#intraname').val()
		});
	})

	if($("#login").is(":visible")) {
		$("#relog").hide();
	}

	socket.on('newusr', function(user) {
		$("#users").append('<img src="' + user.avatar + '" id="' + user.id + '" title="'+ user.username +'">');
	})

	socket.on('logged', function() {
		$('#login').fadeOut();
		$("#relog").fadeIn();
	})

	/**									**
	* Disconnect stuff
	**/

	socket.on('disusr', function(user) {
		$("#"+user.id).remove();
	})

	$("#relog").click(function() {
		$(this).hide();
		$("#login").fadeIn();
		socket.emit('relog' );
	})

	/**									**
	* Messages
	**/

	$("#msgform").submit(function(event) {
		event.preventDefault();
		socket.emit('newmsg', { message: $("#message").val(), room : $("#rooms").html() });
		$('#message').val('');
		$("#message").focus();
	})

	socket.on('newmsg', function(message) {
		if(lastmsg != message.user.id) {
			$("#messages").append("<div class='sep'></div>");
			lastmsg = message.user.id;
		}
		$("#messages").append('<div class="message">' + Mustache.render(msgtpl, message) + '</div>');
		$("#messages").animate({scrollTop : $("#messages").prop('scrollHeight')}, 500);
	})

	socket.on('notFunction', function(message) {
		$("#messages").append('<div class="message">' + Mustache.render(msgtpl, message) + '</div>');
		$("#messages").animate({scrollTop : $("#messages").prop('scrollHeight')}, 500);
	})

	/**
	* Commandes
	**/


	/**
	* Room
	**/

	socket.on('roomJoin', function(roomName) {
		$("#rooms").html(roomName);
	})


})(jQuery);