var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');

var app = express();
var port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));



// app.get('/p/*', function (req, res){
//     console.log("hello");
//     var options = {
//         root: __dirname + '/public/'
//     }
//     res.sendFile("index.html",options, function(err){
//         if(err){
//             console.log(err);
//             res.status(err.status).end();
//         }
//     });
// });
app.listen(port);

console.log('Sever is now listening on port ' + port);