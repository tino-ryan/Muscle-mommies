// src/pages/Dashboard.jsx
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to your Dashboard 🎉</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
