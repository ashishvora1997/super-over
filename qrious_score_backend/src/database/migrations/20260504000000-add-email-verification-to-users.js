'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('users', 'email_otp', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'email_otp_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'email_otp_resend_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('users', 'email_otp_resend_reset_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'is_email_verified');
    await queryInterface.removeColumn('users', 'email_otp');
    await queryInterface.removeColumn('users', 'email_otp_expires_at');
    await queryInterface.removeColumn('users', 'email_otp_resend_count');
    await queryInterface.removeColumn('users', 'email_otp_resend_reset_at');
  },
};
