'use strict';


module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('password_resets');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('password_resets', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      token_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      createdAt: Sequelize.DATE,
    });
  },
};
