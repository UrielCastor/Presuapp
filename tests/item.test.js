const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/infrastructure/database/prisma');

let token;
let professionId;

describe('Service Items Endpoints', () => {
  beforeAll(async () => {
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.client.deleteMany();
    await prisma.serviceItem.deleteMany();
    await prisma.profession.deleteMany();
    await prisma.user.deleteMany();

    const u = await request(app).post('/api/auth/register').send({
      name: 'ItemUser', email: 'item@user.com', password: 'password'
    });
    token = u.body.data.token;
    
    const p = await request(app).post('/api/professions')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plomero' });
    professionId = p.body.data.id;
  });

  afterAll(async () => { await prisma.$disconnect(); });

  it('should create an item', async () => {
    const res = await request(app).post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Reparar', price: 1500, professionId });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Reparar');
  });

  it('should limit to max 10 items per profession', async () => {
    for(let i = 0; i < 9; i++) {
      await request(app).post('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Item ${i}`, price: 100, professionId });
    }
    // We now have 1+9 = 10 items. Creating an 11th should fail.
    const failRes = await request(app).post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Item Extra`, price: 100, professionId });
    
    expect(failRes.statusCode).toBe(500); // Because it throws standard Error (handled by GlobalErrorHandler, res defaults to 500 or 400 depending on your error handle logic) 
    expect(failRes.body.success).toBe(false);
    expect(failRes.body.message).toContain('maximum 10 items');
  });
});
