const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const bcrypt = require('bcryptjs');
const mailer = require('../utils/MailerUtil');

const hashPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(8));

const getAllUsers = ({ page, limit, order, userName, email, status, roleName, ...query }) =>
  new Promise(async (resolve, reject) => {
    try {
      redisClient.get(`user_paging_${page}_${limit}_${order}_${userName}_${email}_${status}_${roleName}`, async (error, user_paging) => {
        if (user_paging != null) {
          resolve({
            status: 200,
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
            status: users ? 200 : 404,
            data: {
              msg: users ? "Got user" : "Cannot find user",
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
        status: user ? 200 : 404,
        data: {
          msg: user ? "Got user" : `Cannot find user with id: ${userId}`,
          user: user,
        }
      });
    } catch (error) {
      reject(error);
    }
  });

const createUser = ({ password, ...body }) =>
  new Promise(async (resolve, reject) => {
    try {
      const user = await db.User.findOrCreate({
        where: { email: body?.email },
        defaults: {
          password: hashPassword(password),
          avatar: "https://cdn-icons-png.flaticon.com/512/147/147144.png",
          maxTour: 10,
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
                  password: password,
                }
              ]
            },
            outro: "Rất mong được hợp tác với bạn!"
          }
        }

        mailer.sendMail(body?.email, "Thông tin tài khoản đăng nhập", response)
      }

      resolve({
        status: user[1] ? 200 : 400,
        data: {
          msg: user[1]
            ? "Create new user successfully"
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

const updateUser = ({ userId, ...body }) =>
  new Promise(async (resolve, reject) => {
    try {
      const users = await db.User.update(body, {
        where: { userId },
        individualHooks: true,
      });
      resolve({
        status: users[1].length !== 0 ? 200 : 400,
        data: {
          msg:
            users[1].length !== 0
              ? `User update`
              : "Cannot update user/ userId not found",
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
//           status: users[0] ? 200 : 400,
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

const deleteUser = (delUserId, userId) =>
  new Promise(async (resolve, reject) => {
    try {
      if (delUserId == userId) {
        resolve({
          msg: `Cannot delete user/ Account ${userId} is in use`,
        });
      } else {
        const findUser = await db.User.findOne({
          raw: true, nest: true,
          where: { userId: delUserId },
        });

          if (findUser.status === "Deactive") {
            resolve({
              status: 400,
              data: {
                msg: "The user already deactive!",
              }
            });
            return;
          }

        const users = await db.User.update(
          { status: "Deactive" },
          {
            where: { userId: delUserId },
            individualHooks: true,
          }
        );
        // console.log(users[0]);
        resolve({
          status: users[0] > 0 ? 200 : 400,
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


module.exports = {
  updateUser,
  deleteUser,
  createUser,
  getAllUsers,
  getUserById
};

