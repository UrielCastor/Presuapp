const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/infrastructure/database/prisma');

let token;

describe('Clients Endpoints', () => {
  beforeAll(async () => {
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.client.deleteMany();
    await prisma.serviceItem.deleteMany();
    await prisma.profession.deleteMany();
    await prisma.user.deleteMany();

    const u = await request(app).post('/api/auth/register').send({
      name: 'ClientUser', email: 'client@user.com', password: 'password'
    });
    token = u.body.data.token;
  });

  afterAll(async () => { await prisma.$disconnect(); });

  it('should create a client', async () => {
    const res = await request(app).post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Juan Perez', phone: '123456789' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Juan Perez');
  });
});
