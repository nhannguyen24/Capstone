const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const bcrypt = require('bcryptjs');

const hashPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(8));

const getAllUsers = ({ page, limit, order, userName, userId, email, ...query }) =>
  new Promise(async (resolve, reject) => {
    try {
      redisClient.get(`user_paging_${page}_${limit}_${order}_${userName}`, async (error, user_paging) => {
        if (error) console.error(error);
        if (user_paging != null) {
          resolve({
            msg: "Got user",
            user_paging: JSON.parse(user_paging),
          });
        } else {
          const queries = { raw: true, nest: true };
          const offset = !page || +page <= 1 ? 0 : +page - 1;
          const flimit = +limit || +process.env.LIMIT_POST;
          queries.offset = offset * flimit;
          queries.limit = flimit;
          if (order) queries.order = [order];
          else queries.order = [['updatedAt', 'DESC']];
          if (userName) query.userName = { [Op.substring]: userName };
          if (userId) query.userId = { [Op.substring]: userId };
          if (email) query.email = { [Op.substring]: email };
          // query.status = { [Op.ne]: "Deactive" };

          const users = await db.User.findAll({
            where: query,
            ...queries,
            attributes: {
              exclude: [
                "roleId",
                "createAt",
                "updateAt",
                "refreshToken",
              ],
            },
            include: [
              {
                model: db.Role,
                as: "user_role",
                attributes: ["roleId, roleName"],
              },
            ],
          });
          redisClient.setEx(`user_paging_${page}_${limit}_${order}_${userName}`, 3600, JSON.stringify(users));

          resolve({
            msg: users ? "Got user" : "Cannot find user",
            users: users,
          });
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
          ...body,
        },
      });
      resolve({
        msg: user[1]
          ? "Create new user successfully"
          : "Cannot create new user/ Email already exists",
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

const updateUser = ({ userId, email, ...body }) =>
  new Promise(async (resolve, reject) => {
    try {
      // const user = await db.User.findAll({
      //   where: {
      //     email: email,
      //     userId: {
      //       [Op.ne]: userId
      //     }
      //   }
      // })
      // if (user) {
      //   resolve({
      //     msg: "Email already exists"
      //   });
      // } else {
        const users = await db.User.update(body, {
          where: { userId },
        });
        resolve({
          msg:
            users[0] > 0
              ? `${users[0]} user update`
              : "Cannot update user/ userId not found",
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

const updateProfile = (body, userId) =>
  new Promise(async (resolve, reject) => {
    try {
      if (body.userId !== userId) {
        resolve({
          msg: "Can't update other people's account"
        });
      } else {
        const users = await db.User.update(body, {
          where: { userId: userId },
        });
        resolve({
          msg:
            users[0] > 0
              ? "Update profile successfully"
              : "Cannot update user/ userId not found",
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
      reject(error.message);
    }
  });

const deleteUser = (userIds, userId) =>
  new Promise(async (resolve, reject) => {
    try {
      if (userIds.includes(userId)) {
        resolve({
          msg: `Cannot delete user/ Account ${userId} is in use`,
        });
      } else {
        const users = await db.User.update(
          { status: "Deactive" },
          {
            where: { userId: userIds },
          }
        );
        resolve({
          msg:
            users > 0
              ? `${users} user delete`
              : "Cannot delete user/ userId not found",
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

// const getUserById = (userId) =>
//   new Promise(async (resolve, reject) => {
//     try {
//       const user = await db.User.findOne({
//         where: { userId: userId },
//         raw: true,
//         nest: true,
//         attributes: {
//           exclude: [
//             "roleId",
//             "createdAt",
//             "updatedAt",
//             "refreshToken",
//           ],
//         },
//         include: [
//           {
//             model: db.Role,
//             as: "userRole",
//             attributes: ["roleId", "roleName"],
//           },
//         ],
//       });
//       resolve({
//         msg: user ? "Got user" : `Cannot find user with id: ${userId}`,
//         user: user,
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });

// const getUserByEmail = (email) =>
//   new Promise(async (resolve, reject) => {
//     try {
//       const user = await db.User.findOne({
//         where: { email: email },
//         raw: true,
//         nest: true,
//         attributes: {
//           exclude: [
//             "roleId",
//             "createdAt",
//             "updatedAt",
//             "refreshToken",
//           ],
//         },
//         include: [
//           {
//             model: db.Role,
//             as: "userRole",
//             attributes: ["roleId", "roleName"],
//           },
//         ],
//       });
//       resolve({
//         msg: user ? "Found user" : `Not found user with email: ${email}`,
//         user: user,
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });


module.exports = {
  updateUser,
  deleteUser,
  createUser,
  getAllUsers,
  updateProfile
};

