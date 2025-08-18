const admin = require('../config/firebase'); // Firebase Admin SDK
const db = admin.firestore(); // Firestore instance

class User {
  constructor(uid, name, email, role) {
    this.uid = uid;
    this.name = name;
    this.email = email;
    this.role = role;
  }

  // Save user to Firestore
  async save() {
    await db.collection('users').doc(this.uid).set({
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: new Date(),
    });
  }

  // Fetch user by UID
  static async getByUid(uid) {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  }

  // Create User instance from Firebase Auth user object
  static fromAuthUser(authUser, role = 'customer') {
    return new User(
      authUser.uid,
      authUser.displayName || '',
      authUser.email,
      role
    );
  }

  // Convert to plain object for Firestore
  toJSON() {
    return {
      uid: this.uid,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: new Date(),
    };
  }
}

module.exports = User;
