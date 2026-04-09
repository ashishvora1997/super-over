import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { successResponse } from 'src/common/utils/response.util';
import { SuccessResponse } from 'src/common/types/response.type';

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

  async getAllUsers(page = 1, limit = 10): Promise<SuccessResponse<User[]>> {
    const offset = (page - 1) * limit;

    const { rows, count } = await this.userModel.findAndCountAll({
      attributes: ['id', 'name', 'email', 'role'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return successResponse('Users retrieved successfully', rows, {
      total: count,
      page,
      pageSize: limit,
    });
  }

  async updateRole(id: number, role: string) {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (role === 'admin') {
      throw new BadRequestException('Cannot assign admin role');
    }

    if (user.role === role) {
      throw new BadRequestException('User already has this role');
    }

    await user.update({ role });

    return successResponse('User role updated successfully', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }
}
