module.exports = function common() {
    this.setMileage = function(req, connection) {
        var path = req.path;
        console.log('req path : ' + path);
             
        connection.query('select * from com_mileage' +
                         ' where route_path = ?;', path, function(error, rows) {
            
            if(error) {
                return new Error("Error in setMileage : " + error);
            }else {
                if(rows.length > 0) {
                    var mileage = rows[0].mileage;
                    var type = rows[0].use_type;
                    
                    if(type=='D') mileage *= -1;
                    
                    console.log('mileage / type : ' + mileage + ' / ' + type);
                    
                    connection.query('update user' +
                                     '   set mileage = mileage +  convert(?, signed)' + 
                                     ' where id = ?;',[mileage, req.session.user_id], function(error, user) {
                        if(error) {
                            return new Error("Error of set User Mileage : " + error);
                        }else { 
                            return;
                        }
                    });
                }else {
                    return;
                }
            }
        });
    }
    
    this.sendMail = function(maildata) {
        var nodemailer = require('nodemailer');
        var sgTransport = require('nodemailer-sendgrid-transport');
        var hbs = require('nodemailer-express-handlebars');
        
        // set handlebars
        var hbs_options = {
            viewEngine: {
                extname: '.hbs',
                layoutsDir: 'views/maillayouts/',
                defaultLayout : 'template',
                partialsDir : 'views/maillayouts/partials'
            },
            viewPath: 'views/maillayouts/',
            extName: '.hbs'
        };
        
        // create reusable transporter object using the default SMTP transport
        var smtp_options = {
            auth: {
                api_key: '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'
            }
        }
        
        var mailer = nodemailer.createTransport(sgTransport(smtp_options));

        // mail형식의 compiler로 handlebars를 사용하도록 설정        
        mailer.use('compile', hbs(hbs_options));
        
        // send mail
        mailer.sendMail(setMailOptions(maildata), function(err, res) {
            if (err) { 
                console.log(err) 
            }else {
                console.log('Message sent');
            }
        });
    }
    
    function setMailOptions(maildata) {
        /* set mail options
           from - 송신메일주소
           to - 수신메일주소
           subject - 메일제목
           template - 템플릿이름(views/maillayouts/내의 hbs파일이름만)
           context - 템플릿 내의 변수
        */
        var mailOptions = {};
        
        mailOptions.from = '2bhappymanager@gmail.com';
        
        switch (maildata.type) {
            case 'HDREG':
                const day = maildata.starthappyday;
                
                mailOptions.to = "ljw82@sk.com";
                mailOptions.subject = "[NEW HAPPYDAY] " + maildata.happyday_name;
                mailOptions.template = "reghappyday";
                mailOptions.context = {
                    user_name: maildata.user_name,
                    happyday_dt: day.substring(0,4)+"/"+day.substring(4,6)+"/"+day.substring(6,8),
                    contents: maildata.happyday_contents,
                    req_point: maildata.req_point+"P",
                    place_name: maildata.place_name        
                };
                
                break;
            case 'HDCANCEL':
                var userList = maildata.userList;
                var emails = "";
                for(var i=0; i<userList.length; i++) {
                    emails += userList[i].email;
                    emails += ";";
                }
                mailOptions.to = emails;
                mailOptions.subject = "[CANCEL HAPPYDAY] " + maildata.happyday_name;
                mailOptions.template = "delhappyday";
                mailOptions.context = {
                    happyday_name: maildata.happyday_name,
                };
                
                break;
            
            default:
                // code
        }
        
        return mailOptions;
    }
    
    /*
    이미지 삽입 시 사용할 공통function
    (단순 값 set후에 insert역할)
    onPage : 이미지 삽입하는 화면
    imageUrl : 업로드 성공후 실제로 올라간 url
    deleteHash : 삭제 api 호출을 위한 값
    */
    function insertImage(onPage, imageUrl, deleteHash){
        
        
    }
    /*
    이미지 삭제 시 사용할 공통function
    (url을 키값으로 delete api호출 후에 이미지 삭제 후 isDeleted 값 Y로 변경)
    DB에서 delete할 수 있지만 혹시 삭제가 잘 안될 경우를 대비해 url남기기 위해..
    
    imageUrl : 업로드 성공후 실제로 올라간 url(키값으로 활용)
    */
    function deleteImage(imageUrl){
        
    }
    
}
// var common = {};
// common.setMileage = setMileage;
// module.exports = common;


