'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teams', 'captain_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('teams', 'captain_email', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('teams', 'captain_email');
    await queryInterface.removeColumn('teams', 'captain_name');
  },
};
