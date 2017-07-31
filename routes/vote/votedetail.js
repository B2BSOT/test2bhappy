var models = require('../../models');
// var datetime = require('node-datetime');

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

    app.get('/vote/votedetail', function(req, res, next) {
        
        var TEST_VOTE_ID = 1;
        var TEST_PARTI_ORG_ID = 10001;
        
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
                    {'team_id': TEST_PARTI_ORG_ID},//req.body.parti_org_id
                    {'sm_id': TEST_PARTI_ORG_ID},//req.body.parti_org_id
                ]
            }
        }).then(c => {
            //console.log("** step1 result: " + c);
            
            if(c == 0) {
                res.render('/vote/votemain');
            }
        });
        
        var vote_master = models.vote_master;
        var vote_detail = models.vote_detail;
        var vote_items = models.vote_items;
        
        var data = {};
        
        var user = models.user;
        vote_master.belongsTo(user, {foreignKey: 'reg_user_id', sourceKey: 'id'});
        // user.belongsTo(vote_master, {foreignKey: 'id', sourceKey: 'reg_user_id'});
        
        vote_master.findOne({
            raw: true, // 쿼리 결과를 sequalize instance에 담지 않고 일반 데이터(key, value) 형태로 넘겨준다
            include: [{
                model: user,
                // where : {
                //     id : {$col : 'vote_master.user_id' }
                // }
                attributes: [
                    'id', 'user_name'
                ]
            }],
            where : {
                vote_id : TEST_VOTE_ID//req.body.vote_id
            }
        }).then(master_info => {
            console.log("** step2 result: " + JSON.stringify(master_info));
            
            data.master_info = master_info;
        });
        

        /******************************************************************************************************
         * DB에서 Table간 foreignKey 설정이 되어있지 않는 상태에서의 INNER JOIN 및 GROUP BY 사용 예
            SELECT `vote_items`.`vote_id` 
                , `vote_items`.`item_id`
                , `vote_items`.`item_name`
                , count(`vote_detail`.`user_id`) AS `cnt` 
            FROM `vote_items` AS `vote_items` 
            INNER JOIN `vote_detail` AS `vote_detail` 
               ON `vote_items`.`vote_id` = `vote_detail`.`vote_id` AND `vote_detail`.`item_id` = `vote_items`.`item_id` 
            WHERE `vote_items`.`vote_id` = 1 
            GROUP BY `item_id`, `item_name` 
            ORDER BY `vote_items`.`item_id` ASC
            
            * result: [{"item_id":1,"item_name":"아아","cnt":3}
            *          ,{"item_id":2,"item_name":"뜨아","cnt":2}
            *          ,{"item_id":3,"item_name":"라떼","cnt":1}]
            * 실행 쿼리에서는 PK값인 vote_id가 있지만 실제 결과는 attributes내 컬럼만 나온다
        *******************************************************************************************************/
        
        /* vote_items : vote_detail - 1 : M 관계 설정 셋팅 */
        vote_items.hasMany(vote_detail, {as: 'vote_detail', foreignKey: 'vote_id', sourceKey: 'vote_id'});
        vote_detail.belongsTo(vote_items, {foreignKey: 'vote_id', targetKey: 'vote_id'});
        
        vote_items.findAll({
            raw : true,
            attributes : [
                'item_id',
                'item_name',
                [ models.Sequelize.fn('count', models.Sequelize.col('vote_detail.user_id')), 'cnt' ]
            ], // 실제 결과 컬럼
            include : [ {
                model: vote_detail,
                as : 'vote_detail',
                where : {
                    item_id : {$col : 'vote_items.item_id' }
                },
                attributes : []
            }], // INNER JOIN 테이블 설정
            where : {
                vote_id : TEST_VOTE_ID//req.body.vote_id
            }, // 조건절
            group : [ 'item_id', 'item_name' ], // GROUP BY 설정
            order : [ ['item_id', 'ASC'] ] // ORDER BY 설정
            
        }).then(detail_info => {
            data.detail_info = detail_info;
            
            console.log("**RESULT DATA : " + JSON.stringify(data));
        
            res.render('vote/votedetail', {data : data, session : req.session});    
            
        }).catch(function(err) {
            console.log(err);
        });
        
        
        
    });
}

/*******
 * Where에 사용되는 조건 표현식
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

// order by 표현식
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

************/