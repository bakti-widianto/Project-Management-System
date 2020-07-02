var express = require('express');
var router = express.Router();

const isLoggedIn = (req, res, next) =>{
  if(req.session.user){
    next();
  }else{
    res.redirect('/')
  }
}

module.exports = (db) => {
  router.get('/', isLoggedIn, function (req, res, next) {
    let user = req.session.user
    res.render('projects',{user});
  });

  return router;
}
