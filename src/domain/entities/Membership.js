class Membership {
  constructor({ id, userId, startDate, endDate, status, planType, autoRenew, createdAt, updatedAt }) {
    this.id = id;
    this.userId = userId;
    this.startDate = startDate || new Date();
    this.endDate = endDate;
    this.status = status || 'ACTIVE';
    this.planType = planType || 'FREE';
    this.autoRenew = autoRenew || false;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = Membership;
