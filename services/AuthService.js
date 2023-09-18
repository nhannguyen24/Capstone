require("dotenv").config();
const db = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');

const hashPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(8));

const register = ({ email, password, confirmPass, roleId }) => new Promise(async (resolve, reject) => {
  try {
    if (confirmPass !== password) {
      resolve({
        mes: 'Confirm password does not match with password',
      })
    } else {
      const response = await db.User.findOrCreate({
        where: { email },
        defaults: {
          userName: email,
          password: hashPassword(password),
          email,
          avatar: 'https://t3.ftcdn.net/jpg/01/18/01/98/360_F_118019822_6CKXP6rXmVhDOzbXZlLqEM2ya4HhYzSV.jpg',
          roleId: '58c10546-5d71-47a6-842e-84f5d2f72ec3',
        }
      })
      resolve({
        status: response[1] ? 200 : 409,
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
    const response = await db.User.findOne({
      where: { email },
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
    delete response.password;

    resolve({
      status: accessToken ? 200 : 401,
      data: {
        msg: accessToken ? 'Login is successfully' : response ? 'Password is wrong' : 'Not found account',
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
      const response = await db.User.findOrCreate({
        where: { email },
        raw: true,
        nest: true,
        defaults: {
          userId: userId,
          userName: name,
          email: email,
          avatar: picture,
          roleId: "58c10546-5d71-47a6-842e-84f5d2f72ec3",
        },
      });
      // console.log("0",response);
      // console.log("1", response[0]);
      const user = await db.User.findOne({
        where: { email: email },
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

      const [accessToken, refreshToken] = await Promise.all([
        jwt.sign(
          {
            userId: response[0].userId,
            email: response[0].email,
            roleName: user.user_role.roleName,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        ),
        jwt.sign(
          { userId: response[0].userId },
          process.env.JWT_SECRET_REFRESH,
          { expiresIn: "1d" }
        ),
      ]);

      if (refreshToken) {
        await db.User.update(
          {
            refreshToken: refreshToken,
          },
          { where: { userId: response[0].userId } }
        );
      }

      resolve({
        status: accessToken ? 200 : 400,
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
              status: accessToken ? 200 : 400,
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
        status: response ? 200 : 400,
        data: {
          msg: "Logout successfully"
        }
      });
    } catch (error) {
      reject(error);
    }
  });

module.exports = { refreshAccessToken, logout, login, register, loginGoogle };
