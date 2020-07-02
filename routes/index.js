var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;


/* GET home page. */
module.exports = (db) => {

  router.get('/', function (req, res, next) {
    res.render('login', { loginInfo: req.flash('loginInfo')});
  });

  router.post('/login', (req, res) => {
    db.query('SELECT * FROM users WHERE email = $1', [req.body.email], (err, data) => {
      // console.log(data.rows)
      if (err) {
        req.flash('loginInfo', 'Terjadi Kesalahan, coba lagi beberapa saat kemudian.')
        return res.redirect('/')
      }
      if (data.rows.length == 0) {
        req.flash('loginInfo', 'Email atau Password salah !')
        return res.redirect('/')
      }



      bcrypt.compare(req.body.password, data.rows[0].password, function (err, result) {
        if (data.rows.length == 0) {
          req.flash('loginInfo', 'Terjadi Kesalahan, coba lagi beberapa saat kemudian.')
          return res.redirect('/')
        }
        if (result) {
          req.session.user = data.rows[0]
          res.redirect('/projects')
        } else {
          req.flash('loginInfo', 'Email atau Password salah !')
          res.redirect('/')
        }
      })
    });
  })

  router.get('/logout', (req, res) => {
    req.session.destroy(function (err) {
      if (err) return res.send(err)
    })
    res.redirect('/')
  })

  return router;
}
