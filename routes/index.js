var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

/* GET home page. */
module.exports = (db) => {

  // //REGISTER USERS
  router.get('/users', function (req, res, next) {
    db.query('select * from users', (err, data) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      res.status(200).json({
        error: false,
        data: data.rows
      })
    })
  });

  // router.post('/users', function (req, res, next) {
  //   bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
  //     // Store hash in your password DB.
  //     if(err) return res.status(500).json({
  //       error: true,
  //       message: err
  //     })

  //     let sql = 'INSERT INTO users(email, password, firstname, lastname) VALUES ($1, $2, $3, $4)'
  //     let values = [req.body.email, hash, req.body.firstname, req.body.lastname]
  //     db.query(sql, values, (err) => {
  //       if (err) return res.status(500).json({
  //         error: true,
  //         message: err
  //       })
  //       res.status(201).json({
  //         error: false,
  //         message: 'ADD COMPLETE'
  //       });
  //     })
  //   });
  // });

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
          res.redirect('/home')
        } else {
          res.redirect('/')
        }
      })
    });
  })

  //HOME
  router.get('/home', function (req, res, next) {
    res.render('index');
  });


  return router;
}
