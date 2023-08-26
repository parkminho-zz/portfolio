var express = require('express');
var router = express.Router();
var conn = require('../conf/database');

router.get('/list',function(req,res){
    var count = req.query.page;
    conn.query('SELECT COUNT(*) as rowcount from board', function(error2,results2){
        if(error2) throw error2;
        else{            
            var rowcount = Math.ceil(results2[0].rowcount/10);
            count = typeof count === 'undefined' ? 1 : count ;
            var offset =  (count - 1) * 10;
            conn.query(`SELECT board_num, title, writer, wr_date, view_cnt FROM board LIMIT ${offset},10`, function(error,results){
                if(error) throw error;
                var board = results.map(row => {
                    var timestamp = new Date(row.wr_date);
                    var formattedTimestamp = `${timestamp.getFullYear()}.${(timestamp.getMonth() + 1).toString().padStart(2, '0')}.${timestamp.getDate().toString().padStart(2, '0')}`;
                    return { ...row, wr_date: formattedTimestamp };
                    });
                res.render('board',{loginconfirm: req.session.logined, loginuser: req.session.loginid, board: board, rowcount : rowcount});    
        
            })
        }
    })

})

router.get('/list/search', function(req,res){
    var data = req.query.value;
    var type = req.query.type;
    if(type === 'num'){
        conn.query('SELECT board_num, title, writer, wr_date, view_cnt FROM board WHERE board_num = ?',[data], function(error, results){
            if(error) throw error;
            if(results.length === 0){
                res.send('<script type="text/javascript">alert("검색결과가 없습니다."); document.location.href="/board/list";</script>');                
            }
            else{              
                res.render('board', {loginconfirm: req.session.logined, loginuser: req.session.loginid, board : results})
            }    
        })    
    }
    else if(type === 'title_content'){
        conn.query('SELECT board_num, title, writer, wr_date, view_cnt FROM board WHERE title=? OR content= ?',[data,data], function(error, results){
            if(error) throw error;
            if(results.length ===0){
                res.send('<script type="text/javascript">alert("검색결과가 없습니다."); document.location.href="/board/list";</script>');                
            }
            else{                
                res.render('board', {loginconfirm: req.session.logined, loginuser: req.session.loginid, board : results})
            }    
        })    
    }
    else if(type === 'writer'){
        conn.query('SELECT board_num, title, writer, wr_date, view_cnt FROM board WHERE writer = ?',[data], function(error, results){
            if(error) throw error;
            if(results.length ===0){
                res.send('<script type="text/javascript">alert("검색결과가 없습니다."); document.location.href="/board/list";</script>'); 
            }
            else{                
                res.render('board', {loginconfirm: req.session.logined, loginuser: req.session.loginid, board : results})
            }    
        }) 
    }
})
router.get('/write',function(req,res){
    console.log(req.session.loginid);
    if(!req.session.loginid) throw error;
    res.render('write',{loginconfirm: req.session.logined});
})



router.get('/:board_num',function(req,res){
    var boardnum = req.params.board_num;
    conn.query('SELECT * FROM board WHERE board_num = ?', [boardnum] ,function(error, results){
        if(error) throw error;
        if(results.length ===0){
            res.send('No data found');
        }
        else{        
            if(req.session.loginid != undefined) {
                var loginid = req.session.loginid.userid;
                conn.query('UPDATE board SET view_cnt = view_cnt +1 WHERE board_num =?', [boardnum])
                conn.query('SELECT board.board_num FROM board INNER JOIN usertable on usertable.userid = board.writer WHERE usertable.userid = ?',[loginid],function(error2,results2){
                    if(error2) throw error2;
                    
                    console.log(results[0].title)
                    req.session.title = results[0].title;
                    req.session.content = results[0].content;
                    req.session.boardnum = results[0].board_num;
                    for(var row of results2){
                        if(parseInt(boardnum) === parseInt(row.board_num)){
                            var writer = true;
                            break;
                        }
                    }
                    res.render('read',{loginconfirm: req.session.logined, loginuser: req.session.loginid, board: results, writer: writer, boardnum : boardnum});
                })
            }
            else{
                res.render('read',{loginconfirm: req.session.logined, loginuser: req.session.loginid, board: results});
            }
        }
    })
})
router.get('/:board_num/modify',function(req,res){
    res.render('modify',{title: req.session.title, content: req.session.content, boardnum: req.session.boardnum })
})

router.post('/:board_num/modify/process',function(req,res){
    var modifytitle = req.body.title;
    var modifycontent = req.body.content;
    var boardnum = req.session.boardnum;
    conn.query('UPDATE board SET title = ?, content = ? WHERE board_num = ?', [modifytitle, modifycontent, boardnum] ,function(error, results){
        if(error) throw error;
        if(results.length ===0){
            res.send('No data found');
        }
        else{
            res.send('<script type="text/javascript">alert("수정 완료"); document.location.href="/board/list";</script>');
        }
    })
})

router.post('/:board_num/remove',function(req,res){
    var boardnum = req.session.boardnum;
    conn.query('DELETE from board WHERE board_num = ?', [boardnum] ,function(error, results){
        if(error) throw error;
        if(results.length ===0){
            res.send('No data found');
        }
        else{
            res.send('삭제 완료');
        }
    })
})

router.post('/write/process', function(req,res){
    var title = req.body.title;
    var content = req.body.content;
    var writer = req.session.loginid.userid;
    if (!title || !content || !writer) {
        console.log('error');
        res.send('게시물 등록 실패')
    } else{
        conn.query('SELECT * FROM board' , function(error, results) {
            if (error) throw error;
            if(results.length){
                conn.query('INSERT INTO board (title, content, writer) VALUES(?,?,?)', [title, content, writer],function (error, data) {
                    if (error){
                    console.log(error);
                    } else{
                    res.redirect('/board/list');
                    }
                }
                )
            }
        })
    }
})


module.exports = router;