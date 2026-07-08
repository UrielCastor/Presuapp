class Client {
  constructor({ id, name, phone, email, address, notes, userId, createdAt }) {
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.address = address;
    this.notes = notes;
    this.userId = userId;
    this.createdAt = createdAt;
  }
}
module.exports = Client;
