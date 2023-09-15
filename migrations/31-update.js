module.exports = {
    up: function (queryInterface, Sequelize) {
        // logic for transforming into the new state
        return queryInterface.addColumn(
            'Buses',
            'isDoubleDecker',
            {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
        );

    },

    down: function (queryInterface, Sequelize) {
        // logic for reverting the changes
        return queryInterface.removeColumn(
            'Buses',
            'isDoubleDecker'
        );
    }
}