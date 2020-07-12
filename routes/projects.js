var express = require('express');
var router = express.Router();
const check = require('../check/check');
const { query } = require('express');

let checkOption = {
  id: true,
  name: true,
  member: true
}

let optionMember = {
  id: true,
  name: true,
  position: true
}

module.exports = (db) => {
  router.get('/', function (req, res, next) {
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

  router.post('/option', (req, res) => {
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
  router.post('/add', (req, res) => {
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
          if (typeof members == 'string') {
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
    let sqlMembers = `SELECT members.userid, projects.name, projects.projectid FROM members 
    LEFT JOIN projects ON members.projectid = projects.projectid  WHERE projects.projectid = ${projectid};`


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
        db.query(sqlMembers, (err, dataMembers) => {
          if (err) return res.status(500).json({
            error: true,
            message: err
          })
          let dataMember = dataMembers.rows.map(item => item.userid)
          res.render('projects/edit', {
            dataMember,
            nameProject,
            members,
            link,
          })
        })

      })
    })
  })

  //post data form edit
  router.post('/edit/:projectid', (req, res) => {
    let projectid = req.params.projectid
    const { editProjectname, editMembers } = req.body
    let sqlProjectname = `UPDATE projects SET name = '${editProjectname}' WHERE projectid = ${projectid}`

    if (projectid && editProjectname && editMembers) {
      db.query(sqlProjectname, (err) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        let sqlDeletemember = `DELETE FROM members WHERE projectid = ${projectid}`
        db.query(sqlDeletemember, (err) => {
          if (err) return res.status(500).json({
            error: true,
            message: err
          })
          let result = [];
          if (typeof editMembers == 'string') {
            result.push(`(${editMembers},${projectid})`);
          } else {
            for (let i = 0; i < editMembers.length; i++) {
              result.push(`(${editMembers[i]},${projectid})`)
            }
          }

          let sqlUpdate = `INSERT INTO members (userid, projectid) VALUES ${result.join(",")}`
          db.query(sqlUpdate, (err) => {
            if (err) return res.status(500).json({
              error: true,
              message: err
            })
            res.redirect('/projects')
          })

        })
      })
    } else {
      res.redirect(`/projects/edit/${projectid}`)
    }
  })

  //delete project
  router.get('/delete/:projectid', (req, res) => {
    const projectid = req.params.projectid
    let sqlDeleteproject = `
    DELETE FROM projects WHERE projectid=${projectid};
    DELETE FROM members WHERE projectid=${projectid}`

    db.query(sqlDeleteproject, (err) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      res.redirect('/projects')
    })
  })


  //==============================OVERVIEW============================
  //get data for card overview
  router.get('/:projectid/overview', function (req, res, next) {
    let link = 'projects'
    let url = 'overview'
    let projectid = req.params.projectid
    let sqlProject = `SELECT * FROM projects WHERE projectid = ${projectid}`
    db.query(sqlProject, (err, dataProject) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      let sqlMember = `SELECT users.firstname, users.lastname, members.role FROM members
      LEFT JOIN users ON members.userid = users.userid WHERE members.projectid = ${projectid}`
      db.query(sqlMember, (err, dataMamber) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        let sqlIssues = `SELECT tracker, status FROM issues WHERE projectid = ${projectid}`
        db.query(sqlIssues, (err, dataIssues) => {
          if (err) return res.status(500).json({
            error: true,
            message: err
          })
          let bugOpen = 0;
          let bugTotal = 0;
          let featureOpen = 0;
          let featureTotal = 0;
          let supportOpen = 0;
          let supportTotal = 0;

          dataIssues.rows.forEach(item => {
            if (item.tracker == 'bug' && item.status !== "Closed") {
              bugOpen += 1
            }
            if (item.tracker == 'bug') {
              bugTotal += 1
            }
          })
          dataIssues.rows.forEach(item => {
            if (item.tracker == 'feature' && item.status !== "Closed") {
              featureOpen += 1
            }
            if (item.tracker == 'feature') {
              featureTotal += 1
            }
          })
          dataIssues.rows.forEach(item => {
            if (item.tracker == 'support' && item.status !== "Closed") {
              supportOpen += 1
            }
            if (item.tracker == 'support') {
              supportTotal += 1
            }
          })
          res.render('projects/overview/view', {
            projectid,
            link,
            url,
            data: dataProject.rows[0],
            mambers: dataMamber.rows,
            bugOpen,
            bugTotal,
            featureOpen,
            featureTotal,
            supportOpen,
            supportTotal
          })
        })
      })
    })
  });

  //=================CRUD MEMBER=================
  // get data for Member list
  router.get('/:projectid/members', function (req, res, next) {
    let projectid = req.params.projectid
    let link = 'projects'
    let url = 'members'
    let sqlFilter = `SELECT COUNT(member) AS total FROM(SELECT members.userid FROM members JOIN users 
      ON members.userid = users.userid WHERE members.projectid = ${projectid}`;
    //search logic
    let result = []

    if (req.query.checkId && req.query.memberId) {
      result.push(`members.id=${req.query.memberId}`)
    }

    if (req.query.checkName && req.query.memberName) {
      result.push(`CONCAT(users.firstname,' ',users.lastname) LIKE '%${req.query.memberName}%'`)
    }

    if (req.query.checkPosition && req.query.position) {
      result.push(`members.role = '${req.query.position}'`)
    }

    if (result.length > 0) {
      sqlFilter += ` AND ${result.join(' AND ')}`
    }
    sqlFilter += `) AS member`
    //end search logic
    db.query(sqlFilter, (err, totalData) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      //start pegenation logic
      const urlpage = (req.url == `/${projectid}/members`) ? `/${projectid}/members/?page=1` : req.url;
      const page = req.query.page || 1;
      const limit = 3;
      const offset = (page - 1) * limit;
      const total = totalData.rows[0].total;
      const pages = Math.ceil(total / limit);
      let sqlMember = `SELECT users.userid, projects.name, projects.projectid, members.id, members.role, 
      CONCAT(users.firstname,' ',users.lastname) AS fullname FROM members
      LEFT JOIN projects ON projects.projectid = members.projectid
      LEFT JOIN users ON users.userid = members.userid WHERE members.projectid = ${projectid}`

      if (result.length > 0) {
        sqlMember += ` AND ${result.join(' AND ')}`
      }
      sqlMember += ` ORDER BY members.id ASC`
      sqlMember += ` LIMIT ${limit} OFFSET ${offset}`
      //end pegenation logic

      db.query(sqlMember, (err, dataMamber) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        let sqlProject = `SELECT * FROM projects WHERE projectid = ${projectid}`
        db.query(sqlProject, (err, dataProject) => {
          if (err) return res.status(500).json({
            error: true,
            message: err
          })
          res.render('projects/members/listMember', {
            projectid,
            link,
            url,
            pages,
            page,
            urlpage,
            project: dataProject.rows[0],
            members: dataMamber.rows,
            option: optionMember
          })
        })
      })
    })
  });

  router.post('/:projectid/members/option', (req, res) => {
    const projectid = req.params.projectid
    console.log(req.body)
    optionMember.id = req.body.checkid;
    optionMember.name = req.body.checkname;
    optionMember.position = req.body.checkposition;
    res.redirect(`/projects/${projectid}/members`)
  })

  //get free members for project
  router.get('/:projectid/members/add', function (req, res, next) {
    const projectid = req.params.projectid
    const link = 'projects'
    const url = 'members'
    let sqlProject = `SELECT * FROM projects WHERE projectid = ${projectid}`
    db.query(sqlProject, (err, dataProject) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      let sqlMember = `SELECT userid, CONCAT(firstname,' ',lastname) AS fullname FROM users
      WHERE userid NOT IN (SELECT userid FROM members WHERE projectid = ${projectid})`

      db.query(sqlMember, (err, dataMember) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        res.render('projects/members/add', {
          members: dataMember.rows,
          project: dataProject.rows[0],
          projectid,
          link,
          url
        })
      })
    })
  });

  //post new mamber project
  router.post('/:projectid/members/add', function (req, res, next) {
    const projectid = req.params.projectid
    const { inputmember, inputposition } = req.body
    let sqlAdd = `INSERT INTO members(userid, role, projectid) VALUES ($1,$2,$3)`
    let values = [inputmember, inputposition, projectid]

    db.query(sqlAdd, values, (err) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      res.redirect(`/projects/${projectid}/members`)
    })
  });

  //get for form edit members
  router.get('/:projectid/members/:id', function (req, res, next) {
    let projectid = req.params.projectid;
    let id = req.params.id
    let sqlMember = `SELECT members.id, CONCAT(users.firstname,' ',users.lastname) AS fullname, members.role FROM members
    LEFT JOIN users ON members.userid = users.userid WHERE projectid=${projectid} AND id=${id}`

    db.query(sqlMember, (err, dataMember) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      let member = dataMember.rows[0]
      let sqlProject = `SELECT * FROM projects WHERE projectid= ${projectid}`
      db.query(sqlProject, (err, dataProject) => {
        if (err) return res.status(500).json({
          error: true,
          message: err
        })
        let project = dataProject.rows[0]
        res.render('projects/members/edit', {
          projectid,
          link: 'projects',
          url: 'members',
          member,
          project
        })
      })
    })
  });

  //edit position member
  router.post('/:projectid/members/:id', function (req, res, next) {
    let projectid = req.params.projectid
    let id = req.params.id;
    let position = req.body.inputposition;
    let sql = `UPDATE members SET role='${position}' WHERE id=${id}`

    db.query(sql, (err) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      res.redirect(`/projects/${projectid}/members`)
    })

  });

  //delete member project
  router.get('/:projectid/members/:id/delete', function (req, res, next) {
    let projectid = req.params.projectid
    let id = req.params.id;
    let sql = `DELETE FROM members WHERE projectid=${projectid} AND id=${id}`

    db.query(sql, (err) => {
      if (err) return res.status(500).json({
        error: true,
        message: err
      })
      res.redirect(`/projects/${projectid}/members`)
    })
  })















  // router.get('/:projectid/activity', check.isLoggedIn, function (req, res, next) {

  // });












  return router;
}
