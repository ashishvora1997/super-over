'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('matches', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('matches', 'overs_per_bowler', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn('matches', 'tournament_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'tournaments', key: 'id' },
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('matches', 'created_by');
    await queryInterface.removeColumn('matches', 'overs_per_bowler');
    await queryInterface.changeColumn('matches', 'tournament_id', {
      type: require('sequelize').INTEGER,
      allowNull: false,
    });
  },
};
