const cron = require('node-cron');
const prisma = require('../database/prisma');

// Programar ejecución diaria a la medianoche (0 0 * * *)
const task = cron.schedule('0 0 * * *', async () => {
  try {
    await processExpiredMemberships();
  } catch (error) {
    console.error('Error al ejecutar el cron job diario de expiración de membresías:', error);
  }
});

// Función de procesamiento separada para fácil invocación y testing
async function processExpiredMemberships() {
  const now = new Date();
  
  // Buscar membresías activas cuya fecha de expiración sea menor a la fecha actual
  const expiredMemberships = await prisma.membership.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lt: now
      }
    }
  });

  if (expiredMemberships.length === 0) {
    console.log(`[Cron Expiración] Fecha: ${now.toLocaleString()} - Sin membresías vencidas detectadas. Afectados: 0`);
    return 0;
  }

  const userIds = expiredMemberships.map(m => m.userId);

  // Ejecución transaccional para revertir el userType a FREE y marcar de forma inactiva la membresía
  await prisma.$transaction([
    prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        userType: 'FREE'
      }
    }),
    prisma.membership.updateMany({
      where: {
        userId: {
          in: userIds
        }
      },
      data: {
        status: 'INACTIVE'
      }
    })
  ]);

  console.log(`[Cron Expiración] Fecha: ${now.toLocaleString()} - Expiración automática procesada. Afectados: ${expiredMemberships.length} usuario(s). IDs afectados: ${userIds.join(', ')}`);
  return expiredMemberships.length;
}

module.exports = {
  task,
  processExpiredMemberships
};
