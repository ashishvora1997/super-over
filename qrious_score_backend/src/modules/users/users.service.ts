import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.userModel.create(data);
  }

  async getAllUsers(): Promise<{ rows: User[]; count: number }> {
    return this.userModel.findAndCountAll({
      attributes: ['id', 'name', 'email', 'role'],
      order: [['createdAt', 'DESC']],
    });
  }
}
