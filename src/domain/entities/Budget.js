class Budget {
  constructor({ id, number, date, status, notes, total, discount, clientId, userId, createdAt, items, client }) {
    this.id = id;
    this.number = number;
    this.date = date;
    this.status = status;
    this.notes = notes;
    this.total = total;
    this.discount = discount || 0;
    this.clientId = clientId;
    this.userId = userId;
    this.createdAt = createdAt;
    this.items = items || [];
    this.client = client;
  }
}
module.exports = Budget;
