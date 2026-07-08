const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/infrastructure/database/prisma');

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.client.deleteMany();
    await prisma.serviceItem.deleteMany();
    await prisma.profession.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should login user and return token', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'login@example.com',
      password: 'password123'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });
});
