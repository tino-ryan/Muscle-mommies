// models/storeModel.js
class Store {
  constructor({
    storeId,
    storeName,
    address,
    location,
    lat,
    lng,
    description,
    profileImageURL,
    contactInfo,
    ownerId,
    createdAt,
    updatedAt,
  }) {
    this.storeId = storeId;
    this.storeName = storeName;
    this.address = address;
    this.location = location; // might be redundant since you also store lat/lng
    this.lat = parseFloat(lat);
    this.lng = parseFloat(lng);
    this.description = description;
    this.profileImageURL = profileImageURL;
    this.contactInfo = contactInfo;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = Store;
