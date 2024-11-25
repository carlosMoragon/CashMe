var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

// Os propongo estas rutas y que el resto estén derivadas en los archivos de rutas

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var profileRouter = require('./routes/profile');
var loginRouter = require('./routes/login');
var blogRouter = require('./routes/financeBlog');
var aboutusRouter = require('./routes/aboutus');
var servicesRouter = require('./routes/services');
var adminBlogRouter = require('./routes/adminBlog');
var contactRouter = require('./routes/contact');
//var indexRouter = require('./routes/admin');
//var indexRouter = require('./routes/home');


// Base de Datos
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../cashme');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sesión del usuario
app.use(session({
  secret: 'CLAVE_SECRETA', 
  resave: false,
  saveUninitialized: true
}));

app.use('/', indexRouter);
app.use('/profile', checkAuthenticated, profileRouter);
app.use('/login', loginRouter)
app.use('/users', usersRouter);
app.use('/blog', blogRouter);
app.use('/aboutus', aboutusRouter);
app.use('/services', servicesRouter);
app.use('/adminBlog', adminBlogRouter); // HAY QUE METERLO EN ADMIN
app.use('/contact', contactRouter);



// Middleware para verificar si el usuario está logueado
function checkAuthenticated(req, res, next) {
  console.log(req.session); 
  if (!req.session.email) {  
    return res.redirect('/login'); 
  }
  next();  
}

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("==> Error: ", err) 
    }
    console.log("==> The user has log out")
    res.redirect('/'); 
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;