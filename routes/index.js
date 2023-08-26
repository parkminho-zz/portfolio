var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
res.render('index', { title: 'TEST', loginconfirm: req.session.logined, loginuser: req.session.loginid })})
router.get('/logout', function(req,res){
  req.session.destroy(function(err){
    if(err)
      console.log(err);
    else{
      req.session;
      res.redirect('/');
    }
  })
})


module.exports = router;
