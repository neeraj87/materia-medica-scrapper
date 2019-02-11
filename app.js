var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http');
var winston = require('winston');

const index = require('./routes/index');
const search = require('./routes/search');

var app = express();

app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));

app.set('port', process.env.PORT || 8000);
app.set('views', path.join(__dirname, 'views'));
app.set('partials', path.join(__dirname, 'views/partials'));
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use('/', index);
app.use('/search', search);

process.on('uncaughtException', function (err) {
    winston.log('info', '-------------- UNCAUGHT EXCEPTION: ' + err);
    winston.log('info', '------------- ERROR STACK -------------');
    winston.log('info', err.stack);
    winston.log('info', '---------------------------------------');
});

http.createServer(app).listen(app.get('port'), function () {
    winston.log('info', 'The server has started');
});

module.exports = app;