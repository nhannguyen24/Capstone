module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn('schedules', 'date', {
                    type: Sequelize.DATEONLY
                }, { transaction: t }),
                queryInterface.addColumn('schedules', 'startTime', {
                    type: Sequelize.TIME,
                }, { transaction: t }),
                queryInterface.addColumn('schedules', 'endTime', {
                    type: Sequelize.TIME,
                }, { transaction: t })
            ])
        })
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.removeColumn('schedules', 'date', { transaction: t }),
                queryInterface.removeColumn('schedules', 'startTime', { transaction: t }),
                queryInterface.removeColumn('schedules', 'endTime', { transaction: t })
            ])
        })
    }
};