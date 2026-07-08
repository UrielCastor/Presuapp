class Profession {
  constructor({ id, name, description, userId, createdAt }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.userId = userId;
    this.createdAt = createdAt;
  }
}
module.exports = Profession;
