//core modules
const path = require('path');
// public modules
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('express-handlebars');
const session = require('express-session');
const morgan = require('morgan');
// custom modules
const mqttService = require(path.resolve(__dirname, './lib/mqtt/mqttService.js'));
const router = require(path.join(__dirname, '/routes/index'));

app = express();
app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts' }));
app.set('views', path.join(__dirname + '/views'));
app.set('view engine', 'hbs');
app.use(morgan('dev'));

require('dotenv').config();

app.use(session({
  secret: process.env.SESSION_SECRET || "XXXXX",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);
app.set('port', (process.env.PORT || 3000));
app.listen(app.get('port'), () => {
  console.log(`Server is running on port ${app.get('port')}`);
});

module.exports = app;