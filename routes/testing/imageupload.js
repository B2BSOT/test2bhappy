module.exports = function(app, connectionPool) {



    app.get('/testing/imageupload', function(req, res, next) {

        /* session 없을 땐 로그인 화면으로 */
        if (!req.session.user_name) {
            res.redirect('/');

        }

        console.log("session : " + req.session.user_name + " / " + req.session.emp_num);


    });


}