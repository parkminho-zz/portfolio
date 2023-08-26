var express = require('express');
var router = express.Router();
var conn = require('../conf/database');

router.post('/', function(req,res,next){
  var userid = req.body.userid;
  var password = req.body.password;
  conn.query(`SELECT * FROM usertable WHERE userid = '${userid}' AND password = '${password}'`, function(error, results) {
    if (error) throw error;
    if (!results.length==0){
      req.session.user = results[0];
      req.session.is_logined = true ;
      req.session.logined = req.session.is_logined ;
      req.session.loginid = req.session.user;
      res.redirect('/');
    }else
    {
      res.send('<script type="text/javascript">alert("로그인 실패!"); document.location.href="/";</script>')
    }}
  )
  });

  module.exports = router;