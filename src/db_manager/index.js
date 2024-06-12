const Sequelize = require("sequelize");
const { Model, DataTypes } = require("sequelize");
const { users_data } = require("./make_dummy");


const sequelize = new Sequelize("webservice", "root", "Dnfltkfkd0306", {
  host: "localhost",
  dialect: "mysql",
  });
  
class User extends Model {}
User.init({
    id:{
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize, // 우리가 사전에 DB접속을 위해 정의한 sequelize 객체
    modelName: "User",
});

// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("Connection has been established successfully.");
//     await User.sync({ force: true });

//     for(const user of users_data) {
//         await User.create(user);
//     }
//   } catch (error) {
//     console.log("Unable to connect to the database: ", error);
//   }
//   await sequelize.close();
//   console.log("Connection has been closed successfully.");
// })();

module.exports = { User, sequelize };