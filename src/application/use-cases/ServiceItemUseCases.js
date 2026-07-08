class ServiceItemUseCases {
  constructor(serviceItemRepository, professionRepository) {
    this.serviceItemRepository = serviceItemRepository;
    this.professionRepository = professionRepository;
  }

  async createItem(data, userId, userType = 'FREE') {
    if (userType === 'FREE') {
      const existing = await this.serviceItemRepository.findAllByUserId(userId);
      if (existing.length >= 20) {
        throw new Error('Has alcanzado el límite de tu plan FREE.');
      }
    }

    if (data.professionId) {
      const prof = await this.professionRepository.findById(data.professionId);
      if (!prof || prof.userId !== userId) throw new Error('Profession not found or unauthorized');
    }

    return this.serviceItemRepository.create(data);
  }

  async getItems(userId) {
    return this.serviceItemRepository.findAllByUserId(userId);
  }

  async getItemsByProfession(professionId, userId) {
    const prof = await this.professionRepository.findById(professionId);
    if (!prof || prof.userId !== userId) throw new Error('Unauthorized');
    return this.serviceItemRepository.findAllByProfessionId(professionId);
  }

  async updateItem(id, data, userId) {
    const item = await this.serviceItemRepository.findById(id);
    if (!item) throw new Error('Item not found');
    const prof = await this.professionRepository.findById(item.professionId);
    if (prof.userId !== userId) throw new Error('Unauthorized');
    
    return this.serviceItemRepository.update(id, data);
  }

  async deleteItem(id, userId) {
    const item = await this.serviceItemRepository.findById(id);
    if (!item) throw new Error('Item not found');
    const prof = await this.professionRepository.findById(item.professionId);
    if (prof.userId !== userId) throw new Error('Unauthorized');
    
    return this.serviceItemRepository.delete(id);
  }
}
module.exports = ServiceItemUseCases;
