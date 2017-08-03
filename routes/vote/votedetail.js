var models = require('../../models');
var datetime = require('node-datetime');

module.exports = function(app) {

    app.post('/checkItem', function(req, res, next) {
        /***
         * 투표 체크를 이미 한 아이템에 했는지 여부와 
         * 해당 투표가 다중투표가 가능한지 여부에 따라 로직을 달리한다.
         * 
         * ## 화면에서 체크된 아이템이 투표를 했는지 여부를 알려주는 값을 넘겨준다고 가정
         * 
         * 1. 투표 체크를 이미 한 아이템인 경우
         *    1. 이미 투표한 정보는 delete 
         * 
         * 2. 투표 체크를 하지 않은 아이템인 경우
         *   2-1. 투표 종류가 1인 1선택인 경우
         *      1. user가 다른 곳에 투표했는지 조회
         *        1) 투표를 안했다면 
         *           - PASS
         *        2) 투표를 했다면
         *           - 이미 투표한 아이템은 delete
         *      2. 새로 투표한 아이템은 create
         * 
         *   2-2. 투표가 1인 다중 선택인 경우
         *      1. 새로 투표한 아이템 create
         * */
         
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }
        
        var vote_detail = models.vote_detail;
        
        // 화면에서 이미 체크된 아이템에 투표했는지 여부
        var alreadyChecked = 'Y' // req.body.alreadyChecked
        
        var multi_yn = 'N' // 다중 투표
        var vote_id = req.body.vote_id; // 투표 id
        var item_id = req.body.item_id; // 투표한 item id
        var user_id = req.body.user_id; // 투표한 user id 
        
        
        /* 1. 투표체크를 이미 한 아이템인 경우 */
        if(alreadyChecked) {
            vote_detail.destroy({
                where: {
                    vote_id: vote_id,
                    item_id: item_id,
                    user_id: user_id
                }
            }).then(result => {
                if(result == 1) {
                    res.json({success: "delete Success", status: 200, deletedItemId: item_id});
                }else {
                    res.json({success: 'delete fail', status: 500});
                }
            }).catch(err => {
                console.log(err);
                res.json({success: 'delete fail', status: 500});
            });
        }
        /* 2. 투표 체크를 하지 않은 아이템인 경우 */
        else {
            
        }
        
    });
    
    function deleteOrCreate(model, whereCon, item, onCreate, onUpdate, onError) {
        /***
         * 1. check한 item이 존재하는지 찾는다
         * 2. item이 존재하지 않는다면 create(insert)한다
         * 3. item이 존재하면 delete 한후 create한다
         **/
        model.findOne({where: where}).then(function (foundItem) {
            if (!foundItem) {
                // Item not found, create a new one
                model.create(newItem)
                    .then(onCreate)
                    .catch(onError);
            } else {
                // Found an item, update it
                model.delete(newItem, {where: where})
                    .then(onUpdate)
                    .catch(onError);
                ;
            }
        }).catch(onError);
    }
    

    app.get('/vote/votedetail', function(req, res, next) {
        
        var TEST_VOTE_ID = 1;
        var TEST_PARTI_ORG_ID = 10001;
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }
        
        var vote_master = models.vote_master;
        var vote_detail = models.vote_detail;
        var vote_items = models.vote_items;
        var user = models.user;
        
        var data = {};
    
        /*  
         *  0. 이전 vote main화면에서 vote_id, parti_org_id 를 넘겨준다고 가정
         *  1.session의 user_id가 해당투표 가능조직인지 다시 체크(url주소를 쳐서 들어오는 것을 방지)
         *  2.해당 vote_id로 vote_main, vote_items, vote_detail 조회
         */
        
        /* 1.session user_id 체크 */
        // session의 user_id 
        var user_id = req.session.user_id;
        
        user.count({ 
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
        
        /* vote_master : user - 1 : 1 관계 설정 셋팅 */
        vote_master.hasOne(user, {foreignKey: 'id', targetKey: 'reg_user_id'});
        // vote_master.belongsTo(user, {foreignKey: 'reg_user_id', sourceKey: 'id'});
        
        /*****************************************************************************************************
         * # find 함수에서 raw: true 옵션
         * - 해당 옵션을 주면 쿼리 결과를 sequalize instance에 담지 않고 일반 데이터(key, value) 형태로 넘겨준다
         * 
         * # raw 옵션의 문제점
         * - include를 했을 경우 key값이 inclue한 model 이름이 함께 반환된다. 
         *   따라서 attributes 옵션을 이용하여 as구문으로 key값을 변환하는 작업을 거쳐야 한다.
         * ***************************************************************************************************/
        vote_master.findOne({
            raw: true, // (key, value) 로 result 반환
            attributes : [
                'vote_id', 'subject', 'comment', 'reg_user_id', 'reg_dtm', 'deadline',
                'state', 'parti_org_id', 'multi_yn', 'secret_yn', 'add_item_yn', 'noti_yn',
                [models.Sequelize.col('user.id'), 'id'], // raw옵션으로 user.id가 반환되므로 'id'로 이름 변환
                [models.Sequelize.col('user.user_name'), 'user_name'],
                [models.Sequelize.col('user.user_img'), 'user_img']
            ],
            include: [{
                model: user,
                // where : {
                //     id : {$col : 'vote_master.user_id' }
                // }
                attributes: [
                //    'id', 'user_name'
                ]
            }],
            where : {
                vote_id : TEST_VOTE_ID//req.body.vote_id
            }
        }).then(master_info => {
            // console.log("** step2 result: " + JSON.stringify(master_info));
            
            data.master_info = master_info;
        });
        
        
        /*
            SELECT count(*) AS `count` FROM `vote_detail` AS `vote_detail` WHERE `vote_detail`.`vote_id` = 1;
        */
        vote_detail.count({
            where : {
                vote_id : TEST_VOTE_ID//req.body.vote_id
            }
        }).then(vote_total_cnt => {
            data.vote_total_cnt = vote_total_cnt;
            // console.log("**RESULT DATA : " + JSON.stringify(data));
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
            // order : [ ['item_id', 'ASC'] ] // ORDER BY 설정
            
        }).then(detail_info => {
            data.detail_info = detail_info;
            
            // console.log("**RESULT DATA : " + JSON.stringify(data));
        
            res.render('vote/votedetail', {data : data, session : req.session});    
            
        }).catch(function(err) {
            console.log(err);
        });
        
        
        
        // vote_detail.count({ 
        //     where: {
        //         'vote_id': TEST_VOTE_ID,
        //     }
        // }).then(vote_total_cnt => {
        //     if(vote_total_cnt == 0) {
        //         res.render('/vote/votemain');
        //     }
        // });
        
     
        
        
        
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
