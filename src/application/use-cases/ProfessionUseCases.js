class ProfessionUseCases {
  constructor(professionRepository) {
    this.professionRepository = professionRepository;
  }

  async createProfession(data) {
    const userPlan = data.userType || 'FREE';
    if (userPlan === 'FREE') {
      const existing = await this.professionRepository.findAllByUserId(data.userId);
      if (existing.length >= 1) {
        throw new Error('Has alcanzado el límite de tu plan FREE.');
      }
    }
    const { userType, ...cleanedData } = data;
    return this.professionRepository.create(cleanedData);
  }

  async getProfessions(userId) {
    return this.professionRepository.findAllByUserId(userId);
  }

  async updateProfession(id, data, userId) {
    const prof = await this.professionRepository.findById(id);
    if (!prof || prof.userId !== userId) throw new Error('Profession not found or unathorized');
    return this.professionRepository.update(id, data);
  }

  async deleteProfession(id, userId) {
    const prof = await this.professionRepository.findById(id);
    if (!prof || prof.userId !== userId) throw new Error('Profession not found or unathorized');
    return this.professionRepository.delete(id);
  }
}
module.exports = ProfessionUseCases;
