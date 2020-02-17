'use strict';

const { join } = require('path');
const express = require('express');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const serveFavicon = require('serve-favicon');

//Inserted by me
const User = require('./models/user');
const mongoose = require('mongoose');
const expressSession = require('express-session');
const ConnectMongo = require('connect-mongo');

const mongoStore = ConnectMongo(expressSession);
const hbs = require('hbs');
//till here
const indexRouter = require('./routes/index');

const app = express();

// Setup view engine
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + join('views/partials'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(serveFavicon(join(__dirname, 'public/images', 'favicon.ico')));
app.use(express.static(join(__dirname, 'public')));
app.use(
  sassMiddleware({
    src: join(__dirname, 'public'),
    dest: join(__dirname, 'public'),
    outputStyle: process.env.NODE_ENV === 'development' ? 'nested' : 'compressed',
    force: process.env.NODE_ENV === 'development',
    sourceMap: true
  })
);
//inserted by me

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 15 * 24 * 60 * 60 * 1000
    },
    store: new mongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 60 * 60
    })
  })
);

const deserializeUser = (req, res, next) => {
  const userId = req.session.userId;
  if (userId) {
    User.findById(userId)
      .then(user => {
        if (!user) {
          delete req.session.userId;
        } else {
          req.user = user;
        }
        next();
      })
      .catch(error => {
        next(error);
      });
  } else {
    next();
  }
};
const passUserToViews = (req, res, next) => {
  res.locals.user = req.user;
  next();
};
//till here
app.use(deserializeUser);
app.use(passUserToViews);
app.use('/', indexRouter);

// Catch missing routes and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Catch all error handler
app.use((error, req, res, next) => {
  // Set error information, with stack only available in development
  res.locals.message = error.message;
  res.locals.error = req.app.get('env') === 'development' ? error : {};

  res.status(error.status || 500);
  res.render('error');
});

module.exports = app;
