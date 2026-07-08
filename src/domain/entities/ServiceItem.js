class ServiceItem {
  constructor({ id, name, description, price, professionId, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.professionId = professionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
module.exports = ServiceItem;
