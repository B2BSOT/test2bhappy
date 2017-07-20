var models = require('../../models');
var datetime = require('node-datetime');

module.exports = function(app) {
    app.get('/quizboard/quizboard', function(req, res, next) {
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }

        models.quiz_board.findAll()
        .then(quizboards => {
            res.render('quizboard/quizboard', {data : quizboards, session : req.session});    
        });
    });
    
    app.post('/create', function(req, res, nex) {
        console.log("PUT quizboard/create");
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }
        
        var dt = datetime.create();
        var formattedDate = dt.format('YmdHMS') // YYYYMMDDHH24MISS
        
        models.sequelize.transaction(function (t) {
            models.quiz_board.create({
            subject: req.subject,
            content: req.content,
            reg_dtm: formattedDate,
            days: 2
            })
        }).then(function (result) {
          // Transaction has been committed
          // result is whatever the result of the promise chain returned to the transaction callback
          res.send({session : req.session});
          
        }).catch(function (err) {
          // Transaction has been rolled back
          // err is whatever rejected the promise chain returned to the transaction callback
          res.redirect('/');
        });

        
    });
}