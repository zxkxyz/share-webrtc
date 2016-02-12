// var http = require('http');

// var nStatic = require('node-static');

// var fileServer = new nStatic.Server('./public');

// http.createServer(function (req, res) {
    
//     fileServer.serve(req, res);

// }).listen(5000);





var express = require('express');
// var jade = require('jade');
var bodyParser = require('body-parser');
var path = require('path');


var app = express();
var port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));
// app.set('views', __dirname + '/client');
// app.set('view engine', 'jade');




// app.get('/', function (req, res){
// 	//res.render('index');
// 	res.send('hello')
// })
//Serves all the request which includes /images in the url from Images folder
//app.use('/images', express.static(__dirname + '/Images'));

app.listen(port);

console.log('Sever is now listening on port '+ port);