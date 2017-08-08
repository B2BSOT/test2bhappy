'"use strict';

module.exports = function(sequelize, DataTypes) {
    var com_org = sequelize.define('com_org', {
<<<<<<< HEAD
                        org_id:       {type: DataTypes.INTEGER, primaryKey: true},
                        org_nm:       {type: DataTypes.STRING, allowNull: true},
                        org_level:    {type: DataTypes.INTEGER, allowNull: false},
                        upper_org_id: {type: DataTypes.INTEGER, allowNull: false},
                    },{
                        classMethods: {},
                        tableName: 'com_org',
                        freezeTableName: true,
                        underscored: true,
                        timestamps: false
                    });
                    
    return com_org;
}
=======
                        org_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        org_nm: {type: DataTypes.STRING, allowNull: false},
                        org_level: {type: DataTypes.INTEGER, allowNull: false},
                        upper_org_id: {type: DataTypes.INTEGER, allowNull: false}
                    },{
                        classMethods: {},
                        tableName: 'com_org', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true, // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return com_org;
}
>>>>>>> b3b159e9905dc2c09622b9ac59ce1e2ab36bad57
