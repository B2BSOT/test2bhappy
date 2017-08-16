
module.exports = function(app, connectionPool) {

    app.get('/vote/votereg', function(req, res, next) {
        
        connectionPool.getConnection(function(err, connection) {
            connection.query('select u.* , "N" as load_yn from user u where u.user_name = ? and u.emp_num = ?;', [req.session.user_name, req.session.emp_num], function(error, rows1) {

                if(error) {
                    connection.release();
                    throw error;
                }else {
                    
                    connection.query('select * from vote_master where reg_user_id = ? order by reg_dtm desc;', [req.session.user_id], function(error, rows2){
                        if(error){
                            connection.release();
                            throw error;
                        
                        }else{
                            if(rows1.length > 0) {
                                res.render('vote/votereg', {data1 : rows1[0], data2 : rows2, session : req.session});
                                connection.release();
                            }else {
                                res.redirect('/');
                                connection.release();
                            }    
                        }
                    
                    });
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
                
                connection.query('insert into vote_master(subject, comment, reg_user_id, reg_dtm, deadline, modify_dtm, state, parti_org_id, multi_yn, secret_yn, add_item_yn, noti_yn)' 
                               + 'values(?,?,?,date_format(sysdate(), "%Y%m%d%H%i%s"),?,date_format(sysdate(), "%Y%m%d%H%i%s"),"P",'
                                     + '(case ? when "Team" then (select team_id from user where id = ?) when "SM" then (select sm_id from user where id = ?) else 0 end),?,?,?,?);'
                             , [req.body.vote_name, req.body.vote_contents, req.session.user_id, req.body.vote_deadline, req.body.parti_org_id , req.session.user_id , req.session.user_id , req.body.multi_yn, req.body.secret_yn, req.body.add_item_yn, req.body.noti_yn], function(error, rows) {
                            if(error){
                                console.log("ERROR1");
                                
                                connection.rollback(function() {
                                    connection.release();
                                    console.error("insert vote_master rollback error");
                                    throw error;
                                });
                                res.render('happyday/error', {data : rows[0], session : req.session});  //에러처리?!?!?
                                connection.release();
                                throw error;
                            }else {
                                console.log("Success Insert1");
                             //   console.log("test = " +req.body.vote_item.length);
                                 for(var i=0; i<req.body.vote_item.length; i++) {
                                // 2. vote_items 테이블에 아이템 항목 insert
                                connection.query('insert into vote_items (vote_id, item_id, item_name, reg_user_id, reg_dtm) select vote_id, ?, ?, reg_user_id, date_format(sysdate(), "%Y%m%d%H%i%s") as reg_dtm from vote_master  where vote_id = (select max(vote_id) from vote_master)'
                                , [i+1, req.body.vote_item[i]], function(error, rows){
                                    if(error){
                                        connection.release();
                                        throw error;
                                    }
                                });
                                 }

                                connection.release();
                                res.redirect('../vote/votemain');
                                
                                if(rows.affectedRows > 0) {
                                    connection.commit(function(err) {
                                        if(err) {
                                            console.error("commit error : " + err);
                                            connection.rollback(function() {
                                            connection.release();
                                            console.error("update user rollback error");
                                            throw error;
                                            });
                                        }
                                    //commit success
                                    });//commit
                                }else {
                                    //fail
                                    connection.release();
                                    res.redirect('happyday/error');     //에러처리?!?!?
                                }
                            }
                        });
                
                /////

            });//connection.beginTransaction
        });//connectionPool.getConnection
    });//post
    
    
    
    app.post('/vote_loading', function(req, res, next) {
        connectionPool.getConnection(function(err, connection) {
            //console.log(req.body);
            connection.query('select vm.*, vm.reg_user_id as user_name, "Y" as load_yn from vote_master vm where vm.vote_id = ?;', [req.body.vote_load], function(error, rows1){
            
                connection.beginTransaction(function(err) {
                    if(err) {
                        connection.release();
                        throw err;
                    }
                    
                    else {
                        connection.query('select * from vote_master where reg_user_id = ? order by reg_dtm desc;', [req.session.user_id], function(error, rows2){
                            
                            connection.beginTransaction(function(err) {
                                if(err) {
                                    connection.release();
                                    throw err;
                                }
                                
                                else {
                                    connection.query('select * from vote_items where vote_id = ?;', [req.body.vote_load], function(error, rows3){
                                        
                                        connection.beginTransaction(function(err) {
                                            if(error){
                                                connection.release();
                                                throw error;
                                            
                                            }else{
                                                if(rows1.length > 0) {
                                                    res.render('vote/votereg', {data1 : rows1[0], data2 : rows2 , data3 : rows3, session : req.session});
                                                    connection.release();
                                                }else {
                                                    res.redirect('/');
                                                    connection.release();
                                                }    
                                            }
                                        });
                                    });
                                }
                            });
                        
                        });
                    }
                });//connection.beginTransaction
            });
            
        });//connectionPool.getConnection
    });//post
    
}



//select * from vote_master where reg_user_id = ? order by red_dtm desc;

