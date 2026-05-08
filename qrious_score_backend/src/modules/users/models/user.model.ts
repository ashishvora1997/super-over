import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'users' })
export class User extends Model {
  @Column
  declare name: string;

  @Column({ unique: true })
  declare email: string;

  @Column
  declare password: string;

  @Column({ defaultValue: 'viewer' })
  declare role: string;

  @Column({ defaultValue: false, allowNull: false })
  declare is_email_verified: boolean;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare email_otp: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare email_otp_expires_at: Date | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0, allowNull: false })
  declare email_otp_resend_count: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare email_otp_resend_reset_at: Date | null;
}
