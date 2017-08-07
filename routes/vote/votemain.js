var models = require('../../models');
var datetime = require('node-datetime');


module.exports = function(app) {

    app.get('/vote/votemain', function(req, res, next) {

        var TEST_VOTE_ID = 1;
        var TEST_PARTI_ORG_ID = 10001;
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }
    
            
        var vote_master = models.vote_master;
        var vote_detail = models.vote_detail;
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
        
        // console.log("step1: votemain user check");
        
        // models.user.count({ 
        //     where: {
        //         'id': user_id,
        //         $or:[
        //             {'team_id': TEST_PARTI_ORG_ID},//req.body.parti_org_id
        //             {'sm_id': TEST_PARTI_ORG_ID},//req.body.parti_org_id
        //         ]
        //     }
        // }).then(c => {
        //     console.log("step1 result: " + c);
            
        //     if(c == 0) {
        //         res.render('/vote/votemain');
        //     }
        // });
        
        
        /******************************************************************************************************
         *   select	vm.vote_id,
         *   		vm.subject,
         *   		(TO_CHAR(sysdate,'yyyymmdd')-SUBSTR(vm.deadline,0,8)) as dday,
         *   		vm.reg_user_id,
         *   		DATE_FORMAT(left(vm.reg_dtm,8), "%m월 %d일") as reg_date,
         *   		SUBSTR( _UTF8"일월화수목금토", DAYOFWEEK(left(vm.reg_dtm,8)), 1) as reg_week,
         *   		date_format(vm.reg_dtm,  "%H:%i") as reg_time,
         *   		DATE_FORMAT(left(vm.deadline,8), "%m월 %d일") as dday_date,
         *   		SUBSTR( _UTF8"일월화수목금토", DAYOFWEEK(left(vm.deadline,8)), 1) as dday_week,	
         *   		date_format(vm.deadline,  "%H:%i") as dday_time,
         *   		SUBSTR(vm.comment,0,20) as comment,
         *   		vm.state,
         *   		us.user_name,
         *   		us.user_img,
         *   		-- com_org테이블 모델 정의 필요(.js)-->  추후 조인해서 팀이름, SM이름 가져와라
         *   		(select org_nm from com_org where org_id = us.team_id) as team_name,
         *   		(select org_nm from com_org where org_id = us.sm_id) as sm_name,
         *   from 	vote_master vm,
         *   		user us
         *   where 	1=1
         *   and    vm.reg_user_id = us.id //등록자 정보로 조인    
         *   order by deadline desc
         *   ;		
         * 
         * 
         * (select count(*) cnt
         *  from   vote_detail vd
         *  where  1=1
         *  and    vd.user_id = user_id //req.session.id
         *  and    vd.vote_id = vm.vote_id //밖에 있는 vote_master.vote_id
         * ) 	
         *
         *******************************************************************************************************/        
        /* user : vote_master - 1 : M 관계 설정 셋팅(등록자 정보 및 등록 투표 정보 조회) */
        vote_master.belongsTo(user, {foreignKey: 'reg_user_id', targetKey: 'id'});
        user.hasMany(vote_master, {as: 'vote_master', foreignKey: 'id'});

        /* select */
        vote_master.findAll({
            raw : true,
            attributes : [
                'vote_id',
                'subject',
                /* squelize에서 datediff 허용하는지 확인 후 안하면 모델에서 변수정의하고... */
                //'DATEDIFF(day, DATE_FROMAT(SYSDATE(), "%Y%m%d"), DATE_FORMAT(deadline, "%Y%m%d"))as dday_cnt', 
                //[models.Sequelize.fn('datediff',models.Sequelize.fn('date_format',models.Sequelize.fn('now'), '%Y%m%d'), models.Sequelize.fn('date_format', models.Sequelize.col('deadline'), '%Y%m%d')),'dday_cnt'],
                //'DATEDIFF(s, DATE_FROMAT(SYSDATE(), "%Y%m%d%H%i%s"), DATE_FORMAT(deadline, "%Y%m%d%H%i%s"))as dday_yn', 
                'reg_user_id',
                //'DATE_FORMAT(left(reg_dtm,8), "%m월 %d일") as reg_date',
                [models.Sequelize.fn('date_format',models.Sequelize.fn('left', models.Sequelize.col('reg_dtm'), 8), '%m월 %d일'), 'reg_date'],
                //'SUBSTR( _UTF8"일월화수목금토", DAYOFWEEK(left(reg_dtm,8)), 1) as reg_week',
                [models.Sequelize.fn('substr','_UTF8'+'"일월화수목금토"',models.Sequelize.fn('dayofweek',models.Sequelize.fn('left', models.Sequelize.col('reg_dtm'), 8)) , 1), 'reg_week'],
                [models.Sequelize.fn('date_format', models.Sequelize.col('reg_dtm'), '%H:%i'), 'reg_time'],
                //'DATE_FORMAT(left(deadline,8), "%m월 %d일") as dday_date',
                [models.Sequelize.fn('date_format',models.Sequelize.fn('left', models.Sequelize.col('deadline'), 8), '%m월 %d일'), 'dday_date'],
                //'SUBSTR( _UTF8"일월화수목금토", DAYOFWEEK(left(deadline,8)), 1) as dday_week',
                [models.Sequelize.fn('date_format', models.Sequelize.col('deadline'), '%H:%i'), 'dday_time'],
                [models.Sequelize.fn('substr', models.Sequelize.col('comment'), 20), 'comment'],
                'state',
                [models.Sequelize.col('user.id'), 'id'],
                [models.Sequelize.col('user.user_name'), 'user_name'],
                [models.Sequelize.col('user.user_img'), 'user_img'] 
            ], // 실제 결과 컬럼
            include : [ {
                model: user,
                as : 'user',
                where : {
                    id : {$col : 'vote_master.reg_user_id' } //여기에 id써야하는지 master.reg_user_id써야하는지
                },
                attributes : [
                    //'id',
                    //'user_name'
                    ]
            }],
            where : {
                vote_id : TEST_VOTE_ID//req.body.vote_id
            }, 
            order : [ ['deadline', 'DESC'] ]//state='P' 걸지 고민
            
        }).then(master_info => {
            data.master_info = master_info;
            
            console.log("**RESULT DATA : " + JSON.stringify(data));
        
            res.render('vote/votemain', {data : data, session : req.session});    
            
        }).catch(function(err) {
            console.log(err);
        });


        /******************************************************************************************************
         * user_id의 count(vote_detail.vote_id) as cnt -->  cnt = 0 : 투표하러가기 / cnt > 0 : 투표현황보러가기  
         * vote_detail에 다수개가 존재하므로 현재 보여지는 vote_master의 vote_id와 매핑 해줘야 한다 ->위에 조인걸어야 하나 
         * 
         * select 
         *        vd.vote_id,
         *        vd.user_id,
         *        count(vd.vote_id) AS cnt
         * from   vote_master a
         *        , vote_detail b
         * where  1=1
         * and    a.vote_id = b.vote_id
         * and    a.vote_id = :현재 클릭하는 vote_id
         * and    b.user_id = user_id //req.session.user_id
         * and    a.state   = 'P' 
         * ;
        *******************************************************************************************************/
         
        /* vote_master : vote_detail - M : N 관계 설정 셋팅(내가 투표했는지 여부 가져오기) */

        //vote_detail.hasMany(vote_master, {as: 'vote_master', foreignKey: 'vote_id', sourceKey: 'vote_id'});
        // vote_detail.belongsToMany(vote_master, {as: 'vote_master', foreignKey: 'vote_id', targetKey: 'vote_id'});
        // vote_master.belongsToMany(vote_detail, {as: 'vote_detail', foreignKey: 'vote_id', targetKey: 'vote_id'});
       
        // /* select */
        // vote_detail.findAll({
        //     raw : true,
        //     attributes : [
        //         'vote_id',
        //         'user_id',
        //         [ models.Sequelize.fn('count', models.Sequelize.col('vote_detail.user_id')), 'cnt' ]

        //     ], // 실제 결과 컬럼
        //     include : [ {
        //         model: vote_master,
        //         as : 'vote_master',
        //         where : {
        //             vote_id : {$col : 'vote_detail.vote_id' }
        //             //조건걸어야 한다 
        //         },
        //         attributes : []
        //     }], // INNER JOIN 테이블 설정
        //     where : {
        //         user_id : user_id//session.user_id INNER JOIN 테이블 설정
            
        // }).then(detail_info => {
        //     data.detail_info = detail_info;
            
        //     console.log("**RESULT DATA : " + JSON.stringify(data));
        
        //     res.render('vote/votemain', {data : data, session : req.session});    
            
        // }).catch(function(err) {
        //     console.log(err);
        // });
        

        
        });//app.get
    //});
}
