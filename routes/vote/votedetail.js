var models = require('../../models');
var datetime = require('node-datetime');

// module.exports = function(app) {
//     app.get('/quizboard/quizboard', function(req, res, next) {
        
//         /* session 없을 땐 로그인 화면으로 */
//         if(!req.session.user_name) {
//             res.redirect('/');
//         }

//         models.quiz_board.findAll()
//         .then(quizboards => {
//             res.render('quizboard/quizboard', {data : quizboards, session : req.session});    
//         });
//     });
    
//     app.post('/create', function(req, res, nex) {
//         console.log("PUT quizboard/create : "+ req.body.subject + " / " + req.body.content);
        
//         /* session 없을 땐 로그인 화면으로 */
//         if(!req.session.user_name) {
//             res.redirect('/');
//         }
        
//         var dt = datetime.create();
//         var formattedDate = dt.format('YmdHMS') // YYYYMMDDHH24MISS
        
//         models.sequelize.transaction(function (t) {
//             models.quiz_board.create({
//                 //board_id : 0, //autoincreted로 설정되어있어서 빼도 됨
//                 subject: req.body.subject,
//                 content: req.body.content,
//                 reg_dtm: formattedDate,
//                 days: 2,
//                 file_id: '' // nullable이지만 null 을 입력하면 에러나기 때문에 공백입력
//             })
//         }).then(function (result) {
//           // Transaction has been committed
//           // result is whatever the result of the promise chain returned to the transaction callback
//           res.send({session : req.session});
          
//         }).catch(function (err) {
//           // Transaction has been rolled back
//           // err is whatever rejected the promise chain returned to the transaction callback
//           res.redirect('/');
//         });

        
//     });
// }

module.exports = function(app) {

    app.post('/vote/votedetail', function(req, res, next) {
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }
    
        /*  
         *  0. 이전 vote main화면에서 vote_id, parti_org_id 를 넘겨준다고 가정
         *  1.session의 user_id가 해당투표 가능조직인지 다시 체크(url주소를 쳐서 들어오는 것을 방지)
         *  2.해당 vote_id로 vote_main, vote_items, vote_detail 조회
         */
        
        /* 1.session user_id 체크 */
        // session의 user_id 
        var user_id = req.session.user_id;
        
        models.user.count({ 
            where: {
                'id': user_id,
                $or:[
                    {'team_id': req.body.parti_org_id},
                    {'sm_id': req.body.parti_org_id}
                ]
            }
        }).then(c => {
            console.log("VoteDetail step1 : " + c.length);
            
            if(c.length == 0) {
                res.render('/vote/votemain');
            }
        });
        
        /*
        models.user.findOne({
            where: {
                id: user_id,
                $or:[
                    {team_id: req.body.parti_org_id},
                    {sm_id: req.body.parti_org_id},
                ]
            }
            //    --oracle query
            //    SELECT *
            //    FROM user
            //    WHERE (
            //       id = #user_id#
            //        AND (team_id = #parti_org_id# OR sm_id = #parti_org_id#)
            //    ) LIMIT 1;
            
        }).then(userInfo => {
            
            console.log("VoteDetail step1 : " + userInfo);
            
            if(userInfo.length = 0) {
                res.render('/vote/votemain');
            }
        });
        */
        
        console.log("VoteDetail step2");
        
          connectionPool.getConnection(function(err, connection) {
            connection.query('select * from mysqldb.user where 1=1 and user_name = ? and emp_num = ?;', [req.session.user_name, req.session.emp_num], function(error, rows) {
                
                console.log("rows : " + rows.length);
                
                if(error) {
                    connection.release();
                    throw error;
                }else {
                    if(rows.length > 0) {
                        res.render('vote/votedetail', {data : rows[0], session : req.session});
                        connection.release();
                    }else {
                        res.redirect('/');
                        connection.release();
                    }    
                }
            });
        });
        
    });
}
/*
Project.findAll({
  where: {
    id: {
      $and: {a: 5}           // AND (a = 5)
      $or: [{a: 5}, {a: 6}]  // (a = 5 OR a = 6)
      $gt: 6,                // id > 6
      $gte: 6,               // id >= 6
      $lt: 10,               // id < 10
      $lte: 10,              // id <= 10
      $ne: 20,               // id != 20
      $between: [6, 10],     // BETWEEN 6 AND 10
      $notBetween: [11, 15], // NOT BETWEEN 11 AND 15
      $in: [1, 2],           // IN [1, 2]
      $notIn: [1, 2],        // NOT IN [1, 2]
      $like: '%hat',         // LIKE '%hat'
      $notLike: '%hat'       // NOT LIKE '%hat'
      $iLike: '%hat'         // ILIKE '%hat' (case insensitive)  (PG only)
      $notILike: '%hat'      // NOT ILIKE '%hat'  (PG only)
      $overlap: [1, 2]       // && [1, 2] (PG array overlap operator)
      $contains: [1, 2]      // @> [1, 2] (PG array contains operator)
      $contained: [1, 2]     // <@ [1, 2] (PG array contained by operator)
      $any: [2,3]            // ANY ARRAY[2, 3]::INTEGER (PG only)
    },
    status: {
      $not: false,           // status NOT FALSE
    }
  }
})

// count
Project.count({ where: {'id': {$gt: 25}} }).then(c =>
  console.log("There are " + c + " projects with an id greater than 25.")
})

something.findOne({
  order: [
    'name',
    // will return `name`
    'username DESC',
    // will return `username DESC` -- i.e. don't do it!
    ['username', 'DESC'],
    // will return `username` DESC
    sequelize.fn('max', sequelize.col('age')),
    // will return max(`age`)
    [sequelize.fn('max', sequelize.col('age')), 'DESC'],
    // will return max(`age`) DESC
    [sequelize.fn('otherfunction', sequelize.col('col1'), 12, 'lalala'), 'DESC'],
    // will return otherfunction(`col1`, 12, 'lalala') DESC
    [sequelize.fn('otherfunction', sequelize.fn('awesomefunction', sequelize.col('col'))), 'DESC']
    // will return otherfunction(awesomefunction(`col`)) DESC, This nesting is potentially infinite!
  ]
})

*/