import { Controller, Post, Get, Body, Param, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { KudosService } from './kudos.service';
import { WalletNormalizationInterceptor } from '../common/interceptors/wallet-normalization.interceptor';
import { IsNotEmpty, IsString, IsEthereumAddress } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserSession } from '../auth/decorators/current-user.decorator';

class SendKudosDto {
  @ApiProperty({ example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', description: 'Ethereum address of the receiver' })
  @IsEthereumAddress()
  receiverAddress: string;

  @ApiProperty({ example: 'Great work on the smart contracts!', description: 'Appreciation message' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

@ApiTags('Kudos')
@ApiBearerAuth()
@Controller('kudos')
@UseInterceptors(WalletNormalizationInterceptor)
export class KudosController {
  constructor(private readonly kudosService: KudosService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send Kudos to another user' })
  @ApiResponse({ status: 201, description: 'Kudos sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input or self-gifting' })
  async sendKudos(@CurrentUser() user: UserSession, @Body() body: SendKudosDto) {
    return this.kudosService.sendKudos(user.walletAddress, body.receiverAddress, body.message);
  }

  @Get('received/:walletAddress')
  @ApiOperation({ summary: 'Get all Kudos received by a user' })
  @ApiResponse({ status: 200, description: 'List of received Kudos' })
  async getReceived(@Param('walletAddress') walletAddress: string) {
    return this.kudosService.getReceivedKudos(walletAddress);
  }
}
