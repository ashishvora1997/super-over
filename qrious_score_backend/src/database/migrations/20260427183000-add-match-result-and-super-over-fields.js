'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('matches', 'result', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('matches', 'is_super_over', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('matches', 'super_over_number', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn('innings', 'is_super_over', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('innings', 'super_over_number', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn('innings', 'max_wickets', {
      type: Sequelize.INTEGER,
      defaultValue: 10,
    });

    await queryInterface.addColumn('matches', 'super_over_chasing_team_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('matches', 'result');
    await queryInterface.removeColumn('matches', 'is_super_over');
    await queryInterface.removeColumn('matches', 'super_over_number');
    await queryInterface.removeColumn('matches', 'super_over_chasing_team_id');
    await queryInterface.removeColumn('innings', 'is_super_over');
    await queryInterface.removeColumn('innings', 'super_over_number');
    await queryInterface.removeColumn('innings', 'max_wickets');
  },
};
