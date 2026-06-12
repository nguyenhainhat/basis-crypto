import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('API Integration & E2E (W9-W12)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/auth/nonce (GET) - generates cryptographically secure nonce', () => {
    return request(app.getHttpServer())
      .get('/api/v1/auth/nonce')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('nonce');
        expect(typeof res.body.nonce).toBe('string');
        expect(res.body.nonce.length).toBeGreaterThan(8);
      });
  });

  it('/api/v1/auth/verify (POST) - rejects tampered signatures', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/verify')
      .send({
        message: 'Tampered SIWE Message',
        signature: '0xbadsignature',
      })
      .expect(401);
  });
});
