import React from "react";
import { Link, Navigate } from "react-router-dom";

import "./login-styles.scss";
import { useAppSelector, useAppDispatch } from "../../store";
// import {  } from "react-redux";
import { loginUser } from "../../store/auth-slice";

export interface ILoginProps {
  onLogin: () => void;
}

const Login: React.FC<ILoginProps> = (props) => {
  const { onLogin } = props;
  const dispatch = useAppDispatch();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const {
    isLoggedIn,
    error: apiError,
    status,
  } = useAppSelector((state) => state.auth);

  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
  }

  function handlePasswordChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    setPassword(event.target.value);
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (!email || !password) {
      setErrorMessage("Enter your email and password to continue.");
      return;
    }

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      setErrorMessage("");
      onLogin();
    }
  };

  const isSubmitting = status === "loading";
  const displayedError = errorMessage || apiError;

  if (isLoggedIn) {
    return <Navigate replace to="/chat" />;
  }

  return (
    <div className="login-page">
      <section className="login-page__aside">
        <span className="login-page__eyebrow">Welcome back</span>
        <h1>Your people are already here.</h1>
        <p>Pick up the conversation wherever you left it.</p>
      </section>
      <section className="login-page__panel">
        <span className="login-page__panel-kicker">Sign in to ChatApp</span>
        <h2>Good to see you.</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            onChange={handleEmailChange}
            placeholder="alex@example.com"
            type="email"
            value={email}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            onChange={handlePasswordChange}
            placeholder="Enter your password"
            type="password"
            value={password}
          />
          {/* {errorMessage && (
            <p className="login-page__error" role="alert">
              {errorMessage}
            </p>
          )} */}
            {displayedError && (
            <p className="login-page__error" role="alert">
              {displayedError}
            </p>
          )}
          <button disabled={isSubmitting} type="submit">{isSubmitting? "Loading..." : "Continue to your chats"}</button>
        </form>
        <p className="login-page__footer">
          New to ChatApp? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </div>
  );
};

export default Login;
