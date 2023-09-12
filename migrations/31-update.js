module.exports = {
    up: function (queryInterface, Sequelize) {
        // logic for transforming into the new state
        return queryInterface.addColumn(
            'Prices',
            'day',
            {
                type: Sequelize.ENUM("Normal", "Weekend", "Holiday"),
                defaultValue: "Normal"
            },
        );

    },

    down: function (queryInterface, Sequelize) {
        // logic for reverting the changes
        return queryInterface.removeColumn(
            'Prices',
            'day'
        );
    }
}