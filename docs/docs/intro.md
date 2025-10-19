# Welcome to ThriftFinder:

## Project Brief

**ThriftFinder (The Box)** is a full-stack, mobile-friendly web app crafted by the **Muscle Mommies & Moses** team to fuel your passion for thrifting. Whether you're hunting for unique second-hand gems or giving old favorites a new home, ThriftFinder connects you with local thrift stores through a fun, gamified experience. With themed stores to match your vibe—sporty, vintage, or 2000s drip—this platform promotes sustainable fashion and community vibes, now optimized for your phone or tablet!

---

## Why ThriftFinder Rocks

### For Shoppers

- **Discover Nearby Stores**: Explore thrift shops on an interactive map.
- **Browse with Style**: Check out detailed item listings with images, sizes, and prices.
- **Advanced Filters**: Sort items by category, price, size, or style for the perfect find.
- **Reserve Your Faves**: Lock in items for pickup or delivery and start a chat with the store owner.
- **Chat & Connect**: Message store owners with real-time updates and read receipts.
- **Reviews & Ratings**: Share feedback on items and stores to help the community.
- **Build Your Closet**: Track reserved and collected items in your personal Closet page.
- **Earn Epic Badges**: Score rewards for visiting stores, making purchases, and completing challenges via the Campus Quest API.

### For Store Owners

- **Showcase Your Shop**: Create vibrant store profiles with descriptions and social links.
- **List with Ease**: Upload items with images, sizes, and categories using Cloudinary.
- **Manage Reservations**: Handle bookings and chats in real time.
- **Analytics Dashboard**: Gain full insights into engagement and popular items.
- **Track Performance**: Monitor your shop’s success with detailed analytics.
- **Chat with Customers**: Connect seamlessly with shoppers.
- **Reviews & Ratings**: Receive feedback to build trust and improve your store.

### External API Magic

- **Campus Quest API**: Powers the expanded badge system and exposes stores as quest locations via `GET /external/stores`.
- **Photo Journals**: Users can upload images to external journals (`externalImages`).

---

## Getting Started with ThriftFinder

### As a Shopper

1. **Sign Up**: Use your email or Google to join the thrift party.
2. **Explore the Map**: Find local thrift stores that match your vibe on any device.
3. **Browse & Filter**: Use advanced filters to sort by category, price, size, or style.
4. **Reserve & Review**: Reserve items, chat with sellers, and leave ratings.
5. **Track Your Haul**: View your reserved items in your Closet.
6. **Earn Badges**: Complete challenges and purchases to unlock rewards and flex your thrift skills.

### As a Store Owner

1. **Sign Up & Verify**: Create an account and verify your email.
2. **Set Up Your Store**: Build a profile with details and social links.
3. **List Items**: Upload your thrift treasures with images and details.
4. **Manage & Chat**: Handle reservations, chat with customers, and monitor reviews.
5. **Grow Your Vibe**: Use the analytics dashboard to boost your shop’s reach.

### Badges & Rewards

- Check your **Badges** page to see your earned rewards.
- Powered by the **Campus Quest API**, badges are earned by visiting stores, making purchases, and tackling challenges.
- Show off your thrift cred and become a style legend!

---

## Tech Stack Vibes

- **Frontend**: React + Tailwind CSS + React Router for a smooth, mobile-friendly UI.
- **Backend**: Node.js + Express for a snappy API.
- **Database**: Firebase Firestore for flexible, NoSQL data storage.
- **Storage**: Cloudinary for hosting crisp item images.
- **Auth**: Firebase Authentication for secure access.
- **Maps**: Leaflet via `react-leaflet` for interactive store discovery.
- **External API**: Campus Quest for badge-powered gamification.

_Styling Tip_: Use Tailwind classes like `bg-gradient-to-r from-purple-100 to-pink-100`, `text-purple-700`, and `shadow-lg` for a vibrant, modern look when rendering this doc.

---

## Access & Security

- **Public Access**: Browse the map without signing in.
- **Authenticated Features**: Sign-in required for reserving, chatting, reviewing, and managing stores.
- **Store Owner Verification**: Email verification ensures legit shop profiles.
- **Secure Backend**: Firebase Admin SDK keeps data safe and sound.

---

## Future Thrift Goals

- **In-App Payments**: Streamline purchases directly through the app.
- **Social Sharing**: Share your thrift finds and badges on social media.
- **AI Style Suggestions**: Get personalized item recommendations based on your vibe.
- **Community Events**: Host virtual thrift markets and local meetups.

---

> ThriftFinder is your mobile-friendly ticket to sustainable style, local connections, and a closet full of unique finds. Join the thrift revolution today!
