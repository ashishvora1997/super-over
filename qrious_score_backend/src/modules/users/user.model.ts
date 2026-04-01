import { Table, Column, Model } from 'sequelize-typescript';

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
}
