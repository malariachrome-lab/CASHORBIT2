import { useState } from "react";
import Modal from "./Modal";
import Login from "../pages/Login";
import Register from "../pages/Register";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleToggle = () => setIsLogin(!isLogin);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLogin ? "Login to Cash Orbit" : "Register for Cash Orbit"}
    >
      {isLogin ? (
        <Login onRegisterClick={handleToggle} onLoginSuccess={onClose} />
      ) : (
        <Register onLoginClick={handleToggle} onRegisterSuccess={onClose} />
      )}
    </Modal>
  );
}