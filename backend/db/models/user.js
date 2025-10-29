'use strict';
const { validator } = require('sequelize');

const bcrypt = require('bcryptjs')


const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // Returns an object with the User instance information
    toSafeObject(){
      const { id, username, email } = this;
      return { id, username, email};
    }

    //password validator

    validatePassword(password){
      return bcrypt.compareSync(password, this.hashedPassword.toString())
    }

    // static method to get user by id
    static getCurrentUserById(id){
      return User.scope('currentUser').findByPk(id);
    }

    // static method for login
    static async login({ credential, password }){
      const { Op } = require('sequelize');
      const user = await User.scope('loginUser').findOne({
        where: {
          [Op.or]: {
             username: credential,
             email: credential
          }
        }
    });

      // if a user is found and their password matches return their info scoped

      if(user && user.validatePassword(password)){
        return await User.scope('currentUser').findAndCountAll(user.id)
      }
    }

    // Static method for signup
    static async signup({ username, email, password}){
      const hashedPassword = bcrypt.hashSync(password);
      const user = await User.create({
        username,
        email,
        hashedPassword
      })

      return await User.scope('currentUser').findByPk(user.id)
    }
  


    static associate(models) {
      // define association here
    }
  }
  User.init({
  username: {
    type:DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [4,30],
      isNotEmail(value){
        if(validator.isEmail(value)){
          throw new Error("Cannot be an email")
        }
      }
    }
  },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 256]
      }
    },
    hashedPassword:{
      type: DataTypes.STRING.BINARY,
      allowNull: false,
      validate: {
        len:[60, 60]
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    defaultScope: {
      attributes: {
        exclude: ["hashedPassword", "email", "createdAt", "updatedAt"]
      }
    },
    scopes: {
      currentUser: {
        attributes: { exclude: ["hashedPassword"]}
      },
      loginUser: {
        attributes: {}
      }
    }
  });
  return User;
};
