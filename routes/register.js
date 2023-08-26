var express = require('express');
var router = express.Router();
var conn = require('../conf/database');

router.get('/', function(req,res,next){
  res.render('register');
});

router.post('/process', function(request, response) {
  var userid = request.body.userid;
  var password = request.body.password;
  var password2 = request.body.password2;
  var email = request.body.email;
  console.log(userid, password,email, password2);
  if (userid && password && email) {
      conn.query('SELECT * FROM usertable WHERE userid = ? OR email = ?', [userid, email], function(error, results) {
          if (error) throw error;
          if (results.length === 0 && password===password2) {
              conn.query('INSERT INTO usertable (userid, password, email) VALUES(?,?,?)', [userid, password, email], function (error, data) {
                  if (error){
                  console.log(error);
                  response.send('회원가입 실패!');                      
                  }else{
                  console.log(data);
                  response.send('회원가입을 환영합니다!');    
                  }
                  response.end();
            });
          } else if(password!=password2){                
              response.send('입력된 비밀번호가 서로 다릅니다.');
              response.end();    
          }
          else {
              response.send('이미 존재하는 아이디 입니다.');
              response.end();    
          }                      
      });
  } else {
      response.send('모든 정보를 입력하세요');    
      response.end();
  }
});


module.exports = router;