'use strict';

const { Router } = require('express');
const router = Router();

const bcryptjs = require('bcryptjs');

const User = require('./../models/user');

const routeGuard = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    next(new Error('USER_NOT_AUTHORIZED'));
  }
};
// router.use(routeGuard);

router.get('/', (req, res, next) => {
  res.render('index', { title: 'Hello World!' });
});

router.get('/sign-in', (req, res, next) => {
  res.render('authentication/sign-in');
});

router.post('/sign-in', (req, res, next) => {
  const { email, password } = req.body;

  let user;
  User.findOne({ email })
    .then(document => {
      if (!document) {
        next(new Error('USER_NOT_FOUND'));
      } else {
        user = document;
        return bcryptjs.compare(password, document.passwordHash);
      }
    })
    .then(match => {
      if (match) {
        req.session.userId = user._id;
        res.redirect('/');
      } else {
        next(new Error('USER_PASSWORD_WRONG'));
      }
    })
    .catch(error => {
      next(error);
    });
});

router.get('/sign-up', (req, res, next) => {
  res.render('authentication/sign-up');
});

router.post('/sign-up', (req, res, next) => {
  const { email, password, name } = req.body;

  bcryptjs
    .hash(password, 10)
    .then(hashPlusSalt => {
      return User.create({
        email,
        name,
        passwordHash: hashPlusSalt
      });
    })
    .then(user => {
      req.session.userId = user._id;
      res.redirect('/');
    })
    .catch(error => {
      next(error);
    });
});

router.post('/sign-out', (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
});

router.get('/private', routeGuard, (req, res, next) => {
  res.render('private');
});
router.get('/user', routeGuard, (req, res, next) => {
  res.render('authentication/user');
});
router.get('/editProfile', routeGuard, (req, res, next) => {
  res.render('authentication/editProfile');
});
router.post('/editProfile', routeGuard, (req, res, next) => {
  const { email, password, name } = req.body;
  let user;
  User.findOne({ email })
    .then(document => {
      if (!document) {
        next(new Error('USER_NOT_FOUND'));
      } else {
        user = document;
        return bcryptjs.compare(password, document.passwordHash);
      }
    })
    .then(match => {
      if (match) {
        User.findByIdAndUpdate(
          {
            _id: user._id
          },
          {
            email,
            name,
            passwordHash: hashPlusSalt
          }
        );
      } else {
        next(new Error('USER_PASSWORD_WRONG'));
      }
    })
    .then(userUpdated => {
      req.session.userId = userUpdated._id;
      res.redirect('/');
    })
    .catch(error => {
      next(error);
    });
});

module.exports = router;
