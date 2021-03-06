var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session')
var flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const { Pool } = require('pg')

// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'pmsdb',
//   password: '112233',
//   port: 5432,
// })

// database heroku
const pool = new Pool({
  user: 'cowlhsoxxvxwpk',
  host: 'ec2-50-19-26-235.compute-1.amazonaws.com',
  database: 'db3eloqc3mgh6v',
  password: '0e2188f3e0b1893711a70b75cbd73ba4ce619bb8d061468f631565cfde8543d7',
  port: 5432,
})

var indexRouter = require('./routes/index')(pool);
var projectsRouter = require('./routes/projects')(pool);
var profileRouter = require('./routes/profile')(pool);
var usersRouter = require('./routes/users')(pool);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'webpemula'
}))
app.use(flash());

app.use('/', indexRouter);
app.use('/projects', projectsRouter)
app.use('/profile', profileRouter)
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
