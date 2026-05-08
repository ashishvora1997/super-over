'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'email_otp', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'email_otp', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });
  },
};
