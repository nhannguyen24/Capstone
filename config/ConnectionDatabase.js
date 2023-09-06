const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('capstone_database_development', 'root', 'quan', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  timezone: '+07:00',
});

const connectionDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

connectionDatabase();
