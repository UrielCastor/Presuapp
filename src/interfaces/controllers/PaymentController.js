const PaymentUseCases = require('../../application/use-cases/PaymentUseCases');
const PrismaUserRepository = require('../../infrastructure/repositories/PrismaUserRepository');
const { formatResponse } = require('../../utils/response');

const paymentUseCases = new PaymentUseCases(new PrismaUserRepository());

class PaymentController {
  static async createPreference(req, res, next) {
    try {
      const result = await paymentUseCases.createPreference(req.user);
      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }

  static async webhook(req, res, next) {
    try {
      // Mercado Pago webhook payload formats
      // query.topic o body.type indican el tipo. El id del pago viene en query.id o body.data.id
      const { action, type, data } = req.body;
      const topic = req.query.topic || type || action;
      const paymentId = req.query.id || (data && data.id) || req.body.id;

      console.log('Webhook Body:', req.body);
      console.log('Webhook Query:', req.query);

      // Si el topic indica una operación con pagos
      if (topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated' || req.body.action?.startsWith('payment')) {
        await paymentUseCases.processWebhook(paymentId, topic);
      }

      // Siempre responder 200 OK a Mercado Pago para confirmar que recibimos el webhook
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in webhook controller:', error);
      // Igualmente retornamos 200 para evitar que Mercado Pago reintente infinitamente si fue un error local de credenciales
      res.status(200).json({ success: false, error: error.message });
    }
  }

  // Endpoint extra temporal para simulación directa de pruebas locales sin requerir tunel HTTPS
  static async simulateSuccessPayment(req, res, next) {
    try {
      const userId = req.user.id;
      const PaymentUseCases = require('../../application/use-cases/PaymentUseCases');
      const PrismaUserRepository = require('../../infrastructure/repositories/PrismaUserRepository');
      const uc = new PaymentUseCases(new PrismaUserRepository());
      
      // Simulamos la llamada con test_payment_id
      const result = await uc.processWebhook(`test_payment_for_${userId}`, 'payment');
      res.status(200).json(formatResponse(true, result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;
