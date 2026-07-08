const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/infrastructure/database/prisma');

let token;
let clientId;
let serviceItemId1;
let serviceItemId2;

describe('Budget Endpoints', () => {
  beforeAll(async () => {
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.client.deleteMany();
    await prisma.serviceItem.deleteMany();
    await prisma.profession.deleteMany();
    await prisma.user.deleteMany();

    const u = await request(app).post('/api/auth/register').send({
      name: 'BudgetUser', email: 'budget@user.com', password: 'password'
    });
    token = u.body.data.token;

    const c = await request(app).post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maria', phone: '1122334455' });
    clientId = c.body.data.id;

    const p = await request(app).post('/api/professions')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cerrajero' });
    const professionId = p.body.data.id;

    const s1 = await request(app).post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cambio de cerradura', price: 5000, professionId });
      
    const s2 = await request(app).post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Copias de llaves', price: 500, professionId });
      
    serviceItemId1 = s1.body.data.id;
    serviceItemId2 = s2.body.data.id;
  });

  afterAll(async () => { await prisma.$disconnect(); });

  let budgetId;

  it('should create a budget and calculate total correctly', async () => {
    const res = await request(app).post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId,
        notes: 'Urgente',
        items: [
          { serviceItemId: serviceItemId1, quantity: 1 },
          { serviceItemId: serviceItemId2, quantity: 4 }
        ]
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(7000); // 5000 + (4*500)
    budgetId = res.body.data.id;
  });

  it('should generate whatsapp link', async () => {
    const res = await request(app).get(`/api/budgets/${budgetId}/whatsapp`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.link).toContain('https://wa.me/1122334455');
    // Ensure properly URL encoded text param is there
    expect(res.body.data.link).toContain('text=');
  });
});
