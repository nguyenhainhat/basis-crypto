import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { WalletNormalizationInterceptor } from '../common/interceptors/wallet-normalization.interceptor';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(WalletNormalizationInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':walletAddress')
  @ApiOperation({ summary: 'Get user profile by wallet address' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Param('walletAddress') walletAddress: string) {
    return this.usersService.getProfile(walletAddress);
  }
}
