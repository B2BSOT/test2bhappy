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
    
        /*  
         *  0. 이전 vote main화면에서 vote_id, parti_org_id 를 넘겨준다고 가정
         *  1.session의 user_id가 해당투표 가능조직인지 다시 체크(url주소를 쳐서 들어오는 것을 방지)
         *  2.해당 vote_id로 vote_main, vote_items, vote_detail 조회
         */
        
        /* 1.session user_id 체크 */
        // session의 user_id 
        var user_id = req.session.user_id;
        
        console.log("VoteMain step1");
        
        models.user.count({ 
            where: {
                'id': user_id,
                $or:[
                    {'team_id': TEST_PARTI_ORG_ID},//req.body.parti_org_id
                    {'sm_id': TEST_PARTI_ORG_ID},//req.body.parti_org_id
                ]
            }
        }).then(c => {
            console.log("step1 result: " + c);
            
            if(c == 0) {
                res.render('/vote/votemain');
            }
        });
        

        /******************************************************************************************************
         * select a.subject 
         *        ,to_char(sysdate,'yyyymmdd') - substr(a.deadline,0,8) as dday//state='P'에 대한 D-day 보여줄 때
         *        ,b.user_img
         *        ,a.reg_user_id
         *        ,a.reg_dtm
         *        ,a.comment
         *        ,a.state // P:진행중, C:마감
         * from   vote_master a
         *        ,user b
         * where  1=1
         * and    a.reg_user_id = b.id
         * ;
        *******************************************************************************************************/
        /* vote_master : user - M : N 관계 설정 셋팅(등록자 정보 및 등록 투표 정보 조회) */
        vote_master.hasMany(user, {as: 'user', foreignKey: 'id', sourceKey: 'reg_user_id'});
        user.belongsToMany(vote_master, {as: 'vote_master', foreignKey: 'reg_user_id', targetKey: 'id'});
        
        /******************************************************************************************************
         * 코드값이 없으면 nvl(서브쿼리)...아무리봐도 vote_detail.vote_yn 생성해야 함 !!!
         * select  
         *        case when
         *        a.state = 'P' and b.user_id is null then b.vote_yn = 'N' //투표하러가기
         *        when
         *        a.state = 'P' and b.user_id is not null then b.vote_yn = 'Y' //투표현황보러가기
         *        else ....
         *        end as vote_yn
         * from   vote_master a
         *        , vote_detail b
         * where  1=1
         * and    a.vote_id = b.vote_id
         * and    b.user_id = session.user_id
         * ;
        *******************************************************************************************************/
         
        /* vote_master : vote_detail - M : N 관계 설정 셋팅(내가 투표했는지 여부 가져오기) */
        vote_master.hasMany(vote_detail, {as: 'vote_detail', foreignKey: 'vote_id', sourceKey: 'vote_id'});
        vote_detail.belongsToMany(vote_master, {as: 'vote_master', foreignKey: 'vote_id', targetKey: 'vote_id'});
        

});
}