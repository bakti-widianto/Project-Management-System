var express = require('express');
var router = express.Router();
const check = require('../check/check');

let checkOption = {
  id: true,
  name: true,
  member: true
}

module.exports = (db) => {
  router.get('/', check.isLoggedIn, function (req, res, next) {
    // Get page project
    let link = 'projects'
    let user = req.session.user
    let getData = `SELECT count(id) AS total from (SELECT DISTINCT projects.projectid as id FROM projects LEFT JOIN members ON members.projectid = projects.projectid LEFT JOIN users ON users.userid = members.userid `

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
      const page = req.query.page || 1
      const limit = 3
      const offset = (page - 1) * limit
      const total = totalData.rows[0].total
      const pages = Math.ceil(total / limit);
      let getData = `SELECT DISTINCT projects.projectid, projects.name, string_agg(users.firstname || ' ' || users.lastname, ', ') as member FROM projects LEFT JOIN members ON members.projectid = projects.projectid
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
          res.render('projects/dasrboardProjects', {
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
