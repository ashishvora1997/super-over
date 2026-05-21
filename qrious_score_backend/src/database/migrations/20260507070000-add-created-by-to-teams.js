'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('teams');

    if (!tableInfo.created_by) {
      await queryInterface.addColumn('teams', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });

      await queryInterface.sequelize.query(
        `UPDATE teams SET created_by = user_id WHERE user_id IS NOT NULL`,
      );
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('teams');

    if (tableInfo.created_by) {
      await queryInterface.removeColumn('teams', 'created_by');
    }
  },
};
