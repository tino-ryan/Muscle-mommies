// models/itemModel.js
class Item {
  constructor({
    itemId,
    name,
    storeId,
    category,
    style,
    department,
    price,
    quantity,
    size,
    status,
    description,
    images,
    createdAt,
    updatedAt,
  }) {
    this.itemId = itemId;
    this.name = name;
    this.storeId = storeId;
    this.category = category;
    this.style = style;
    this.department = department;
    this.price = parseFloat(price);
    this.quantity = parseInt(quantity);
    this.size = size;
    this.status = status;
    this.description = description;
    this.images = images || [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Helper method to get primary image
  getPrimaryImage() {
    if (!this.images || this.images.length === 0) {
      return null;
    }
    return this.images.find((img) => img.isPrimary) || this.images[0];
  }

  // Helper method to get primary image URL
  getPrimaryImageURL() {
    const primaryImage = this.getPrimaryImage();
    return primaryImage
      ? primaryImage.imageURL
      : 'https://via.placeholder.com/150?text=No+Image';
  }
}

module.exports = Item;
