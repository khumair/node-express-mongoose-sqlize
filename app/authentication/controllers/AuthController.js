import jwt from 'jsonwebtoken'
import MongoModels from '../../db/mongo/models'
import UserController from '../../mongo/controllers/UserController'
import MesssageProvider from '../../../messages/MesssageProvider'
import Messages from '../../../messages/Messages'

const User = MongoModels.UserModel

// register user
const register = (request, response) => {
  if (UserController.isValidUser(request)) {
    // insert only if we have required data
    // we can find by username or email
    // because they are unique
    // insert only if user not exist
    let email = request.body.email || ''
    User.findOne({ email: email }, (error, user) => {
      // insert only if user not exist
      if (error) {
        response
          .status(401)
          .send({
            success: false,
            message: error.message
          })
      } else {
        if (!user) {
          const userModel = UserController.UserFromRequest(request)
          userModel.save((error) => {
            if (error) {
              response
                .status(401)
                .send({
                  success: false,
                  message: error.message
                })
            } else {
              response
                .status(200)
                .send({
                  success: false,
                  user: userModel
                })
            }
          })
        } else {
          response
            .status(401)
            .send({
              success: false,
              message: MesssageProvider
                .messageByKey(Messages.USER_ALREADY_EXIST)
            })
        }
      }
    })
  } else {
    return response
      .status(401)
      .send({
        success: false,
        message: MesssageProvider
          .messageByKey(Messages.VERIFY_REQUIRED_INFORMATION)
      })
  }
}

// login user
const login = async (request, response) => {
  let email = request.body.email || ''
  let password = request.body.password || ''
  if (email && password) {
    User.findOne({ email: email }, (error, user) => {
      // insert only if user not exist 
      if (error) {
        response.status(401).send({
          success: false,
          message: error.message
        })
      } else {
        if (!user) {
          response.status(401).send({
            success: false,
            message: MesssageProvider
              .messageByKey(Messages.USER_NOT_EXIST)
          })
        } else {
          // check if password matches 
          user.comparePassword(password, (error, isMatch) => {
            if (isMatch && !error) {

              // if user is found and password is right create a token
              //algorithm: process.env.JWT_TOKEN_HASH_ALGO 
              const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET_OR_KEY, {
                expiresIn: process.env.JWT_TOKEN_EXPIRATION
              })

              // return the information including token as JSON
              response
                .status(200)
                .send({
                  success: true,
                  user: user,
                  token: process.env.JWT_TOKEN_PREFIX + token
                })
            } else {
              response
                .status(401)
                .send({
                  success: false,
                  message: MesssageProvider
                    .messageByKey(Messages.WRONG_PASSWORD)
                })
            }
          })
        }
      }
    })
  } else {
    return response
      .status(401)
      .send({
        success: false,
        message: MesssageProvider
          .messageByKey(Messages.VERIFY_REQUIRED_INFORMATION)
      })
  }
}

// logout user will be on front part
// remove token

// export auth controller
const AuthController = {
  register,
  login
}

export default AuthController
