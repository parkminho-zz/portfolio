var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var http = require('http');
var cors= require('cors');
var axios = require('axios');
var conn = require('../conf/database');
require('dotenv').config();

var GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
var randomcode = create_code();

router.post('/2', cors(), function(req,res){  
  function CheckEmail(email){                                                 
    var reg_email = /^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/;
    if(!reg_email.test(email)) {                            
        return false;
    }else {                       
        return true;
    }} 
  function CheckId(userid){
      var reg_id = /[^0-9a-zA-Z]/g;
      if(!reg_id.test(userid)) {
          return false;
      }else {
          return true;
      }
  }
  var userid = req.body.userid;
  var password = req.body.password;
  var password2 = req.body.password2;
  var email = req.body.email;
  req.session.authuser = userid;
  req.session.authpassword = password;
  req.session.authemail = email;
  if(userid && password && email){
    conn.query('SELECT * FROM usertable WHERE userid = ? OR email = ?', [userid, email], function(error, results) {
        if (error) throw error;
        if(CheckId(userid)){
          res.send('<script type="text/javascript">alert("영문 및 숫자만 입력해주세요."); document.location.href="/register";</script>');
        }else if(password!=password2){
          res.send('<script type="text/javascript">alert("입력된 비밀번호가 서로 다릅니다."); document.location.href="/register";</script>');    
        }else if(!CheckEmail(email)){
          res.send('<script type="text/javascript">alert("Email형식이 아닙니다!"); document.location.href="/register";</script>');    
        }else if (results.length === 0 && password==password2) {
          var url = 'https://accounts.google.com/o/oauth2/v2/auth';
          url += `?client_id=${process.env.OAUTH_CLIENT_ID}`;
          url += `&redirect_uri=${process.env.OAUTH_REDIRECT_URI}`;
          url += `&response_type=code`
          url += `&scope=https://mail.google.com/`
          res.redirect(url);
        }else {
            res.send('<script type="text/javascript">alert("이미 존재하는 아이디 또는 이메일입니다."); document.location.href="/register";</script>');    
        }
    });
  } else {
    res.send('<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); document.location.href="/register";</script>'); 
  }
});

router.get('/', async function(req,res){
  var {code} = req.query;
  console.log(`code: ${code}`);
  // access_token, refresh_token 등의 구글 토큰 정보 가져오기
  var resp = await axios.post(GOOGLE_TOKEN_URL, {
    // x-www-form-urlencoded(body)
    code,
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    grant_type: 'authorization_code'
});
  console.log(`access token : ${resp.data.access_token}`)
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.google.com',
    port: 587,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: process.env.OAUTH_USER,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      accessToken : `${resp.data.access_token}`
    },
    });    
  var message = {
    from: process.env.OAUTH_USER,
    to: `${req.session.authemail}`,
    subject: 'Nodemailer X Gmail OAuth 2.0 테스트',
    html: `
      <h1>
        Nodemailer X Gmail OAuth 2.0 테스트 메일
        인증코드: ${randomcode}`,
  };
  try {
    transporter.sendMail(message);
    console.log('메일을 성공적으로 발송했습니다.');
    console.log(`${randomcode}`)
  } catch (e) {
    console.log(e);
  }  
  res.render('email',{userauth : req.session.authuser, passwordauth : req.session.authpassword, emailauth : req.session.authemail})
})
  function create_code(){
    var n = Math.floor(Math.random()*10000000);
    return n.toString().padStart(6,"0");
  }

router.randomCode = `${randomcode}`;

module.exports = router;