'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('points_table', 'runs_scored', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('points_table', 'balls_faced', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('points_table', 'runs_conceded', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('points_table', 'balls_bowled', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('points_table', 'runs_scored');
    await queryInterface.removeColumn('points_table', 'balls_faced');
    await queryInterface.removeColumn('points_table', 'runs_conceded');
    await queryInterface.removeColumn('points_table', 'balls_bowled');
  },
};
