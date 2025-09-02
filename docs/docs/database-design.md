# ThriftFinder Database Design Document

**Muscle Mommies**  
September 2, 2025

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Purpose](#11-purpose)
2. [Entity-Relationship Diagram (ERD)](#2-entity-relationship-diagram-erd)
   - 2.1 [Text-Based ERD Representation](#21-text-based-erd-representation)
3. [Detailed Entity Breakdown](#3-detailed-entity-breakdown)
   - 3.1 [Users Collection](#31-users-collection)
   - 3.2 [Stores Collection](#32-stores-collection)
   - 3.3 [Items Collection](#33-items-collection)
   - 3.4 [ItemImages Collection](#34-itemimages-collection)
   - 3.5 [Reservations Collection](#35-reservations-collection)
   - 3.6 [Chats Collection](#36-chats-collection)
   - 3.7 [Messages Collection](#37-messages-collection)
4. [Relationships](#4-relationships)
5. [Indexes](#5-indexes)
6. [Sample Queries](#6-sample-queries)
   - 6.1 [Find Nearby Stores (5km Radius)](#61-find-nearby-stores-5km-radius)
   - 6.2 [Find All Reservations for a User](#62-find-all-reservations-for-a-user)
   - 6.3 [Get All Messages in a Chat](#63-get-all-messages-in-a-chat)
7. [Appendix](#7-appendix)
   - 7.1 [ERD Tools](#71-erd-tools)

## 1 Introduction

### 1.1 Purpose

This document outlines the Firestore database schema for ThriftFinder, a local thrifting marketplace app. The design supports:

- Shoppers browsing nearby thrift stores and placing reservations
- Shop owners managing inventory and uploading item images
- Users chatting and exchanging messages in real-time

## 2 Entity-Relationship Diagram (ERD)

### 2.1 Text-Based ERD Representation

```
+--------+ +--------+ +---------+ +-------------+
| USERS  | | STORES | | ITEMS   | | ITEMIMAGES  |
+--------+ +--------+ +---------+ +-------------+
| userId |<----->| ownerId| 1:N | storeId | 1:N | itemId      |
+--------+ +--------+ +---------+ +-------------+
     |                                |
     |                                v
     |                    +------------+
     |                    |RESERVATIONS|
     |                    +------------+
     |                    | userId     |
     |                    | itemId     |
     |                    +------------+
+--------+ +----------+ +----------+
| USERS  |<----->| CHATS    |<----->| MESSAGES |
+--------+ +----------+ +----------+
| userId | N:M | chatId   | 1:N | chatId   |
+--------+ +----------+ +----------+
```

## 3 Detailed Entity Breakdown

### 3.1 Users Collection

| Field    | Type     | Constraints    | Description                      |
|----------|----------|----------------|----------------------------------|
| userId   | string   | PRIMARY KEY    | Unique identifier (UUID)         |
| name     | string   | Not null       | Full name of user                |
| role     | enum     | 'shopper' or 'shop owner' | Determines permissions |
| location | GeoPoint | Optional       | {lat: number, lng: number}       |

### 3.2 Stores Collection

| Field        | Type     | Constraints    | Description                              |
|--------------|----------|----------------|------------------------------------------|
| storeId      | string   | PRIMARY KEY    | Unique identifier (UUID)                 |
| ownerId      | string   | FOREIGN KEY    | References users.userId                  |
| name         | string   | Not null       | Store name                               |
| openingHours | array    |                | [{day: string, open: string, close: string}] |
| location     | GeoPoint | Optional       | Store location                           |

### 3.3 Items Collection

| Field     | Type    | Constraints    | Description                    |
|-----------|---------|----------------|--------------------------------|
| itemId    | string  | PRIMARY KEY    | Unique identifier (UUID)       |
| storeId   | string  | FOREIGN KEY    | References stores.storeId      |
| name      | string  | Not null       | Item name/title                |
| category  | string  |                | Clothing, accessories, etc.    |
| price     | number  | Not null       | Price in local currency        |
| available | boolean | Default true   | Availability status            |

### 3.4 ItemImages Collection

| Field      | Type      | Constraints    | Description                        |
|------------|-----------|----------------|------------------------------------|
| imageId    | string    | PRIMARY KEY    | Unique identifier (UUID)           |
| itemId     | string    | FOREIGN KEY    | References items.itemId            |
| imageUrl   | string    | Not null       | Cloud storage URL of the image     |
| uploadedAt | timestamp | Auto           | Time uploaded                      |

### 3.5 Reservations Collection

| Field         | Type      | Constraints    | Description                              |
|---------------|-----------|----------------|------------------------------------------|
| reservationId | string    | PRIMARY KEY    | Unique identifier (UUID)                 |
| userId        | string    | FOREIGN KEY    | References users.userId                  |
| itemId        | string    | FOREIGN KEY    | References items.itemId                  |
| status        | enum      | 'pending', 'confirmed', 'cancelled' | Reservation state |
| createdAt     | timestamp | Auto           | Time of reservation                      |

### 3.6 Chats Collection

| Field        | Type      | Constraints    | Description              |
|--------------|-----------|----------------|--------------------------|
| chatId       | string    | PRIMARY KEY    | Unique identifier (UUID) |
| participants | array     | Not null       | List of userIds in chat  |
| createdAt    | timestamp | Auto           | Chat creation time       |

### 3.7 Messages Collection

| Field     | Type      | Constraints    | Description                    |
|-----------|-----------|----------------|--------------------------------|
| messageId | string    | PRIMARY KEY    | Unique identifier (UUID)       |
| chatId    | string    | FOREIGN KEY    | References chats.chatId        |
| senderId  | string    | FOREIGN KEY    | References users.userId        |
| content   | string    | Not null       | Text or media URL              |
| sentAt    | timestamp | Auto           | When the message was sent      |

## 4 Relationships

| Entities        | Type | Implementation                                    |
|-----------------|------|---------------------------------------------------|
| User → Store    | 1:N  | stores.ownerId references users.userId            |
| Store → Item    | 1:N  | items.storeId references stores.storeId          |
| Item → ItemImage| 1:N  | itemImages.itemId references items.itemId        |
| User → Reservation | 1:N | reservations.userId references users.userId   |
| Item → Reservation | 1:N | reservations.itemId references items.itemId   |
| User ↔ Chat     | N:M  | chats.participants contains users.userId         |
| Chat → Message  | 1:N  | messages.chatId references chats.chatId          |
| User → Message  | 1:N  | messages.senderId references users.userId        |

## 5 Indexes

```javascript
// Firestore Index Configuration Example
{
  collection: "items",
  fields: [
    { fieldPath: "category", order: "ASCENDING" },
    { fieldPath: "price", order: "ASCENDING" }
  ]
}
```

## 6 Sample Queries

### 6.1 Find Nearby Stores (5km Radius)

```javascript
// Firestore + GeoQuery (using GeoFirestore library)
const geoQuery = geoFirestore.collection('stores')
  .near({ center: new firebase.firestore.GeoPoint(lat, long), radius: 5 });
```

### 6.2 Find All Reservations for a User

```javascript
// Firestore
db.collection("reservations")
  .where("userId", "==", currentUserId)
  .get()
```

### 6.3 Get All Messages in a Chat

```javascript
// Firestore
db.collection("messages")
  .where("chatId", "==", selectedChatId)
  .orderBy("sentAt", "asc")
  .get()
```

## 7 Appendix

### 7.1 ERD Tools

- **Lucidchart**: https://www.lucidchart.com
- **draw.io**: https://draw.io