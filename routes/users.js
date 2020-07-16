var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

let checkOption = {
  Id: true,
  Name: true,
  Position: true,
  Email: true,
  Type: true,
  Role: true
}

module.exports = (db) => {
  // //REGISTER USERS
  router.get('/', function (req, res, next) {
    let link = 'users'
    let { checkId, id, checkName, name, checkEmail, email, checkPosition, position, checkType, type } = req.query
    let result = []
    let search = ""

    if (checkId && id) {
      result.push(`userid = ${parseInt(id)}`)
    }

    if (checkName && name) {
      result.push(`CONCAT(firstname,' ',lastname) ILIKE '%${name}%'`)
    }

    if (checkEmail && email) {
      result.push(`email= '${email}'`)
    }

    if (checkPosition && position) {
      result.push(`position= '${position}'`)
    }

    if (checkType && type) {
      result.push(`typeJob= '${type}'`)
    }

    if (result.length > 0) {
      search += ` WHERE ${result.join(' AND ')}`
    }

    let sqlUser = `SELECT COUNT (userid) AS total from users ${search}`


    db.query(sqlUser, (err, totalUsers) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      let total = totalUsers.rows[0].total

      const url = req.url = '/' ? `/?page=1` : req.url
      const page = req.query.page || 1
      const limit = 3;
      const offset = (page - 1) * limit
      let pages = Math.ceil(total / limit)
      let sqlData = `SELECT userid, email, CONCAT(firstname,' ',lastname) AS fullname, position, typejob, role
      FROM users ${search} ORDER BY userid ASC LIMIT ${limit} OFFSET ${offset}`

      db.query(sqlData, (err, data) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        let users = data.rows
        res.render('users/list', {
          // res.json({
          link,
          users,
          pages,
          page,
          url,
          option: checkOption
        })
      })
    })
  });

  router.post('/', function (req, res) {
    checkOption.Id = req.body.cId
    checkOption.Name = req.body.cName
    checkOption.Position = req.body.cPosition
    checkOption.Email = req.body.cEmail
    checkOption.Type = req.body.cType
    checkOption.Role = req.body.cRole

    res.redirect('/users')
  })

  router.get('/add', (req, res) => {
    const link = 'users';
    res.render('users/add', {
      link,
      login: req.session.user
    })
  })












  router.post('/add', function (req, res, next) {
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