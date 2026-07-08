class BudgetItem {
  constructor({ id, description, quantity, unitPrice, subtotal, budgetId }) {
    this.id = id;
    this.description = description;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.subtotal = subtotal;
    this.budgetId = budgetId;
  }
}
module.exports = BudgetItem;
