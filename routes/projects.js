var express = require('express');
var router = express.Router();
const check = require('../check/check');

module.exports = (db) => {
  router.get('/', check.isLoggedIn, function (req, res, next) {
    let user = req.session.user
    res.render('projects',{user});
  });

  router.get('/:projectid/overview', check.isLoggedIn, function (req, res, next) {
    
  });

  router.get('/:projectid/activity', check.isLoggedIn, function (req, res, next) {
    
  });

  router.get('/:projectid/member', check.isLoggedIn, function (req, res, next) {
    
  });

  router.get('/:projectid/member', check.isLoggedIn, function (req, res, next) {
    
  });

  router.post('/:projectid/member', check.isLoggedIn, function (req, res, next) {
    
  });

  router.get('/:projectid/member/:id', check.isLoggedIn, function (req, res, next) {
    
  });

  router.post('/:projectid/member/:id', check.isLoggedIn, function (req, res, next) {
    
  });



  return router;
}
