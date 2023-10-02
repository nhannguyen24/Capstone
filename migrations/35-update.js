// module.exports = {
//     up: (queryInterface, Sequelize) => {
//         return queryInterface.sequelize.transaction((t) => {
//             return Promise.all([
//                 queryInterface.addColumn('schedules', 'date', {
//                     type: Sequelize.DATEONLY
//                 }, { transaction: t }),
//                 queryInterface.addColumn('schedules', 'startTime', {
//                     type: Sequelize.TIME,
//                 }, { transaction: t }),
//                 queryInterface.addColumn('schedules', 'endTime', {
//                     type: Sequelize.TIME,
//                 }, { transaction: t })
//             ])
//         })
//     },

//     down: (queryInterface, Sequelize) => {
//         return queryInterface.sequelize.transaction((t) => {
//             return Promise.all([
//                 queryInterface.removeColumn('schedules', 'date', { transaction: t }),
//                 queryInterface.removeColumn('schedules', 'startTime', { transaction: t }),
//                 queryInterface.removeColumn('schedules', 'endTime', { transaction: t })
//             ])
//         })
//     }
// };

module.exports = {
    up: function(queryInterface, Sequelize) {
      // logic for transforming into the new state
      return queryInterface.addColumn(
        'Pointofinterests',
        'file',
       Sequelize.STRING(1000)
      );
  
    },
  
    down: function(queryInterface, Sequelize) {
      // logic for reverting the changes
      return queryInterface.removeColumn(
        'Pointofinterests',
        'file'
      );
    }
  }