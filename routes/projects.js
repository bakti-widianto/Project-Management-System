var express = require('express');
var router = express.Router();
const check = require('../check/check');

let checkOption = {
  id: true,
  name: true,
  member: true
}

module.exports = (db) => {
  router.get('/',  function (req, res, next) {
    // Get page project
    let link = 'projects'
    let user = req.session.user
    let getData = `SELECT count(id) AS total from (SELECT DISTINCT projects.projectid as id FROM projects 
      LEFT JOIN members ON members.projectid = projects.projectid 
      LEFT JOIN users ON users.userid = members.userid `

    //filter logic
    let result = []

    if (req.query.checkId && req.query.projectId) {
      result.push(`projects.projectid=${req.query.projectId}`)
    }

    if (req.query.checkName && req.query.projectName) {
      result.push(`projects.name ILIKE '%${req.query.projectName}%'`)
    }

    if (req.query.checkMember && req.query.member) {
      result.push(`members.userid=${req.query.member}`)
    }

    if (result.length > 0) {
      getData += ` WHERE ${result.join(" AND ")}`
    }

    getData += `) AS projectname`;
    //End filter logic

    // console.log(getData);

    db.query(getData, (err, totalData) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      //start pagenation logic
      const url = req.url == '/' ? '/?page=1' : req.url
      const page = req.query.page || 1
      const limit = 3
      const offset = (page - 1) * limit
      const total = totalData.rows[0].total
      const pages = Math.ceil(total / limit);
      let getData = `SELECT DISTINCT projects.projectid, projects.name, 
      string_agg(users.firstname || ' ' || users.lastname, ', ') as member FROM projects 
      LEFT JOIN members ON members.projectid = projects.projectid
      LEFT JOIN users ON users.userid = members.userid `
      if (result.length > 0) {
        getData += ` WHERE ${result.join(" AND ")}`
      }
      getData += ` GROUP BY projects.projectid ORDER BY projectid ASC LIMIT ${limit} OFFSET ${offset}`;
      // end pagenation logic


      db.query(getData, (err, dataProject) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        let getUser = `SELECT userid, concat(firstname,' ',lastname) as fullname FROM users;`

        db.query(getUser, (err, dataUsers) => {
          if (err) return res.status(500).json({
            error: true,
            message: err
          })
          res.render('projects/index', {
            url,
            user,
            link,
            page,
            pages,
            result: dataProject.rows,
            users: dataUsers.rows,
            option: checkOption
          });
        })
      })
    })
  });

  router.post('/option',  (req, res) => {
    checkOption.id = req.body.checkid;
    checkOption.name = req.body.checkname;
    checkOption.member = req.body.checkmember;
    res.redirect('/projects')
  })

  //get data for form add projects
  router.get('/add', (req, res) => {
    let link = 'projects'
    let sql = `SELECT DISTINCT (userid), CONCAT(firstname, ' ', lastname) AS fullname FROM users ORDER BY fullname`
    db.query(sql, (err, data) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      res.render('projects/add', {
        link,
        data: data.rows
      })
    })
  })

  //post data project
  router.post('/add',  (req, res) => {
    const { projectname, members } = req.body
    if (projectname && members) {
      const insertProject = `INSERT INTO projects (name) VALUES ('${projectname}')`
      db.query(insertProject, (err) => {
        if (err) return res.status(500).json(err)
        let selectMaxId = `SELECT MAX (projectid) FROM projects`
        db.query(selectMaxId, (err, data) => {
          if (err) return res.status(500).json(err)

          let idMax = data.rows[0].max;
          let insertMambers = `INSERT INTO members (userid, projectid) VALUES`
          if (typeof (members) == 'string') {
            insertMambers += `(${members}, ${idMax})`
          } else {
            let member = members.map(item => {
              return `(${item}, ${idMax})`
            }).join()
            insertMambers += `${member}`
          }
          db.query(insertMambers, (err) => {
            if (err) return res.status(500).json({
              error: true,
              message: err
            })
            res.redirect('/projects')
          })
        })
      })
    } else {
      return res.redirect('/projects/add')
    }
  })


  //get data form edit
  router.get('/edit/:projectid', (req, res) => {
    let projectid = req.params.projectid
    let link = 'projects'
    let sql = `SELECT projects.name FROM projects WHERE projects.projectid = ${projectid}`

    let sqlMember = `SELECT DISTINCT (userid), CONCAT(firstname, ' ', lastname) AS fullname 
    FROM users ORDER BY fullname`

    db.query(sql, (err, data) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      let nameProject = data.rows[0]

      db.query(sqlMember, (err, member) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        let members = member.rows;
        res.render('projects/edit', {
          nameProject,
          members,
          link,
        })
      })
    })
  })










  // router.get('/:projectid/overview', check.isLoggedIn, function (req, res, next) {

  // });

  // router.get('/:projectid/activity', check.isLoggedIn, function (req, res, next) {

  // });

  // router.get('/:projectid/member', check.isLoggedIn, function (req, res, next) {

  // });

  // router.get('/:projectid/member', check.isLoggedIn, function (req, res, next) {

  // });

  // router.post('/:projectid/member', check.isLoggedIn, function (req, res, next) {

  // });

  // router.get('/:projectid/member/:id', check.isLoggedIn, function (req, res, next) {

  // });

  // router.post('/:projectid/member/:id', check.isLoggedIn, function (req, res, next) {

  // });



  return router;
}
