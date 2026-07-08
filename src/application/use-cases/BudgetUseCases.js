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
  
  async generatePdf(id, userId, origin) {
    const budget = await this.getBudget(id, userId);
    const PDFDocument = require('pdfkit');
    
    // Page constraints and options
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    // 1. Header with deep blue background
    doc.fillColor('#1E3A8A').rect(0, 0, 612, 110).fill();

    // 1.1 Vector thunderbolt logo inside Header
    doc.fillColor('#FBBF24'); // Amber/Bright Yellow logo
    doc.path('M 48 28 L 36 50 L 43 50 L 39 72 L 53 44 L 46 44 Z').fill();
    doc.fillColor('#FFFFFF').fontSize(22).text('PresuApp', 62, 36, { lineBreak: false });

    // 1.2 Header right text metadata
    doc.fillColor('#FFFFFF').fontSize(18).text('PRESUPUESTO', 350, 26, { align: 'right', width: 222 });
    doc.fontSize(9).text(`Nº: ${budget.number}`, 350, 52, { align: 'right', width: 222 });
    doc.text(`Fecha: ${new Date(budget.date).toLocaleDateString()}`, 350, 66, { align: 'right', width: 222 });

    // 2. Info Columns (y = 130)
    const professionName = budget.user.professions?.[0]?.name || 'Servicios Independientes';
    const address = budget.user.locality || budget.user.city ? `${budget.user.locality || ''}, ${budget.user.city || ''}` : '-';

    // 2.1 Professional details
    doc.fillColor('#1E3A8A').fontSize(10).text('INFORMACIÓN DE CONTACTO', 40, 130, { underline: true });
    doc.fillColor('#1E293B').fontSize(11).text(budget.user.name, 40, 146);
    doc.fillColor('#475569').fontSize(9).text(`Rubro: ${professionName}`, 40, 162);
    doc.text(`Celular: ${budget.user.phone || '-'}`, 40, 175);
    doc.text(`Email: ${budget.user.email || '-'}`, 40, 188);
    doc.text(`Ubicación: ${address}`, 40, 201);

    // 2.2 Client details
    doc.fillColor('#1E3A8A').fontSize(10).text('PRESUPUESTADO PARA', 320, 130, { underline: true });
    doc.fillColor('#1E293B').fontSize(11).text(budget.client.name, 320, 146);
    doc.fillColor('#475569').fontSize(9).text(`Celular: ${budget.client.phone || '-'}`, 320, 162);
    doc.text(`Email: ${budget.client.email || '-'}`, 320, 175);
    doc.text(`Dirección: ${budget.client.address || '-'}`, 320, 188);

    // 3. Service details table (y = 230)
    const tableHeaderY = 230;
    doc.fillColor('#F1F5F9').rect(40, tableHeaderY, 532, 22).fill();
    doc.fillColor('#1E293B').fontSize(9);
    doc.text('Concepto / Servicio', 50, tableHeaderY + 6);
    doc.text('Cant.', 320, tableHeaderY + 6, { width: 50, align: 'center' });
    doc.text('P. Unitario', 380, tableHeaderY + 6, { width: 90, align: 'right' });
    doc.text('Subtotal', 480, tableHeaderY + 6, { width: 80, align: 'right' });

    let currentY = tableHeaderY + 22;
    budget.items.forEach((item, index) => {
      // Row alternating color background
      if (index % 2 === 1) {
        doc.fillColor('#F8FAFC').rect(40, currentY, 532, 20).fill();
      }
      doc.fillColor('#334155').fontSize(9);
      doc.text(item.description, 50, currentY + 5, { width: 260, height: 12 });
      doc.text(item.quantity.toString(), 320, currentY + 5, { width: 50, align: 'center' });
      doc.text(`$${item.unitPrice.toFixed(2)}`, 380, currentY + 5, { width: 90, align: 'right' });
      doc.text(`$${item.subtotal.toFixed(2)}`, 480, currentY + 5, { width: 80, align: 'right' });
      currentY += 20;
    });

    // Close line for the item details table
    doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, currentY).lineTo(572, currentY).stroke();
    currentY += 15;

    // 4. Budget calculations
    const rightAlignX = 350;
    const widthVal = 222;

    if (budget.discount > 0) {
      const subtotalVal = budget.items.reduce((sum, item) => sum + item.subtotal, 0);
      doc.fillColor('#475569').fontSize(9);
      doc.text(`Subtotal bruto: $${subtotalVal.toFixed(2)}`, rightAlignX, currentY, { align: 'right', width: widthVal });
      currentY += 14;
      doc.text(`Descuento aplicado (${budget.discount}%): -$${(subtotalVal * (budget.discount / 100)).toFixed(2)}`, rightAlignX, currentY, { align: 'right', width: widthVal });
      currentY += 16;
    }

    // Budget TOTAL highlighted box
    doc.fillColor('#1E3A8A').rect(rightAlignX, currentY, widthVal + 8, 28).fill();
    doc.fillColor('#FFFFFF').fontSize(10).text('TOTAL:', rightAlignX + 12, currentY + 9);
    doc.fontSize(12).text(`$${budget.total.toFixed(2)}`, rightAlignX, currentY + 7, { align: 'right', width: widthVal - 10 });
    
    currentY += 45;

    // 5. Notes / Comments
    if (budget.notes) {
      doc.fillColor('#334155').fontSize(9).text('Observaciones generales:', 40, currentY, { underline: true });
      doc.fillColor('#475569').fontSize(8.5).text(budget.notes, 40, currentY + 15, { width: 280 });
    }

    // 6. Footer (fixed position at bottom = 650pt to keep consistent layout on LETTER size)
    const footerY = 640;

    // Separator line
    doc.strokeColor('#E2E8F0').lineWidth(0.75).moveTo(40, footerY).lineTo(572, footerY).stroke();

    // 6.1 Interactive QR Code linking to the client online page
    const frontendOrigin = origin || 'https://presuapp-bgpl.onrender.com';
    const publicUrl = `${frontendOrigin}/public/budget/${budget.id}`;
    
    try {
      const QRCode = require('qrcode');
      const qrBuffer = await QRCode.toBuffer(publicUrl, { margin: 1, width: 75 });
      doc.image(qrBuffer, 40, footerY + 12, { width: 75 });
      doc.fillColor('#64748B').fontSize(7.5).text('Escaneá para ver online', 40, footerY + 92, { width: 100 });
    } catch (e) {
      console.error('Error generating QR inside budget PDF:', e);
    }

    // 6.2 Centered cordial client greeting
    doc.fillColor('#334155').fontSize(11).text('¡Gracias por confiar en nosotros!', 220, footerY + 30, { align: 'center', width: 200 });

    // 6.3 Mini-logo brand representation on bottom right
    doc.fillColor('#1E3A8A').rect(440, footerY + 25, 132, 34).fill();
    
    const rayStartX = 456;
    const rayStartY = footerY + 32;
    doc.fillColor('#FBBF24'); // Yellow/Amber bolt
    doc.path(`M ${rayStartX} ${rayStartY} L ${rayStartX - 5} ${rayStartY + 9} L ${rayStartX} ${rayStartY + 9} L ${rayStartX - 3} ${rayStartY + 18} L ${rayStartX + 6} ${rayStartY + 8} L ${rayStartX + 1} ${rayStartY + 8} Z`).fill();
    
    doc.fillColor('#FFFFFF').fontSize(11).text('PresuApp', 472, footerY + 36);

    doc.end();
    return doc;
  }
}

module.exports = BudgetUseCases;
