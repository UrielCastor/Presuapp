class User {
  constructor({ id, name, email, password, phone, createdAt, city, locality, userType, username, membership, professions, role, status }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.phone = phone;
    this.createdAt = createdAt;
    this.city = city;
    this.locality = locality;
    this.userType = userType || 'FREE';
    this.username = username;
    this.membership = membership;
    this.professions = professions || [];
    this.role = role || 'USER';
    this.status = status || 'ACTIVE';
  }
}
module.exports = User;
