# ThriftFinder External API Documentation

## Overview

The ThriftFinder External API provides access to thrift store data and photo journal management for integration with the Campus Quest project. This API enables Campus Quest to:

- Retrieve thrift store details to use as quest locations or advertisements, exposing thrift stores to a broader audience.
- Manage user photo journals by uploading and retrieving photos, stored via Cloudinary and tracked in Firestore.

The API is hosted at `https://muscle-mommies-server.onrender.com/external` (update to production URL when deployed). It includes two main endpoint groups: **Stores** and **Photos**.

## Authentication

- **Stores Endpoint (`/external/stores`)**: No authentication required, as it’s intended for public access to promote thrift stores.
- **Photos Endpoints (`/external/upload`, `/external/photos`)**: Require an API key, sent in the `x-api-key` header. Contact the ThriftFinder team to obtain a valid API key.
  - Header: `x-api-key: your-secure-api-key`
  - Example: `x-api-key: my-unique-secret-key-123`
  - If the API key is missing or invalid, you’ll receive a `401 Unauthorized` response: `{ "error": "Invalid or missing API key" }`.

## Endpoints

### 1. GET /external/stores

Retrieves a list of all thrift stores from the ThriftFinder database. This can be used by Campus Quest to:

- Display thrift stores as quest locations or points of interest.
- Promote thrift stores to Campus Quest users, increasing their visibility.

#### Request

- **Method**: GET
- **URL**: `https://muscle-mommies-server.onrender.com/external/stores`
- **Headers**: None
- **Query Parameters**: None
- **Body**: None

#### Example Request

Using cURL:

```bash
curl https://muscle-mommies-server.onrender.com/external/stores
```

Using JavaScript (Fetch):

```javascript
fetch('https://muscle-mommies-server.onrender.com/external/stores')
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
```

#### Response

- **Status**: `200 OK` on success, `500 Internal Server Error` on failure.
- **Body**: JSON array of store objects.
  - `storeId`: Unique identifier for the store.
  - `storeName`: Name of the thrift store.
  - `description`: Store description (optional).
  - `address`: Physical address of the store.
  - `location`: Object with `lat` (latitude) and `lng` (longitude) for geolocation.
  - `profileImageURL`: URL of the store’s profile image (optional).
  - `ownerId`: Firebase UID of the store owner.
  - `createdAt`, `updatedAt`: Firestore timestamps.

#### Example Response

```json
[
  {
    "storeId": "abc123",
    "storeName": "Vintage Vibes",
    "description": "Unique second-hand fashion",
    "address": "123 Main St, Campus Town",
    "location": { "lat": 40.7128, "lng": -74.0060 },
    "profileImageURL": "https://res.cloudinary.com/your-cloud-name/image/upload/...",
    "ownerId": "xyz789",
    "createdAt": { "_seconds": 1698796800, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1698796800, "_nanoseconds": 0 }
  },
  ...
]
```

#### Error Response

```json
{
  "error": "Failed to fetch thrift stores",
  "details": "Error message here"
}
```

### 2. POST /external/upload

Uploads a photo to Cloudinary for use in Campus Quest’s user photo journals (e.g., photos taken during quests). The photo metadata is stored in Firestore’s `externalImages` collection.

#### Request

- **Method**: POST
- **URL**: `https://muscle-mommies-server.onrender.com/external/upload`
- **Headers**:
  - `x-api-key: your-secure-api-key` (required)
  - `Content-Type: multipart/form-data`
- **Body**:
  - `image`: The image file (e.g., `.jpg`, `.png`) to upload.
- **Query Parameters**: None

#### Example Request

Using cURL:

```bash
curl -X POST https://muscle-mommies-server.onrender.com/external/upload \
  -H "x-api-key: my-unique-secret-key-123" \
  -F "image=@/path/to/your/image.jpg"
```

Using Postman:

1. Set request type to POST and URL to `https://muscle-mommies-server.onrender.com/external/upload`.
2. In "Headers", add `x-api-key: my-unique-secret-key-123`.
3. In "Body", select `form-data`, add key `image` (type: File), and select an image file.
4. Send the request.

#### Response

- **Status**: `200 OK` on success, `400 Bad Request` or `500 Internal Server Error` on failure.
- **Body**:
  - `imageId`: Cloudinary public ID of the uploaded image.
  - `imageURL`: Secure URL to access the image on Cloudinary.

#### Example Response

```json
{
  "imageId": "muscle-mommies/external/abc123",
  "imageURL": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/muscle-mommies/external/abc123.jpg"
}
```

#### Error Responses

- Missing file: `{ "error": "No image provided" }` (400)
- Invalid API key: `{ "error": "Invalid or missing API key" }` (401)
- Upload failure: `{ "error": "Failed to upload image", "details": "Error message here" }` (500)

### 3. GET /external/photos

Retrieves a list of all photo metadata from the `externalImages` collection, used for displaying user photo journals in Campus Quest.

#### Request

- **Method**: GET
- **URL**: `http://muscle-mommies-server.onrender.com/external/photos`
- **Headers**:
  - `x-api-key: your-secure-api-key` (required)
- **Query Parameters**: None
- **Body**: None

#### Example Request

Using cURL:

```bash
curl http://muscle-mommies-server.onrender.com/external/photos -H "x-api-key: my-unique-secret-key-123"
```

Using JavaScript (Fetch):

```javascript
fetch('http://muscle-mommies-server.onrender.com/external/photos', {
  headers: { 'x-api-key': 'my-unique-secret-key-123' },
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
```

#### Response

- **Status**: `200 OK` on success, `500 Internal Server Error` on failure.
- **Body**: JSON array of image objects.
  - `imageId`: Cloudinary public ID.
  - `imageURL`: Secure URL of the image.
  - `createdAt`: Firestore timestamp of when the image was uploaded.

#### Example Response

```json
[
  {
    "imageId": "muscle-mommies/external/abc123",
    "imageURL": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/muscle-mommies/external/abc123.jpg",
    "createdAt": { "_seconds": 1698796800, "_nanoseconds": 0 }
  },
  ...
]
```

#### Error Responses

- Invalid API key: `{ "error": "Invalid or missing API key" }` (401)
- Fetch failure: `{ "error": "Failed to fetch images", "details": "Error message here" }` (500)

## Integration with Campus Quest

### Purpose

- **Stores API (`GET /external/stores`)**:
  - Use store data to create quest locations (e.g., visit a thrift store to complete a quest).
  - Display thrift stores as advertisements or points of interest, increasing their exposure to Campus Quest users.
  - Example: Show a store’s `storeName`, `address`, and `location` on a map for a quest to visit a thrift store.
- **Photos API (`POST /external/upload`, `GET /external/photos`)**:
  - Allow Campus Quest users to upload photos taken during quests (e.g., a photo of a thrift find).
  - Retrieve and display these photos in a user’s photo journal, enhancing the quest experience.
  - Example: A user uploads a photo of a vintage jacket found at a thrift store, which is stored in Cloudinary and linked in the `externalImages` collection.

### Recommendations

- **Stores**: Cache store data locally in Campus Quest to reduce API calls, as store data changes infrequently.
- **Photos**: Use the `imageURL` from responses to display images directly in the Campus Quest app. Ensure the API key is securely stored (e.g., not hardcoded in client-side code).
- **Error Handling**: Handle `401`, `400`, and `500` errors gracefully in the Campus Quest UI, informing users if authentication fails or the server is unavailable.

## Testing

### Prerequisites

- Ensure the ThriftFinder server is running: `node index.js`.
- Obtain the API key from the ThriftFinder team for `/external/upload` and `/external/photos`.
- Use tools like Postman, cURL, or a custom client for testing.

### Testing Tools

- **Postman**:
  - Create requests as described above.
  - For `/external/upload`, use the `form-data` body to upload files.
  - Add the `x-api-key` header where required.
- **cURL**:
  - Use the example commands provided.
  - Ensure the correct file path for uploads (e.g., `/path/to/your/image.jpg`).
- **Browser** (for GET requests):
  - Visit `http://muscle-mommies-server.onrender.com/external/stores` directly (no API key needed).
  - For `/external/photos`, include the API key in a custom client or use Postman/cURL.

### Test Cases

1. **GET /external/stores**:
   - Verify you receive a list of stores with fields like `storeId`, `storeName`, and `location`.
   - Test with no stores in the database (should return `[]`).
2. **POST /external/upload**:
   - Upload a valid image with the correct API key (should return `imageId` and `imageURL`).
   - Try without an API key (should return 401).
   - Try without an image (should return 400).
3. **GET /external/photos**:
   - Upload a few images first, then retrieve them (should return a list of image metadata).
   - Test with an incorrect API key (should return 401).
   - Test with no images uploaded (should return `[]`).

## Notes

- **Security**: The API key for photos endpoints must be kept confidential. Contact the ThriftFinder team to rotate or regenerate keys if needed.
- **Rate Limits**: Currently, no rate limits are enforced, but avoid excessive requests. Discuss with the ThriftFinder team for production scaling.
- **Production URL**: Replace `http://muscle-mommies-server.onrender.com` with the production URL when deployed.
- **Contact**: For issues or additional features (e.g., filtering stores by location, linking photos to specific quests), reach out to the ThriftFinder team.
