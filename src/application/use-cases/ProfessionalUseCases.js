class ProfessionalUseCases {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async search(query) {
    return this.userRepository.searchProfessionals(query);
  }
}

module.exports = ProfessionalUseCases;
