const models = require('../../models');
const datetime = require('node-datetime');

// Sequalize Model 전역변수
const happyday_master = models.happyday_master;
const happyday_user_hst = models.happyday_user_hst;
const user = models.user;
const com_org = models.com_org;


module.exports = function(app, connectionPool) {

    app.get('/happyday/hdmain', function(req, res, next) {

        /* session 없을 땐 로그인 화면으로 */
        if (!req.session.user_name) {
            res.redirect('/');

        }
        console.log("session : " + req.session.user_name + " / " + req.session.emp_num);
                // happyday_user_hst.belongsTo(happyday_master, {foreignKey: 'happyday_id', targetKey: 'happyday_id'})
        
        /* 
         * source model (happyday_master) ----> target model(user) 
         * happyday_master 에 reg_user_id 라는 관계 정보가 있음.
         * source model에 관계정보가 있으면 belongsTo
         */
        happyday_master.belongsTo(user, {foreignKey: 'reg_user_id'});
        // user.hasOne(happyday_master, {foreignKey: 'reg_user_id', targetKey: 'reg_user_id'});
        
        user.belongsTo(com_org, {as: 'team', foreignKey: 'team_id'});
        user.belongsTo(com_org, {as: 'sm', foreignKey: 'sm_id'});
        
        happyday_master.findAll({
            raw: true,
            attributes:[
                'happyday_id', 'happyday_name', 'state', 'place_name', 'reg_user_id'
                , 'req_point', 'img_url', 'num_participants'
                , [models.sequelize.fn('date_format', models.Sequelize.col('happyday_master.reg_dtm'), '%Y-%m-%d'), 'reg_dtm']
                , [models.sequelize.fn('date_format', models.Sequelize.col('happyday_master.happyday_dt'), '%m월%d일'), 'happyday_date']
                , [models.sequelize.fn('date_format', models.Sequelize.col('happyday_master.happyday_dt'), '%w'), 'weak']
                , [models.sequelize.fn('date_format', models.Sequelize.col('happyday_master.happyday_dt'), '%H:%i'), 'happy_time']
                // , (hm.dday_dt-curdate()) as dday
                , [models.Sequelize.col('user.user_name'), 'user_name']
                , [models.Sequelize.col('user.user_img'), 'user_img']
                , [models.Sequelize.col('user.team.org_nm'), 'team_name']
                , [models.Sequelize.col('user.sm.org_nm'), 'sm_name']
            ],  
            include: [{
                model: user,
                attributes:[
                ],
                include: [
                    {
                        model: com_org,
                        as: 'team',
                        attributes: [
                        ]
                    },
                    {
                        model: com_org,
                        as: 'sm',
                        attributes: [
                        ]
                    }
                ]
            }],
            where: {
                state: { $notIn: ['N'] }
            },
            order: [ ['reg_dtm', 'DESC'] ]
        }).then(result => {
            console.log("\n*** HAPPYDAY : " + JSON.stringify(result[0]));
            res.render('happyday/hdmain', { data: result, session: req.session });
        }).catch(err => {
            console.log("\n*** ERROR : " + err);
            res.redirect('/');
        });
        
        
        // connectionPool.getConnection(function(err, connection) {
        //     connection.query('select hm.happyday_id, hm.happyday_name, hm.state, hm.place_name, hm.reg_user_id,'+
        //                      '       DATE_FORMAT(hm.reg_dtm, "%Y-%m-%d") AS reg_dtm, DATE_FORMAT(left(hm.happyday_dt,8), "%m월 %d일") AS happyday_date,'+
        //                      '       SUBSTR( _UTF8"일월화수목금토", DAYOFWEEK(left(hm.happyday_dt,8)), 1) AS week, date_format(hm.happyday_dt,  "%H:%i") as happy_time,'+ 
        //                      '       hm.req_point, hm.img_url, hm.num_participants, hm.num_participants-p.curcnt as vacancy, (hm.dday_dt-curdate()) as dday,'+ 
        //                      '       (select org_nm from com_org where org_id = u.team_id) as team_name, (select org_nm from com_org where org_id = u.sm_id) as sm_name,' +
        //                      '       u.user_name, u.user_img '+
        //                      '  from happyday_master hm, user u, (select hm.happyday_id, count(*) as curcnt from happyday_user_hst hp, happyday_master hm where hm.happyday_id=hp.happyday_id  and hp.state not in ("N") group by hm.happyday_id) p'+ 
        //                      ' where hm.reg_user_id = u.id and hm.happyday_id = p.happyday_id' +
        //                      ' order by hm.reg_dtm desc, hm.state desc;', function(error, rows) {
        //         if (error) {
        //             connection.release();
        //             throw error;
        //         }
        //         else {
        //             if (rows.length >= 0) {
        //                 res.render('happyday/hdmain', { data: rows,session: req.session });
        //                 connection.release();
        //             }
        //             else {
        //                 res.redirect('/');
        //                 connection.release();
        //             }
        //         }
        //     });
        // });
    });





    app.post('/showparticipants', function(req, res, next) {
         connectionPool.getConnection(function(err, connection) {
            connection.query(' select u.user_name, u.user_img,  (select org_nm from com_org where org_id = u.sm_id) as sm_name from happyday_user_hst hp, user u where u.id = hp.user_id and hp.state="y" and hp.happyday_id=?;  ', [req.body.happyday_id], function(error, rows) {
                if(error) {
                    connection.release();
                    throw error;
                }else {
                    if(rows.length > 0) {
                        var peoplelist='';  
                        for(var i=0; i<rows.length; i++){
                            peoplelist+="<div class='four wide column'><img class='ui small circular image' src='"+rows[i].user_img+"' style='width:150px  !important; height:150px !important; '><h6 class='content' style='text-align:center'>"+rows[i].user_name +"<br>("+ rows[i].sm_name+")</h5></div>";
                        }
 
                        res.send({peoplelist : peoplelist, session : req.session});
                        connection.release();
                    }else {

                    }    
                }
            });
        });
    });


}