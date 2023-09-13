module.exports = {
    up: function (queryInterface, Sequelize) {
        // logic for transforming into the new state
        return queryInterface.addColumn(
            'Tours',
            'tourStatus',
            {
                type: Sequelize.ENUM('OnTour', 'Canceled', 'Completed'),
                defaultValue: "OnTour"
            },
        );

    },

    down: function (queryInterface, Sequelize) {
        // logic for reverting the changes
        return queryInterface.removeColumn(
            'Tours',
            'tourStatus'
        );
    }
}