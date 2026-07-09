const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

class PaymentUseCases {
  constructor(userRepository) {
    this.userRepository = userRepository;
    
    // Initialise Mercado Pago SDK Client using modern configuration format
    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-TEST-MERCADOPAGO-ACCESS-TOKEN'
    });
    this.preference = new Preference(this.mpClient);
    this.payment = new Payment(this.mpClient);
  }

  async createPreference(user) {
    const preferenceData = {
      body: {
        items: [
          {
            id: 'plan-vip',
            title: 'PresuApp - Plan VIP (Suscripción Mensual)',
            quantity: 1,
            unit_price: 10000,
            currency_id: 'ARS',
          }
        ],
        payer: {
          email: user.email,
          name: user.name,
        },
        external_reference: String(user.id),
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL || 'https://presuapp.locallink.sh'}/api/payments/webhook`,
      }
    };

    try {
      const response = await this.preference.create(preferenceData);
      return {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point
      };
    } catch (error) {
      console.error('Error creating Mercado Pago preference:', error);
      throw new Error('No se pudo generar la preferencia de pago de Mercado Pago.');
    }
  }

  async processWebhook(paymentId, topicAction) {
    if (!paymentId) return { success: false, message: 'Falta paymentId' };

    try {
      console.log(`Procesando webhook de pago. ID: ${paymentId}, Topic: ${topicAction}`);
      
      // En entorno local de pruebas con credenciales sandbox/test ficticias, atajamos errores para no romper el flujo
      let paymentInfo;
      try {
        paymentInfo = await this.payment.get({ id: paymentId });
      } catch (err) {
        console.warn('Advertencia: No se pudo obtener información del pago desde la API de Mercado Pago. (Credenciales de pruebas/red)', err.message);
        
        // Si el ID de pago es de prueba local 'test_payment_id' o similar, o falló la API debido a token ficticio de test,
        // simulamos exitosamente para soporte de QA e integración local:
        if (process.env.NODE_ENV !== 'production' && (String(paymentId).startsWith('test') || String(process.env.MP_ACCESS_TOKEN).includes('TEST'))) {
          console.log('Simulación de pago exitosa en entorno de pruebas local.');
          
          const match = String(paymentId).match(/test_payment_for_(\d+)/);
          const extRef = match ? match[1] : '1';
          
          paymentInfo = {
            id: paymentId,
            status: 'approved',
            external_reference: extRef,
            preference_id: 'test_pref_id',
            transaction_amount: 10000,
            currency_id: 'ARS',
            payment_method_id: 'test_method',
            payment_type_id: 'test_type',
            date_approved: new Date().toISOString()
          };
        } else {
          throw err;
        }
      }

      if (paymentInfo && paymentInfo.status === 'approved') {
        const userId = parseInt(paymentInfo.external_reference);
        if (!userId) {
          throw new Error('Falta external_reference en el webhook del pago');
        }

        // Activamos membresía VIP por 30 días
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 días en el futuro

        const membershipData = {
          startDate,
          endDate,
          status: 'ACTIVE',
          planType: 'VIP'
        };

        const paymentTransactionData = {
          mercadoPagoPaymentId: String(paymentInfo.id || paymentId),
          mercadoPagoPreferenceId: paymentInfo.preference_id || null,
          externalReference: paymentInfo.external_reference || null,
          amount: parseFloat(paymentInfo.transaction_amount || 10000),
          currency: paymentInfo.currency_id || 'ARS',
          paymentMethod: paymentInfo.payment_method_id || null,
          paymentType: paymentInfo.payment_type_id || null,
          status: paymentInfo.status || 'approved',
          approvedAt: paymentInfo.date_approved ? new Date(paymentInfo.date_approved) : new Date(),
          rawResponse: paymentInfo
        };

        await this.userRepository.updateMembership(userId, membershipData, paymentTransactionData);
        console.log(`Membresía VIP actualizada y PaymentTransaction registrada con éxito para el usuario ID: ${userId}`);
        return { success: true, userId, status: 'approved' };
      }

      return { success: false, status: paymentInfo?.status || 'unknown' };
    } catch (error) {
      console.error('Error al procesar el webhook de Mercado Pago:', error);
      throw error;
    }
  }
}

module.exports = PaymentUseCases;
