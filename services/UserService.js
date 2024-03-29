const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const bcrypt = require('bcryptjs');
const mailer = require('../utils/MailerUtil');
const OTP_TYPE = require('../enums/OtpTypeEnum')
const hashPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(8));
const OtpService = require('../services/OtpService');
const { StatusCodes } = require("http-status-codes");

const getAllUsers = ({ page, limit, order, userName, email, status, roleName, ...query }) =>
  new Promise(async (resolve, reject) => {
    try {
      let _email;
      if (email) {
        _email = email.replace(/\s/g, '').toLowerCase();
      }

      redisClient.get(`user_paging_${page}_${limit}_${order}_${userName}_${_email}_${status}_${roleName}`, async (error, user_paging) => {
        if (user_paging != null) {
          resolve({
            status: StatusCodes.OK,
            data: {
              msg: "Got user",
              user_paging: JSON.parse(user_paging),
            }
          });
        } else {
          const queries = { raw: true, nest: true };
          const queryRole = {};
          const offset = !page || +page <= 1 ? 0 : +page - 1;
          const flimit = +limit || +process.env.LIMIT_POST;
          queries.offset = offset * flimit;
          queries.limit = flimit;
          if (order) queries.order = [order];
          else queries.order = [['updatedAt', 'DESC']];
          if (userName) query.userName = { [Op.substring]: userName };
          if (email) query.email = { [Op.substring]: email };
          if (status) query.status = { [Op.eq]: status };
          if (roleName) queryRole.roleName = { [Op.eq]: roleName };
          // query.status = { [Op.ne]: "Deactive" };

          const users = await db.User.findAll({
            where: query,
            ...queries,
            attributes: {
              exclude: [
                "roleId",
                "refreshToken",
                "password"
              ],
            },
            include: [
              {
                model: db.Role,
                as: "user_role",
                where: queryRole,
                attributes: ["roleId", "roleName"],
              },
            ],
          });
          redisClient.setEx(`user_paging_${page}_${limit}_${order}_${userName}_${email}_${status}_${roleName}`, 3600, JSON.stringify(users));


          resolve({
            status: StatusCodes.OK,
            data: {
              msg: users.length > 0  ? "Got user" : "User not found!",
              users: users,
            }
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });

const getUserById = (userId) =>
  new Promise(async (resolve, reject) => {
    try {
      const user = await db.User.findOne({
        where: { userId: userId },
        raw: true,
        nest: true,
        attributes: {
          exclude: [
            "roleId",
            "createdAt",
            "updatedAt",
            "refresh_token",
          ],
        },
        include: [
          {
            model: db.Role,
            as: "user_role",
            attributes: ["roleId", "roleName"],
          },
        ],
      });
      resolve({
        status: user ? StatusCodes.OK : StatusCodes.NOT_FOUND,
        data: {
          msg: user ? "Got user" : `Cannot find user with id: ${userId}`,
          user: user,
        }
      });
    } catch (error) {
      reject(error);
    }
  });

const createUser = ({ ...body }) =>
  new Promise(async (resolve, reject) => {
    try {
      const genPassword = generateRandomString(6)
      const user = await db.User.findOrCreate({
        where: { email: body?.email },
        defaults: {
          password: hashPassword(genPassword),
          avatar: "https://cdn-icons-png.flaticon.com/512/147/147144.png",
          maxTour: 12,
          deviceToken: "fgUsxMT4SkacqJBiDKZ1Lk:APA91bE0QeJytP3zfmUhZqUFfT6e9j9XyxNWqVJNNv2GLyMOjEY5A3mq4idmXhQZCze1p-JbZZt8ddcFcCD9AVNzzMvZxi-SE19x54_CqqDoqSRI1P5dPutLBzmSri4yQs2sxc5PO3a_",
          ...body,
        },
      });

      if (user[1]) {
        let response = {
          body: {
            name: body.userName,
            intro: "Đây là thông tin tài khoản của bạn!",
            table: {
              data: [
                {
                  email: body.email,
                  password: genPassword,
                }
              ]
            },
            outro: "Rất mong được hợp tác với bạn!"
          }
        }

        mailer.sendMail(body?.email, "Thông tin tài khoản đăng nhập", response)
      }

      resolve({
        status: user[1] ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
        data: {
          msg: user[1]
            ? "Create new account successfully"
            : "Cannot create new user/ Email already exists",
        }
      });
      redisClient.keys('user_paging*', (error, keys) => {
        if (error) {
          console.error('Error retrieving keys:', error);
          return;
        }
        // Delete each key individually
        keys.forEach((key) => {
          redisClient.del(key, (deleteError, reply) => {
            if (deleteError) {
              console.error(`Error deleting key ${key}:`, deleteError);
            } else {
              console.log(`Key ${key} deleted successfully`);
            }
          });
        });
      });

    } catch (error) {
      reject(error);
    }
  });

const updateUser = (id, body) =>
  new Promise(async (resolve, reject) => {
    try {
      const users = await db.User.update(body, {
        where: { userId: id },
        individualHooks: true,
      });
      resolve({
        status: users[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
        data: {
          msg:
            users[1].length !== 0
              ? `User update successfully!`
              : "Cannot update user/ id not found!",
        }
      });
      redisClient.keys('user_paging*', (error, keys) => {
        if (error) {
          console.error('Error retrieving keys:', error);
          return;
        }
        // Delete each key individually
        keys.forEach((key) => {
          redisClient.del(key, (deleteError, reply) => {
            if (deleteError) {
              console.error(`Error deleting key ${key}:`, deleteError);
            } else {
              console.log(`Key ${key} deleted successfully`);
            }
          });
        });
      });

    } catch (error) {
      reject(error.message);
    }
  });

// const updateProfile = (body, userId) =>
//   new Promise(async (resolve, reject) => {
//     try {
//       if (body.userId !== userId) {
//         resolve({
//           msg: "Can't update other people's account"
//         });
//       } else {
//         const users = await db.User.update(body, {
//           where: { userId: userId },
//           individualHooks: true,
//         });
//         resolve({
//           status: users[0] ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
//           data: {
//             msg:
//               users[0] > 0
//                 ? "Update profile successfully"
//                 : "Cannot update user/ userId not found",
//           }
//         });
//         redisClient.keys('user_paging*', (error, keys) => {
//           if (error) {
//             console.error('Error retrieving keys:', error);
//             return;
//           }
//           // Delete each key individually
//           keys.forEach((key) => {
//             redisClient.del(key, (deleteError, reply) => {
//               if (deleteError) {
//                 console.error(`Error deleting key ${key}:`, deleteError);
//               } else {
//                 console.log(`Key ${key} deleted successfully`);
//               }
//             });
//           });
//         });

//       }
//     } catch (error) {
//       reject(error.message);
//     }
//   });

const deleteUser = (id, userId) =>
  new Promise(async (resolve, reject) => {
    try {
      if (id == userId) {
        resolve({
          msg: `Cannot delete user/ Account ${userId} is in use`,
        });
      } else {
        const findUser = await db.User.findOne({
          raw: true, nest: true,
          where: { userId: id },
        });

        if (findUser.status === "Deactive") {
          resolve({
            status: StatusCodes.BAD_REQUEST,
            data: {
              msg: "The user already deactive!",
            }
          });
          return;
        }

        const users = await db.User.update(
          { status: "Deactive" },
          {
            where: { userId: id },
            individualHooks: true,
          }
        );
        // console.log(users[0]);
        resolve({
          status: users[0] > 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
          data: {
            msg:
              users[0] > 0
                ? `${users[0]} user delete`
                : "Cannot delete user/ userId not found",
          }
        });
        redisClient.keys('user_paging*', (error, keys) => {
          if (error) {
            console.error('Error retrieving keys:', error);
            return;
          }
          // Delete each key individually
          keys.forEach((key) => {
            redisClient.del(key, (deleteError, reply) => {
              if (deleteError) {
                console.error(`Error deleting key ${key}:`, deleteError);
              } else {
                console.log(`Key ${key} deleted successfully`);
              }
            });
          });
        });

      }
    } catch (error) {
      reject(error);
    }
  });

const changeUserPassword = async (req) =>{
    try {
      const userId = req.user.userId
      const newPassword = req.body.newPassword

      const user = await db.User.findOne({
        where: {
          userId: userId
        }
      })

      if (!user) {
        return {
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: "User not found!"
          }
        }
      }

      const otp = await db.Otp.findOne({
        where: {
          userId: userId,
          otpType: OTP_TYPE.CHANGE_PASSWORD
        }
      })

      if (!otp) {
        return {
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: `Action not allow, Please validate OTP!`,
          }
        }
      }
      if (!otp.isAllow) {
        return {
          status: 403,
          data: {
            msg: `Action not allow, Please validate OTP!`,
          }
        }
      }

      const updateUser = await db.User.update({
        password: hashPassword(newPassword)
      }, {
        where: {
          userId: userId
        }, individualHooks: true
      })

      redisClient.keys('user_paging*', (error, keys) => {
        if (error) {
          console.error('Error retrieving keys:', error);
          return;
        }
        // Delete each key individually
        keys.forEach((key) => {
          redisClient.del(key, (deleteError, reply) => {
            if (deleteError) {
              console.error(`Error deleting key ${key}:`, deleteError);
            } else {
              console.log(`Key ${key} deleted successfully`);
            }
          })
        })
      })

      return{
        status: updateUser[0] > 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
        data: {
          msg:
            updateUser[0] > 0
              ? "Change password successfully"
              : "Failed change password",
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

module.exports = {
  updateUser,
  deleteUser,
  createUser,
  changeUserPassword,
  getAllUsers,
  getUserById
};

