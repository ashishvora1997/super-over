'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('matches', 'overs_per_side', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 20,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('matches', 'overs_per_side');
  },
};
