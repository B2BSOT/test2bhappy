
module.exports = function(app, connectionPool) {

    app.get('/vote/votereg', function(req, res) {
        
        connectionPool.getConnection(function(err, connection) {
            connection.query('select * from user where 1=1 and user_name = ? and emp_num = ?;', [req.session.user_name, req.session.emp_num], function(error, rows) {

                if(error) {
                    connection.release();
                    throw error;
                }else {
                    if(rows.length > 0) {
                        res.render('vote/votereg', {data : rows[0], session : req.session});
                        connection.release();
                    }else {
                        res.redirect('/');
                        connection.release();
                    }    
                }
            });
        });
        
        
    });
    
    
    // 해피데이 등록 시 진행 될 사항
    // 1. vote_master 테이블 insert
    // 2. vote_items 테이블 insert
    // 3. 해피데이 등록 메일 발송(메일 발송 여부에 따라)
    app.post('/vote_regist', function(req, res, next) {
        connectionPool.getConnection(function(err, connection) {
            //console.log(req.body);
            
            connection.beginTransaction(function(err) {
                if(err) {
                    connection.release();
                    throw err;
                }
                
                ////
                //vote_master 테이블 insert
                connection.query('insert into vote_master(subject, comment, reg_user_id, reg_dtm, deadline, modify_dtm, state, parti_org_id, multi_yn, secret_yn, noti_yn) values(?,?,?,date_format(sysdate(), "%Y%m%d%H%i%s"),?,date_format(sysdate(), "%Y%m%d%H%i%s"),"P",?,?,?,?);'
                            , [req.body.vote_name, req.body.vote_contents, req.session.user_id, req.body.vote_deadline, req.body.parti_org_id, req.body.multi_yn, req.body.secret_yn, req.body.noti_yn], function(error, rows) {
                    if(error) {
                        console.log("ERROR1");
                                
                        connection.rollback(function() {
                            connection.release();
                            console.error("insert vote_master rollback error");
                            throw error;
                        });
                        connection.release();
                        throw error;
                    }else {                    
                       //vote_items 테이블 insert
                       connection.query('select 1 from dual;', function(error, rows1) {
                            if(error){
                                console.log("ERROR2");
                                
                                connection.rollback(function() {
                                    connection.release();
                                    console.error("insert vote_detal rollback error");
                                    throw error;
                                });
                                connection.release();
                                throw error;
                            }else {
                                connection.release();
                                res.redirect('happyday/hdmain');
                            }
                        });
                    }  
                });
                
                
                
                
                
                
                /////

            });//connection.beginTransaction
        });//connectionPool.getConnection
    });//post
    
}
