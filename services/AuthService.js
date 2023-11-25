require("dotenv").config();
const db = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const { StatusCodes } = require("http-status-codes");
const redisClient = require("../config/RedisConfig")
const hashPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(8));

const register = ({ email, password, confirmPass, roleId }) => new Promise(async (resolve, reject) => {
  try {
    const _email = email.replace(/\s/g, '').toLowerCase()
    if (confirmPass !== password) {
      resolve({
        mes: 'Confirm password does not match with password',
      })
    } else {
      const response = await db.User.findOrCreate({
        where: { email: _email },
        defaults: {
          userName: _email,
          password: hashPassword(password),
          email: _email,
          avatar: 'https://t3.ftcdn.net/jpg/01/18/01/98/360_F_118019822_6CKXP6rXmVhDOzbXZlLqEM2ya4HhYzSV.jpg',
          roleId: '58c10546-5d71-47a6-842e-84f5d2f72ec3',
        }
      })
      resolve({
        status: response[1] ? StatusCodes.OK : StatusCodes.CONFLICT,
        data: {
          msg: response[1] ? 'Register successfully' : 'Email has already used',
        }
      })
    }

  } catch (error) {
    reject(error)
  }
})

const login = ({ email, password }) => new Promise(async (resolve, reject) => {
  try {
    const _email = email.replace(/\s/g, '').toLowerCase();
    const response = await db.User.findOne({
      where: { email: _email },
      raw: true,
      nest: true,
      attributes: {
        exclude: [
          "roleId",
          "status",
          "createdAt",
          "updatedAt",
          "refreshToken"
        ],
      },
      include: [
        {
          model: db.Role,
          as: "user_role",
          attributes: ["roleId", "roleName"],
        },
      ],
    })

    const isChecked = response && bcrypt.compareSync(password, response.password);
    const accessToken = isChecked
      ? jwt.sign({ userId: response.userId, email: response.email, roleName: response.user_role.roleName }, process.env.JWT_SECRET, { expiresIn: '1d' })
      : null
    // JWT_SECRET_REFRESH_TOKEN
    const refreshToken = isChecked
      ? jwt.sign({ id: response.id }, process.env.JWT_SECRET_REFRESH, { expiresIn: '1d' })
      : null

    // delete field password from response json
    if (response) {
      delete response.password;
    }

    resolve({
      status: accessToken ? StatusCodes.OK : 401,
      data: {
        msg: accessToken ? 'Login is successfully' : response ? 'Password is wrong' : 'Not found user account!',
        'accessToken': accessToken ? `${accessToken}` : accessToken,
        'refreshToken': refreshToken,
        user: isChecked ? response : null
      }
    })

    if (refreshToken) {
      await db.User.update(
        {
          refreshToken: refreshToken,
        },
        { where: { userId: response[0].userId } }
      );
    }
  } catch (error) {
    reject(error)
  }
})

const loginGoogle = ({ name, picture, userId, email }) =>
  new Promise(async (resolve, reject) => {
    try {
      const _email = email.replace(/\s/g, '').toLowerCase();
      const user = await db.User.findOne({
        where: { email: _email },
        raw: true,
        nest: true,
        attributes: {
          exclude: [
            "roleId",
            "status",
            "createdAt",
            "updatedAt",
            "refreshToken",
            "password"
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

      let response;
      if (user) {
        response = await db.User.update({
          userName: name,
          email: _email,
          avatar: picture,
          roleId: "58c10546-5d71-47a6-842e-84f5d2f72ec3"
        }, {
          where: {
            email: _email
          }
        });
      } else {
        response = await db.User.create({
          userId: userId,
          userName: name,
          email: _email,
          avatar: picture,
          roleId: "58c10546-5d71-47a6-842e-84f5d2f72ec3"
        });
      }

      const [accessToken, refreshToken] = await Promise.all([
        jwt.sign(
          {
            userId: response.userId,
            email: response.email,
            roleName: user.user_role.roleName,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        ),
        jwt.sign(
          { userId: response.userId },
          process.env.JWT_SECRET_REFRESH,
          { expiresIn: "1d" }
        ),
      ]);

      if (refreshToken) {
        await db.User.update(
          {
            refreshToken: refreshToken,
          },
          { where: { userId: response.userId } }
        );
      }

      resolve({
        status: accessToken ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
        data: {
          msg: "Login successfully",
          accessToken: accessToken ? `${accessToken}` : accessToken,
          refreshToken: refreshToken,
          user: user,
        }
      });

    } catch (error) {
      console.log(error);
      reject(error);
    }
  });

const refreshAccessToken = (refreshToken) =>
  new Promise(async (resolve, reject) => {
    try {
      const user = await db.User.findOne({
        where: { refreshToken },
        raw: true,
        nest: true,
        attributes: {
          exclude: ["roleId", "status", "createdAt", "updatedAt"],
        },
        include: [
          {
            model: db.Role,
            as: "user_role",
            attributes: ["roleName"],
          },
        ],
      });
      if (user) {
        jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH, (err) => {
          if (err) {
            resolve({
              mes: "Refresh token expired",
            });
          } else {
            const accessToken = jwt.sign(
              {
                userId: user.userId,
                email: user.email,
                roleName: user.user_role.roleName,
              },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );
            resolve({
              status: accessToken ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
              data: {
                msg: accessToken
                  ? "Create refresh token successfully"
                  : "Create refresh token unsuccessfully",
                accessToken: accessToken ? `${accessToken}` : accessToken,
                refreshToken: refreshToken,
              }
            });
          }
        });
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });

const logout = (userId) =>
  new Promise(async (resolve, reject) => {
    try {
      const user = await db.User.findOne({
        where: { userId },
        raw: true,
        nest: true,
        attributes: {
          exclude: ["roleId", "status", "createdAt", "updatedAt"],
        },
        include: [
          {
            model: db.Role,
            as: "user_role",
            attributes: ["roleName"],
          },
        ],
      });

      const response = await db.User.update(
        {
          refreshToken: null,
        },
        { where: { userId: user.userId } }
      );

      resolve({
        status: response ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
        data: {
          msg: "Logout successfully"
        }
      });
    } catch (error) {
      reject(error);
    }
  });

  const forgotPassword = async (req) => {
    try {
      const email = req.body.email
      const newPassword = req.body.newPassword
  
      const user = await db.User.findOne({
        where: {
          email: email
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
          userId: user.userId,
          otpType: OTP_TYPE.FORGOT_PASSWORD
        }
      })
      if (!otp) {
        return {
          status: StatusCodes.FORBIDDEN,
          data: {
            msg: `OTP not found!`,
          }
        }
      }
      if (!otp.isAllow) {
        return {
          status: StatusCodes.FORBIDDEN,
          data: {
            msg: `Action not allow, Please validate OTP!`,
          }
        }
      }
  
      const updateUser = await db.User.update({
        password: hashPassword(newPassword)
      }, {
        where: {
          email: email
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
  
      return {
        status: updateUser[0] > 0? StatusCodes.OK : StatusCodes.BAD_REQUEST,
        data: {
          msg:
            updateUser[0] > 0
              ? "Change password successfully"
              : "Cannot change password",
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
  

module.exports = { refreshAccessToken, logout, login, register, forgotPassword, loginGoogle };
