import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsNotEmpty, IsString } from 'class-validator';

class VerifyDto {
  @ApiProperty({ description: 'The SIWE message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'The signature of the SIWE message' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  @ApiOperation({ summary: 'Get a random nonce for SIWE' })
  async getNonce() {
    return { nonce: await this.authService.getNonce() };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify SIWE signature and issue JWT' })
  @ApiResponse({ status: 201, description: 'JWT issued successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async verify(@Body() body: VerifyDto) {
    const accessToken = await this.authService.verifySignature(body.message, body.signature);
    return { access_token: accessToken };
  }
}
