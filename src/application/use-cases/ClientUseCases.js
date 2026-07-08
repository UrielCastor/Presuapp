class ClientUseCases {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async createClient(data) {
    const userPlan = data.userType || 'FREE';
    if (userPlan === 'FREE') {
      const existing = await this.clientRepository.findAllByUserId(data.userId);
      if (existing.length >= 50) {
        throw new Error('Has alcanzado el límite de tu plan FREE.');
      }
    }
    const { userType, ...cleanedData } = data;
    return this.clientRepository.create(cleanedData);
  }

  async getClients(userId) {
    return this.clientRepository.findAllByUserId(userId);
  }

  async getClient(id, userId) {
    const client = await this.clientRepository.findById(id);
    if (!client || client.userId !== userId) throw new Error('Client not found or unathorized');
    return client;
  }

  async updateClient(id, data, userId) {
    await this.getClient(id, userId); // verify ownership
    return this.clientRepository.update(id, data);
  }

  async deleteClient(id, userId) {
    await this.getClient(id, userId);
    return this.clientRepository.delete(id);
  }
}
module.exports = ClientUseCases;
