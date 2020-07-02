var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;


/* GET home page. */
module.exports = (db) => {

  router.get('/', function (req, res, next) {
    res.render('login');
  });

  router.post('/login', (req, res) => {
    db.query('SELECT * FROM users WHERE email = $1', [req.body.email], (err, data) => {
      // console.log(data.rows)
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      if (data.rows.length == 0) return res.send('data tidak di temukan')

      bcrypt.compare(req.body.password, data.rows[0].password, function (err, result) {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        if (result) {
          req.session.user = data.rows[0]
          res.redirect('/projects')
        } else {
          res.redirect('/')
        }
      })
    });
  })

  router.get('/logout', (req, res) => {
    req.session.destroy(function (err) {
      if(err) return res.send(err)
    })
    res.redirect('/')
  })

  return router;
}
