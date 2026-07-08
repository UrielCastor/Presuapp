const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/infrastructure/database/prisma');

let token;

describe('Professions Endpoints', () => {
  beforeAll(async () => {
    await prisma.profession.deleteMany();
    await prisma.user.deleteMany();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Pro User',
      email: 'pro@user.com',
      password: 'password'
    });
    token = res.body.data.token;
  });

  afterAll(async () => { await prisma.$disconnect(); });

  it('should create a new profession', async () => {
    const res = await request(app).post('/api/professions')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Electricista', description: 'Obras' });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Electricista');
  });

  it('should get professions', async () => {
    const res = await request(app).get('/api/professions').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
