// models/storeModel.js

class Store {
  constructor({
    id,
    name,
    address,
    location,
    openingHours,
    ownerId,
    createdAt,
  }) {
    this.id = id; // Firestore doc id
    this.name = name;
    this.address = address;
    this.location = location; // Firestore GeoPoint
    this.openingHours = openingHours; // array of { day, open, close }
    this.ownerId = ownerId;
    this.createdAt = createdAt;
  }
}

module.exports = Store;
