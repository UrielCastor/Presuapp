class UserRepository {
  async create(userData) { throw new Error('Not implemented'); }
  async findByEmail(email) { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async findByEmailOrUsername(emailOrUsername) { throw new Error('Not implemented'); }
  async findByUsername(username) { throw new Error('Not implemented'); }
  async searchProfessionals(query) { throw new Error('Not implemented'); }
  async updateMembership(userId, membershipData) { throw new Error('Not implemented'); }
}
module.exports = UserRepository;
