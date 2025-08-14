# Tech Stack and Setup

Our application uses the following technologies:

- **Frontend**: React  
  - As none of our group members had prior experience with a JavaScript framework, we chose this project as an opportunity to learn and work with React.  
  - We selected React due to its popularity, simplicity, and ability to build fast, dynamic, and responsive web pages.
  - **Resources**: [React Documentation](https://react.dev/learn)
- **Backend**: Node.js + Express  
  - We have worked with Node.js and Express before, so we felt confident using them for this project.  
  - Express makes it simple to set up APIs.  
  - **Resources**: [Node.js Documentation](https://nodejs.org/en/docs/), [Express.js Guide](https://expressjs.com/en/starter/installing.html)
- **Authentication & Authorization**: Firebase Authentication  
  - We wanted a secure and easy-to-implement solution for user login and role-based access control without managing passwords ourselves.  
  - Firebase Authentication integrates seamlessly with our frontend and backend and supports multiple sign-in methods.
  - **Resources**: [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- **Database**: Firebase Firestore  
  - We chose Firestore because it’s easy to set up and works really well with Firebase Authentication.  
  - Its real-time updates are helpful for our app, and we don’t have to worry about managing our own database server.  
  - **Resources**: [Cloud Firestore Documentation](https://firebase.google.com/docs/firestore)
- **Hosting**:
- **Testing**: Jest  
  - We use Jest for unit and integration testing to make sure our code works as expected.  
  - It’s easy to set up with JavaScript and gives quick feedback when tests fail.  
  - **Resources**: [Jest Documentation](https://jestjs.io/docs/getting-started)

## Local Setup

To run the app locally:

```bash
git clone https://github.com/your-org/your-repo
cd your-repo
npm install
npm start
