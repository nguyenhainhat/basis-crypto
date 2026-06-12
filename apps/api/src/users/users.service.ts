import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async getProfile(walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();
    const user = await this.userRepository.findByWalletAddress(normalizedAddress);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOrCreateUser(walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();
    let user = await this.userRepository.findByWalletAddress(normalizedAddress);
    if (!user) {
      user = await this.userRepository.create({
        walletAddress: normalizedAddress,
      });
    }
    return user;
  }
}
