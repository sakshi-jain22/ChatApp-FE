import React, { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Chat, Login, Register, Home } from "./pages";

import Navbar from "./components/Navbar";
import { AUTH_STORAGE_KEY } from "./constants";

import "./App.scss";
import { persistor, useAppDispatch, useAppSelector } from "./store";
import { logoutUser } from "./store/auth-slice";
import { getCurrentUser, resetSettings } from "./store/settings-slice";
import { resetChats } from "./store/chat-slice";

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAppSelector((state) => state.auth);

  const handleLogin = (): void => {
    navigate("/chat");
  };

  const handleRegister = (): void => {
    // localStorage.setItem(AUTH_STORAGE_KEY, "true");
    // setIsLoggedIn(true);
    navigate("/login");
  };

  const handleLogout = async (): Promise<void> => {
    dispatch(logoutUser());
    dispatch(resetSettings());
    dispatch(resetChats());
    localStorage.removeItem(AUTH_STORAGE_KEY);
    await persistor.flush();
    await persistor.purge();
    navigate("/");
  };

  useEffect(() => {
    if (!isLoggedIn && location.pathname == "/chat") {
      handleLogout();
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return (
    <>
      <Navbar
        showSearch={location.pathname === "/chat"}
        onLogout={handleLogout}
      />
      <main className="app__content">
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<Login onLogin={handleLogin} />} path="/login" />
          <Route
            element={<Register onRegister={handleRegister} />}
            path="/register"
          />
          <Route
            element={isLoggedIn ? <Chat /> : <Navigate replace to="/login" />}
            path="/chat"
          />
        </Routes>
      </main>
    </>
  );
};

export default App;
