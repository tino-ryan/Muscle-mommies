const Item = require('../models/itemModel');
describe('Item Model', () => {
  test('should return primary image URL', () => {
    const item = new Item({
      itemId: '1f8a7251-342c-409f-aaa2-54c6e5af3ab0',
      name: 'shoes',
      storeId: 'c2e14220-5ebc-4211-9995-b056ad6e852f',
      images: [
        {
          imageId: '8a62996e-86c0-4615-9b08-2220f532ebd1',
          imageURL:
            'https://res.cloudinary.com/dfkg0topw/image/upload/v1756419335/muscle-mommies/i4qzrhv1trdvzb8ehe0c.jpg',
          isPrimary: true,
        },
        {
          imageId: '2ce94624-cd8b-493a-894d-910597abe2ca',
          imageURL:
            'https://res.cloudinary.com/dfkg0topw/image/upload/v1756668350/muscle-mommies/lamdqkswsz70xecaauji.webp',
          isPrimary: false,
        },
      ],
    });
    expect(item.getPrimaryImageURL()).toBe(
      'https://res.cloudinary.com/dfkg0topw/image/upload/v1756419335/muscle-mommies/i4qzrhv1trdvzb8ehe0c.jpg'
    );
  });

  test('should return first image URL if no primary image', () => {
    const item = new Item({
      itemId: '1f8a7251-342c-409f-aaa2-54c6e5af3ab0',
      name: 'shoes',
      storeId: 'c2e14220-5ebc-4211-9995-b056ad6e852f',
      images: [
        {
          imageId: '8a62996e-86c0-4615-9b08-2220f532ebd1',
          imageURL:
            'https://res.cloudinary.com/dfkg0topw/image/upload/v1756419335/muscle-mommies/i4qzrhv1trdvzb8ehe0c.jpg',
          isPrimary: false,
        },
      ],
    });
    expect(item.getPrimaryImageURL()).toBe(
      'https://res.cloudinary.com/dfkg0topw/image/upload/v1756419335/muscle-mommies/i4qzrhv1trdvzb8ehe0c.jpg'
    );
  });

  test('should return placeholder URL if no images', () => {
    const item = new Item({
      itemId: '1f8a7251-342c-409f-aaa2-54c6e5af3ab0',
      name: 'shoes',
      storeId: 'c2e14220-5ebc-4211-9995-b056ad6e852f',
      images: [],
    });
    expect(item.getPrimaryImageURL()).toBe(
      'https://via.placeholder.com/150?text=No+Image'
    );
  });
});
