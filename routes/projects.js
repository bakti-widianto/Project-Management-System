var express = require('express');
var router = express.Router();
const check = require('../check/check');

module.exports = (db) => {
  router.get('/', check.isLoggedIn, function (req, res, next) {
    let user = req.session.user
    let link = 'projects'
    res.render('projects/dasrboardProjects',{user, link});
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
