'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('players', 'playing_role', {
      type: Sequelize.ENUM(
        'top_order_batter',
        'middle_order_batter',
        'opening_batter',
        'wicket_keeper_batter',
        'wicket_keeper',
        'bowler',
        'all_rounder',
        'lower_order_batter',
        'none',
      ),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('players', 'playing_role', {
      type: Sequelize.ENUM(
        'top_order_batter',
        'middle_order_batter',
        'opening_batter',
        'wicket_keeper_batter',
        'wicket_keeper',
        'bowler',
        'all_rounder',
        'lower_order_batter',
        'none',
      ),
      allowNull: false,
    });
  },
};
