var express = require('express');
var router = express.Router();
const check = require('../check/check');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = (db) => {
  router.get('/', check.isLoggedIn, (req, res, next) => {
    let link = 'profile'
    let user = req.session.user
    let sql = `SELECT * FROM users WHERE email = '${user.email}'`
    db.query(sql, (err, data) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      res.render('profile/listProfile', {
        link,
        user,
        data: data.rows[0]
      })
    })
  });

  router.post('/', check.isLoggedIn, (req, res) => {
    let user = req.session.user

    const { password, firstname, lastname, position, typejob } = req.body

    bcrypt.hash(password, saltRounds, function (err, hash) {
      // Store hash in your password DB.
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      let sql = `UPDATE users SET password = '${hash}', firstname= '${firstname}', lastname= '${lastname}', position= '${position}', typejob= '${typejob}' WHERE email = '${user.email}'`
      db.query(sql, (err) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        res.redirect('/profile')
      })
    })

  })

  return router;
}