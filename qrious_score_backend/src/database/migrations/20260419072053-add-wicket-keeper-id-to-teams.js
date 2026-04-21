'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teams', 'wicket_keeper_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'players',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('teams', 'wicket_keeper_id');
  }
};
