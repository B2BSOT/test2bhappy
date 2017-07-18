'"use strict';

module.exports = function(sequelize, DataTypes) {
    var vote_master = sequelize.define('vote_master', {
                        vote_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        subject: {type: DataTypes.STRING, allowNull: false},
                        comment: {type: DataTypes.TEXT, allowNull: false},
                        reg_user_id: {type: DataTypes.INTEGER, allowNull: false},
                        reg_dtm: {type: DataTypes.STRING, allowNull: false},
                        deadline: {type: DataTypes.STRING, allowNull: false},
                        modify_dtm: {type: DataTypes.STRING, allowNull: false},
                        state: {type: DataTypes.STRING, allowNull: false},
                        parti_org_id: {type: DataTypes.STRING, allowNull: false},
                        multi_yn: {type: DataTypes.STRING, allowNull: false},
                        secret_yn: {type: DataTypes.STRING, allowNull: false},
                        add_item_yn: {type: DataTypes.STRING, allowNull: false},
                        noti_yn: {type: DataTypes.STRING, allowNull: false}
                    },{
                        classMethods: {},
                        tableName: 'vote_master',
                        freezeTableName: true,
                        underscored: true,
                        timestamps: false
                    });
                    
    return vote_master;
}