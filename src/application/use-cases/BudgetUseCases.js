class BudgetUseCases {
  constructor(budgetRepository, clientRepository, serviceItemRepository) {
    this.budgetRepository = budgetRepository;
    this.clientRepository = clientRepository;
    this.serviceItemRepository = serviceItemRepository;
  }

  async createBudget(data) {
    // data contains: clientId, userId, notes, discount, items: [{ serviceItemId, quantity }]
    const userPlan = data.userType || 'FREE';
    if (userPlan === 'FREE') {
      const currentItemsCount = await this.budgetRepository.countBudgetItemsByUserId(data.userId);
      const newItemsCount = data.items.length;
      if (currentItemsCount + newItemsCount > 100) {
        throw new Error('Has alcanzado el límite de tu plan FREE.');
      }
    }

    const client = await this.clientRepository.findById(data.clientId);
    if (!client || client.userId !== data.userId) throw new Error('Client missing or unauthorized');

    let itemsTotal = 0;
    const items = [];
    
    for (const i of data.items) {
      const serviceItem = await this.serviceItemRepository.findById(i.serviceItemId);
      if (!serviceItem) throw new Error("Service item not found");
      
      const subtotal = i.quantity * serviceItem.price;
      itemsTotal += subtotal;
      
      items.push({ 
        description: serviceItem.name, 
        quantity: i.quantity, 
        unitPrice: serviceItem.price, 
        subtotal 
      });
    }

    const discount = data.discount ? parseFloat(data.discount) : 0;
    const finalTotal = itemsTotal * (1 - discount / 100);

    const budgetData = {
      number: `B-${Date.now()}`,
      notes: data.notes,
      total: finalTotal,
      discount,
      clientId: data.clientId,
      userId: data.userId,
      items
    };

    return this.budgetRepository.create(budgetData);
  }

  async getBudgets(userId) {
    return this.budgetRepository.findAllByUserId(userId);
  }

  async getBudget(id, userId) {
    const budget = await this.budgetRepository.findById(id);
    if (!budget || budget.userId !== userId) throw new Error('Budget not found or unauthorized');
    return budget;
  }

  async updateBudget(id, data, userId) {
    await this.getBudget(id, userId);
    return this.budgetRepository.update(id, data);
  }

  async deleteBudget(id, userId) {
    await this.getBudget(id, userId);
    return this.budgetRepository.delete(id);
  }

  async generateWhatsappLink(id, userId) {
    const budget = await this.getBudget(id, userId);
    
    // formatting whatsapp message
    let message = `*Presupuesto ${budget.number}*\n`;
    message += `Hola ${budget.client.name},\n`;
    message += `Te envío el detalle de trabajos:\n\n`;
    
    for (const item of budget.items) {
      message += `- ${item.description}: ${item.quantity} x $${item.unitPrice} = $${item.subtotal}\n`;
    }

    if (budget.discount > 0) {
      const subtotalVal = budget.items.reduce((sum, item) => sum + item.subtotal, 0);
      message += `\nSubtotal: $${subtotalVal.toFixed(2)}\n`;
      message += `Descuento (${budget.discount}%): -$${(subtotalVal * (budget.discount / 100)).toFixed(2)}\n`;
    }
    
    message += `\n*Total: $${budget.total.toFixed(2)}*\n`;
    if (budget.notes) {
      message += `\nNotas: ${budget.notes}`;
    }

    const encodedMessage = encodeURIComponent(message);
    const phone = budget.client.phone ? budget.client.phone.replace(/[^0-9]/g, '') : '';
    
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }
  
  async generatePdf(id, userId) {
    const budget = await this.getBudget(id, userId);
    const PDFDocument = require('pdfkit');
    
    const doc = new PDFDocument();
    
    doc.fontSize(20).text('PRESUPUESTO', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Numero: ${budget.number}`);
    doc.text(`Fecha: ${new Date(budget.date).toLocaleDateString()}`);
    doc.text(`Cliente: ${budget.client.name}`);
    doc.text(`Email: ${budget.client.email || '-'}`);
    doc.text(`Telefono: ${budget.client.phone || '-'}`);
    doc.moveDown();

    doc.text('Detalle de Trabajos:', { underline: true });
    doc.moveDown(0.5);

    budget.items.forEach(item => {
      doc.text(`- ${item.description}: ${item.quantity} un. x $${item.unitPrice} = $${item.subtotal}`);
    });
    
    doc.moveDown();

    if (budget.discount > 0) {
      const subtotalVal = budget.items.reduce((sum, item) => sum + item.subtotal, 0);
      doc.text(`Subtotal: $${subtotalVal.toFixed(2)}`, { align: 'right' });
      doc.text(`Descuento (${budget.discount}%): -$${(subtotalVal * (budget.discount / 100)).toFixed(2)}`, { align: 'right' });
      doc.moveDown(0.5);
    }
    
    doc.fontSize(14).text(`TOTAL: $${budget.total.toFixed(2)}`, { align: 'right' });
    
    if (budget.notes) {
      doc.moveDown();
      doc.fontSize(10).text(`Notas: ${budget.notes}`);
    }

    doc.end();
    return doc;
  }
}

module.exports = BudgetUseCases;
