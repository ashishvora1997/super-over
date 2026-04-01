import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async getAllUsers() {
    return this.userModel.findAndCountAll();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({
      where: { email },
      attributes: ['id', 'name', 'email', 'password', 'role'],
    });
  }

  async findById(id: number) {
    return this.userModel.findByPk(id);
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.userModel.create(data);
  }
}
