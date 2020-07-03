var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = (db) => {
  // //REGISTER USERS
  router.get('/', function (req, res, next) {
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

  router.post('/', function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      // Store hash in your password DB.
      if (err) return res.status(500).json({
        error: true,
        message: err
      })


      let sql = 'INSERT INTO users(email, password, firstname, lastname, position, typejob, role) VALUES ($1, $2, $3, $4, $5, $6, $7)'
      let values = [req.body.email, hash, req.body.firstname, req.body.lastname, req.body.position, req.body.typejob, req.body.role]
      db.query(sql, values, (err) => {
        console.log(values)
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        res.status(201).json({
          error: false,
          message: 'ADD COMPLETE'
        });
      })
    });
  });

  router.get('/:id', (req, res) => {
    let id = req.params.id
    let sql = `SELECT * FROM users WHERE userid = ${id}`
    db.query(sql, (err, data) => {
      if (err) return res.status(500).json({
        error: err,
        message: err
      })
      res.send(data.rows)
    })
  })

  return router;
}