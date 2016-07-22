/*
Requiing room.js
*/
var Room = require('./room');

/*
	Importing config for mysql database
*/


var config = require('./config/config.json');
var baseUrl = config.base_url;
var pingUrl = config.accounts_url;

delete config.accounts_url;
delete config.base_url;

/*
	Importing node modules
*/

/*
	express for serving data
*/


var express = require('express')

var app = express();

/*
	express ejs for handling front end
*/

var expressLayouts = require('express-ejs-layouts');

/*
	requiring request-json to send a request to accounts.sdslabs.co.in and check the authenticity of the user
*/


request = require('request-json');

/*
	requiring http
*/

var http = require('http').Server(app);

/*
	require mysql module to interact with the database
*/
var mysql = require('mysql');
var connection = mysql.createConnection(config	);
connection.connect();
connection.query('UPDATE games SET active = \'false\',winner = \' ' +'draw'+'\',looser = \' '+'draw'+'\' WHERE `games`.`active` = \''+'active'+'\';');

/*
	requiring socket.io
*/

var io = require('socket.io')(http);


/*
	games array keeps track of currently active games running
*/

var games = {};

/*
	onlineUsers array keeps the track of users currently involved in active games.
	The role is to make sure a person is not involved in more than one games at a particular time.
*/

var onlineUsers = {};

app.set('port',(process.env.PORT||3000));

/*
	randomGame to keep track of weather there is a person waiting for someone to join a random game or not.
*/
var randomGame = 'none' ;

http.listen (app.get('port'),function(){
  console.log("listening to port number "+app.get('port'));
});
var spawn = require('child_process').spawn;
Room.io = io;
/*
	gameHandler to handle game disconnects and to clear all the data in case a game finishes
*/

function gameHandler()
{
}

gameHandler.end = function(winner, looser , room, socketIdWinner, socketIdLooser, isBot)
{
	if(!isBot)
	{
		if(room.active==true)
		{
			room.active = false;
			delete onlineUsers[winner];
			delete onlineUsers[looser];
			connection.query('SELECT * FROM usersInChess WHERE username = "'+winner+'";', function(err1, winnerData, fields1)
			{
				connection.query('SELECT * FROM usersInChess WHERE username = "'+looser+'";', function(err2, looserData, fields2)
				{
					var r1=winnerData[0].rating;
					var r2=looserData[0].rating;
					var act_scr1=1;
					var act_scr2=0;
				  	var exp_scr1 =Math.pow(10,(r1/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
 	           	    var exp_scr2=Math.pow(10,(r2/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
 	                //r1=r1+32*(act_scr1-exp_scr1);
 					//r2=r2+32*(act_scr2-exp_scr2)
					//var exchange = looserData[0].rating / 10;
					console.log(winnerData[0].rating);
					console.log(looserData[0].rating);
					if (io.sockets.connected[socketIdWinner]) {
					    io.sockets.connected[socketIdWinner].emit('won', 'won');
					}
					if (io.sockets.connected[socketIdLooser]) {
					    io.sockets.connected[socketIdLooser].emit('lost', 'lost');
					}
					connection.query('UPDATE usersInChess SET rating = \''+parseInt(parseInt(winnerData[0].rating)+parseInt(32*(act_scr1-exp_scr1)))+'\' WHERE `usersInChess`.`username` = \''+winner+'\';');
					connection.query('UPDATE usersInChess SET rating = \''+parseInt(parseInt(looserData[0].rating)+parseInt(32*(act_scr2-exp_scr2)))+'\' WHERE `usersInChess`.`username` = \''+looser+'\';');
				});
			});
			connection.query('UPDATE games SET active = \'false\',winner = \' ' +winner+'\',looser = \' '+looser+'\' WHERE `games`.`room` = \''+room.name+'\';');
			room.disconnect();
		}
		delete games[room.name];
	}
	else
	{
		if(room.active==true)
		{
			room.active = false;
			delete onlineUsers[winner];
			delete onlineUsers[looser];
			if(winner=='bot')
			{
				console.log("bot won "+socketIdLooser)
				connection.query('SELECT * FROM usersInChess WHERE username = "'+looser+'";', function(err2, looserData, fields2)
				{
					var r1=2000;
					var r2=looserData[0].rating;
					//var act_scr1=1;
					var act_scr2=0;
				  	//var exp_scr_1 =Math.pow(10,(r1/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
 	           	    var exp_scr2=Math.pow(10,(r2/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
					//var exchange = looserData[0].rating / 10;
					if (io.sockets.connected[socketIdLooser]) {
					    io.sockets.connected[socketIdLooser].emit('lost', 'lost');
					}
					connection.query('UPDATE usersInChess SET rating = \''+parseInt(parseInt(looserData[0].rating)+parseInt(32*(act_scr2-exp_scr2)))+'\' WHERE `usersInChess`.`username` = \''+looser+'\';');
				});
			}
			else
			{
				connection.query('SELECT * FROM usersInChess WHERE username = "' + winner + '";', function(err2, winnerData, fields2)
				{
					var r1=winnerData[0].rating;
					var r2=2000;
					var act_scr1=1;
					//var act_scr2=0;
				  	var exp_scr1 =Math.pow(10,(r1/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
 	           	    //var exp_scr_2=Math.pow(10,(r2/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
					//var exchange = winnerData[0].rating / 10;
					if (io.sockets.connected[socketIdWinner]) {
					    io.sockets.connected[socketIdWinner].emit('won', 'won');
					}
					connection.query('UPDATE usersInChess SET rating = \''+parseInt(parseInt(winnerData[0].rating)+parseInt(32*(act_scr1-exp_scr1)))+'\' WHERE `usersInChess`.`username` = \''+winner+'\';');
				});
			}
		}
		//playing against bot
	}
}

/*
Setting front end data to serve and directory from which ejs is read
*/
app.use(express.static(__dirname + '/public'));
app.use(expressLayouts);
app.set('layout');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


 /*
	When a reques is made from (/), the control reaches the following function
 */
app.get( '/', function(req, res)
{
	var client = request.createClient(pingUrl);	//creating a client variable storing the credentials of the user based on the cookie of this request

	if (req.headers.cookie) {
		client.headers['Cookie'] = req.headers.cookie ;
	}

	client.get('/info', function(err, result, body)
	{
		//control reaches here when result is fetched from accounts.sdslabs.co.in
		if(body.loggedin)	//if the user is logged in
		{
			connection.query('SELECT * FROM usersInChess WHERE username = "'+body.username+'"', function(err, rows, fields)
			{
				if(err)
				{
					//a connection error to the database
					res.send('Server Is Busy');
					return;
				}
				if(rows[0] == null)
				{
					connection.query('INSERT INTO `chess`.`usersInChess` (`name`, `username`, `rating`) VALUES (\''+body.name+'\', \''+body.username+'\', '+'1000'+');', function(err, result)
					{
						if(err)
						{
							res.send('Server Is Busy');
							return;
						}
						else
						{
							res.render('arena', {name: body.name.toUpperCase() ,rating: 1000,username : body.username} );
						}
					});
				}
				else
				{
					//the user already exists in the database ==
					res.render('arena', {name: rows[0].name.toUpperCase() ,rating: rows[0].rating, username : rows[0].username});
				}
			});
		}
		else
		{
			//if the user is not logged in.
			res.render('login');
		}
	});
});

/*
	if a reques is made on (/profile/{{name}}).
	Individual profile of  a user
*/
app.get( '/profile/:name', function(req, res) {

	var client = request.createClient(pingUrl);

	if (req.headers.cookie) {
		client.headers['Cookie'] = req.headers.cookie ;
	}

	client.get('/info', function(err, result, body)
	{
		if(body.loggedin)
		{
			connection.query('SELECT * FROM usersInChess WHERE username = "'+body.username+'"', function(err, rows, fields)
			{
				if(err)
				{
					//a connection error to the database
					res.send('Server Is Busy');
					return;
				}
				if(rows[0] == null)
				{
					connection.query('INSERT INTO `chess`.`usersInChess` (`name`, `username`, `rati*/
ng`) VALUES (\''+body.name+'\', \''+body.username+'\', '+'1000'+');', function(err, result)
					{
						if(err)
						{
							res.send('Server Is Busy');
							return;
						}
					});
				}
			});
			connection.query('SELECT * FROM usersInChess WHERE username = "'+req.params.name+'"', function(err, rows, fields)
			{
				if (err)
				{
					//either the user is not found or the is an error connecting to the database
					res.send('Server is busy.');
					return;
				}
				else
				{
					console.log(rows[0]);
					if(rows[0])
						res.render('user',{name: rows[0].name.toUpperCase() , rating: rows[0].rating});
					else
						res.send('user not found');
				}
			});
		}
	});
});

/*
	when the client goes to (/), an ajax request is sent to (/leaderboard) to get the top 10 on the leaderboard
*/
app.get( '/leaderboard', function(req, res)
{
	connection.query('SELECT * FROM usersInChess ORDER BY rating DESC LIMIT 5', function(err, rows, fields)
	{
		if (!err&&rows)
			res.send(rows);
	});
});

/*
	when the client goes to (/), an ajax request is sent to (/activity) to get the recent 10 games played. (sorted by time)
*/

app.get('/activity', function (req, res)
{
	connection.query('SELECT * FROM games ORDER BY time DESC LIMIT 5 ', function(err, rows, fields)
	{
		if (!err&&rows)
			res.send(rows);
	});
});

/*
	When the user requests from (/create/random)
	He wants to play a game with a random user availible right now.
*/
app.get( '/create/random', function(req, res)
{
  	var client = request.createClient(pingUrl);

  	if (req.headers.cookie) {

		client.headers['Cookie'] = req.headers.cookie ;

  	}
	client.get('/info', function(err, result, body)
	{
		if(body.loggedin)
		{
			connection.query('SELECT * FROM usersInChess WHERE username = "'+body.username+'"', function(err, rows, fields)
			{
				if(err)
				{
					//a connection error to the database
					res.send('Server Is Busy');
					return;
				}
				if(rows[0] == null)
				{
					connection.query('INSERT INTO `chess`.`usersInChess` (`name`, `username`, `rating`) VALUES (\''+body.name+'\', \''+body.username+'\', '+'1000'+');', function(err, result)
					{
						if(err)
						{
							res.send('Server Is Busy');
							return;
						}
					});
				}
			});
			if(onlineUsers[body.username] == null)
			{
				onlineUsers[body.username] = true;
				{
					//if the person is logged in we send him the room file .
					res.render('room');
				}
			}
			else
				res.render("busy");
		}
		else
		{
			res.render('login');
		}
	});
});


app.get( '/help', function(req, res)
{
	res.render('help');
});


/*
	When the user requests from (/create/friend)
	He wants to play a game with a friend of his.
*/

app.get( '/create/friend', function(req, res)
{
   	var client = request.createClient(pingUrl);

   	if (req.headers.cookie) {

		client.headers['Cookie'] = req.headers.cookie ;

   	}
	client.get('/info', function(err, result, body)
	{
		if(body.loggedin)
		{
			connection.query('SELECT * FROM usersInChess WHERE username = "'+body.username+'"', function(err, rows, fields)
			{
				if(err)
				{
					//a connection error to the database
					res.send('Server Is Busy');
					return;
				}
				if(rows[0] == null)
				{
					connection.query('INSERT INTO `chess`.`usersInChess` (`name`, `username`, `rating`) VALUES (\''+body.name+'\', \''+body.username+'\', '+'1000'+');', function(err, result)
					{
						if(err)
						{
							res.send('Server Is Busy');
							return;
						}
					});
				}
			});
			if(onlineUsers[body.username] == null)
			{
				onlineUsers[body.username] = true;
				{
					res.render('room');
				}
			}
			else
				res.render("busy");
		}
		else
		{
			res.render('login');
		}
	});
});
/*
	When the user requests from (/create/bot)
	He wants to play a game with a bot
*/

app.get( '/create/bot', function(req, res)
{
   	var client = request.createClient(pingUrl);

   	if (req.headers.cookie) {

		client.headers['Cookie'] = req.headers.cookie ;

   	}
	client.get('/info', function(err, result, body)
	{
		if(body.loggedin)
		{
			connection.query('SELECT * FROM usersInChess WHERE username = "'+body.username+'"', function(err, rows, fields)
			{
				if(err)
				{
					//a connection error to the database
					res.send('Server Is Busy');
					return;
				}
				if(rows[0] == null)
				{
					connection.query('INSERT INTO `chess`.`usersInChess` (`name`, `username`, `rating`) VALUES (\''+body.name+'\', \''+body.username+'\', '+'1000'+');', function(err, result)
					{
						if(err)
						{
							res.send('Server Is Busy');
							return;
						}
					});
				}
			});
			if(onlineUsers[body.username] == null)
			{
				onlineUsers[body.username] = true;
				{
					res.render('room');
				}
			}
			else
				res.render("busy");
		}
		else
		{
			res.render('login');
		}
	});
});

/*
	When the user requests from (/room/:{{room}})
	This user wants to join a room that his friend created for him.{{room}} is the id of the room.
*/
app.get('/room/:room', function (req, res)
{
  	var client = request.createClient(pingUrl);

  	if (req.headers.cookie) {

		client.headers['Cookie'] = req.headers.cookie ;

  	}
	client.get('/info', function(err, result, body)
	{
		if(body.loggedin)
		{
			connection.query('SELECT * FROM usersInChess WHERE username = "'+body.username+'"', function(err, rows, fields)
			{
				if(err)
				{
					//a connection error to the database
					res.send('Server Is Busy');
					return;
				}
				if(rows[0] == null)
				{
					connection.query('INSERT INTO `chess`.`usersInChess` (`name`, `username`, `rating`) VALUES (\''+body.name+'\', \''+body.username+'\', '+'1000'+');', function(err, result)
					{
						if(err)
						{
							res.send('Server Is Busy');
							return;
						}
					});
				}
			});
			if(onlineUsers[body.username] == null)
			{
				if(games[req.params.room] != undefined)
				{
					//if the games array contains the id of the room then the room is active and we send the chess data to this user and to begin their game
					onlineUsers[body.username] = true;
					res.render('room');
				}
				else
				{
					/*
						If the control reached over here then either the user was trying to access a game that was already created or his room id is wrong
					*/
					connection.query('SELECT * FROM `games` WHERE `room` = \''+req.params.room+'\'', function (error, rows, fields)
					{
						if(rows[0] == undefined || error)
						{
							//the room is not present in the database hence a game has never been played on this particular room id
							res.send('This room doesnt exist');
						}
						else
						{
							//the game is finished and we simply serve the name of the winner and looser
							console.log("a"+rows[0].winner);
							res.render('gameCompleted',{winner :rows[0].winner , looser : rows[0].looser})
						//	res.send("winner is "+rows[0].winner +" and looser is "+rows[0].looser);
						}
					});
				}
			}
			else
				res.render("busy");
		}
		else
		{
			res.render('login');
		}
	});
});

/*
	The most important part of the server
	The role is to detect a connection when we have sent the room.ejs file to the client
	This is an inbuilt function in socket.io and control reaches here when a connection has been made in socket.io client
*/
io.on('connection', function(socket)
{
	var client = request.createClient(pingUrl);
	client.headers['Cookie'] = socket.handshake.headers.cookie;
	client.get('/info', function(err, result, body)
	{
		/*
			if room has been served to a client then he/she is bound to be logged in.
			The following line still makes sure that he/she is infact logged in
		*/
		if(!body.loggedin)
			return;
		var myRoom = 'none';	// a local variable to store the id of the room in which this particular user is
		var room;
		if(socket.handshake.headers.referer.split('/')[4] == 'random')
		{
			/*
				the user requested from (/create/random)
			*/
			if(randomGame == 'none')
			{
				myRoom = socket.id;
				games[socket.id] = body.username;
		  		room = Room.allocateFirst(socket,socket.id,body.username);
				randomGame = socket.id;
			}
			else
			{
				{
					room = Room.allocateSecond(socket,randomGame,body.username);
					myRoom = randomGame;
					if(room)
					{
						connection.query('INSERT INTO `chess`.`games` (`room`, `active`, `playerA`, `playerB`, `winner`, `looser`) VALUES (\''+randomGame+'\', \''+'active'+'\', \''+games[randomGame]+'\', \''+body.username+'\',\'none\',\'none\');', function(err, result)
						{
						});
					}
					randomGame = 'none';
				}
			}

		    socket.on('press', function(index)
			{
				var checkMate = room.action(index[0], index[1], socket);
			    if(checkMate == 'checkmate')
			    {
			    	if(room.playersHandle[0] == body.username)
			    		gameHandler.end(room.playersHandle[0],room.playersHandle[1],room,room.players[0],room.players[1],false);
			    	else
			    		gameHandler.end(room.playersHandle[1],room.playersHandle[0],room,room.players[1],room.players[0],false);
			    }
		    });
		}
		else if (socket.handshake.headers.referer.split('/')[4] == 'bot')
		{
			/*
				the user requested from (/create/bot)
			*/
			myRoom = socket.id;
			games[socket.id] = body.username;
	  		room = Room.allocateFirst(socket,socket.id,body.username);
	  		Room.allocateBot(socket.id);
	  		var properties = [0,"False","False","False","False",0,0];
	  		socket.on('press', function(index)
		    {
				var checkMate = room.action(index[0], index[1], socket);
			    if(checkMate == 'checkmate')
			    {
			    	gameHandler.end(room.playersHandle[0],'bot',room,room.players[0],'bot',true);
			    	/*
			    		Player won
			    	*/
			    }
			    else if (checkMate == 'madeMove')
			    {
			    	/*
			    		The user successfully made a move, now the bot needs to make a move
			    	*/
					var input = "";
					for(var i1 = 0;i1<8;i1++)
					{
						for(var j1 = 0;j1<8;j1++)
							input = input.concat(room.game.board[i1][j1]+"\n");
					}
					for(i=0;i<7;i++)
						input = input.concat(properties[i]+"\n");
					pythonProcess = spawn('python', ['bot.py', 'someOptions']);
					pythonProcess.stdin.write(input);
					//pythonProcess.stdin.write(' mv = "a2a3"');
					pythonProcess.stdout.on('data', function(move) {
						console.log(move);
						move = move.toString();
						var fromx = move.charCodeAt(0) - 97;
						var fromy = move.charCodeAt(1) - 49;
						var tox = move.charCodeAt(2) - 97;
						var toy = move.charCodeAt(3) - 49;
						move = move.split('\n');
						for(i=0;i<7;i++)
							properties[i] = move[i+1];
						properties[0] = 0;
						fromy = 7 - fromy;
						toy = 7 - toy;
				    	var checkMate = room.action(fromx, fromy, 'bot');
				    	checkMate = room.action(tox, toy, 'bot');
				    	if(checkMate!='madeMove'&&checkMate!='checkmate')
				    	{
				    		console.log("bot failed ");
				    		room.action(fromx, fromy, 'bot'); // cancel the first move made by the bot
				    		room.action(tox, toy, 'bot'); // cancel the second move made by the bot (if it is valid enough)
				    		var random_move = room.bot(1);
				    		console.log("random move : "+random_move);
				    		room.action(random_move[0], random_move[1], 'bot');
				    		checkmate = room.action(random_move[2], random_move[3], 'bot');
				    		//make a random move, the bot has failed
				    	}
				    	if(checkMate == 'checkmate')
					    {
			    			gameHandler.end('bot',room.playersHandle[0],room,'bot',room.players[0],true);
					    	/*
					    		Bot Won
					    	*/
					    	console.log("bot won");
					    }
					});
					pythonProcess.stderr.on('data', function (data) {
					  console.log('stderr: ' + data);


					});
					pythonProcess.on('close', function (code) {
					   console.log('child process exited with code ' + code);
					});
			    }
		    });
			socket.on('unload',function(msg){
    	   		if(room.active==true)
			    {
			    	gameHandler.end('bot',room.playersHandle[0],room,'bot',room.players[0],true);
					room.disconnect();
			   	}
			   	delete onlineUsers[body.username];
			    delete games[myRoom];
	   		});
	   		socket.on('disconnect',function(msg){
	    	    if(room.active==true)
			    {
			    	gameHandler.end('bot',room.playersHandle[0],room,'bot',room.players[0],true);
					room.disconnect();
			   	}
			   	delete onlineUsers[body.username];
			    delete games[myRoom];
	   		});
			console.log("Game began for  "+room.name+"between "+room.playersHandle[0]+"and"+room.playersHandle[1]);
			io.to(room.name).emit('white',room.playersHandle[0]);
			io.to(room.name).emit('black',room.playersHandle[1]);
			room.io = io;
			room.start();

			return; /// dont need the logic below now
		}
		else if(socket.handshake.headers.referer.split('/')[3] == 'room')
		{
			/*
				the user requested from (/room/:room)
			*/

			//Spectator/2nd player
			if(games[socket.handshake.headers.referer.split('/')[4]] == undefined)
			{
				console.log("---shouldn't be here");
				delete onlineUsers[body.username];
				console.log(socket.handshake.headers.referer);
				return;
			}
			else if(Room.rooms[socket.handshake.headers.referer.split('/')[4]].active)
			{
				room = Room.allocateSpectator(socket,socket.handshake.headers.referer.split('/')[4]);
				socket.emit("players",[room.playersHandle[0],room.playersHandle[1]]);
				console.log("spectating");
		    	delete onlineUsers[body.username];
				return;
			}
			else if(games[socket.handshake.headers.referer.split('/')[4]] != null)
			{
				myRoom = socket.handshake.headers.referer.split('/')[4];
				room = Room.allocateSecond(socket,socket.handshake.headers.referer.split('/')[4],body.username);

				if(room)
				{
					connection.query('INSERT INTO `chess`.`games` (`room`, `active`, `playerA`, `playerB`, `winner`, `looser`) VALUES (\''+socket.handshake.headers.referer.split('/')[4]+'\', \''+'active'+'\', \''+games[socket.handshake.headers.referer.split('/')[4]]+'\', \''+body.username+'\',\'none\',\'none\');', function(err, result)
					{
						console.log("made db entry");
					});
				}
			    socket.on('press', function(index)
			    {
					var checkMate = room.action(index[0], index[1], socket);
				    if(checkMate == 'checkmate')
				    {
				    	if(room.playersHandle[0] == body.username)
				    		gameHandler.end(room.playersHandle[0],room.playersHandle[1],room,room.players[0],room.players[1],false);
				    	else
				    		gameHandler.end(room.playersHandle[1],room.playersHandle[0],room,room.players[1],room.players[0],false);
				    }
			    });
			}
			else
				return;
		}
		else
		{
			/*
				the user requested from (/create/friend)
			*/
			myRoom = socket.id;
			games[socket.id] = body.username;
	  		room = Room.allocateFirst(socket,socket.id,body.username);
	  		socket.emit('alertLink',baseUrl+"/room/"+socket.id);
		    socket.on('press', function(index)
		    {
				var checkMate = room.action(index[0], index[1], socket);
			    if(checkMate == 'checkmate')
			    {
			    	if(room.playersHandle[0] == body.username)
			    		gameHandler.end(room.playersHandle[0],room.playersHandle[1],room,room.players[0],room.players[1],false);
			    	else
			    		gameHandler.end(room.playersHandle[1],room.playersHandle[0],room,room.players[1],room.players[0],false);

			    }
		    });
		}
	    if(!room)
	    	return;
	    socket.on('unload',function(msg){
	    	console.log(msg);
	    	if (randomGame == socket.id)
				randomGame = 'none';
    	    if(room.active==true)
		    {
		      	if(room.playersHandle[0] == body.username)
				{
					gameHandler.end(room.playersHandle[1],room.playersHandle[0],room,room.players[1],room.players[0],false);
				}
				else
				{
					gameHandler.end(room.playersHandle[0],room.playersHandle[1],room,room.players[0],room.players[1],false);
				}
				room.disconnect();
		   	}
		   	delete onlineUsers[body.username];
		    delete games[myRoom];
		    console.log("deleted the room "+myRoom);

	    })
		socket.on('disconnect',function()
    	{
			if (randomGame == socket.id)
				randomGame = 'none';
    	    if(room.active==true)
		    {
		      	if(room.playersHandle[0] == body.username)
				{
					gameHandler.end(room.playersHandle[1],room.playersHandle[0],room,room.players[1],room.players[0],false);
				}
				else
				{
					gameHandler.end(room.playersHandle[0],room.playersHandle[1],room,room.players[0],room.players[1],false);
				}
				room.disconnect();
		   	}
		   	delete onlineUsers[body.username];
		    delete games[myRoom];
		    console.log("deleted the room "+myRoom);
	    });
		console.log("Player# "+socket.id+" name "+body.name+" added to room "+room.name+" its socket room " +socket.room);
		if(room.people==2)
		{
			if (io.sockets.connected[room.players[1]])
				io.sockets.connected[room.players[1]].emit('reverse');
			console.log("Game began for  "+room.name+"between "+room.playersHandle[0]+"and"+room.playersHandle[1]);
			io.to(room.name).emit('white',room.playersHandle[0]);
			io.to(room.name).emit('black',room.playersHandle[1]);
			room.io = io;
			room.start();
		}
	});
});

app.use(function(req, res) {
    res.status(400);
    res.render('errors');
 });
