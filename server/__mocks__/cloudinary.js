const { Writable } = require('stream');

const cloudinary = {
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        // Return a writable stream
        const writable = new Writable({
          write(chunk, encoding, next) {
            next();
          },
        });
        // Call the callback immediately after piping ends
        process.nextTick(() =>
          callback(null, {
            public_id: 'muscle-mommies/external/mock-image-id',
            secure_url: 'https://mocked.cloudinary.com/mock-image.jpg',
          })
        );
        return writable;
      }),
    },
  },
};

module.exports = cloudinary;
