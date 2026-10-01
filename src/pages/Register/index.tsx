import React from "react";
import { Link, Navigate } from "react-router-dom";

import { registerUser } from "../../store/auth-slice";
import { useAppDispatch, useAppSelector } from "../../store";

import "./register-styles.scss";

export interface IRegisterProps {
  onRegister: () => void;
}

const Register: React.FC<IRegisterProps> = (props) => {
  const {  onRegister } = props;
  const dispatch = useAppDispatch();
  const { status, error: apiError, isLoggedIn } = useAppSelector((state) => state.auth);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleNameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setName(event.target.value);
  };

  const handleEmailChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setConfirmPassword(event.target.value);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Complete all fields to create your account.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const result = await dispatch(registerUser({ email, name, password }));
    if (registerUser.fulfilled.match(result)) {
      setErrorMessage("");
      onRegister();
    }
  };

  const isSubmitting = status === "loading";
  const displayedError = errorMessage || apiError;

  if (isLoggedIn) {
    return <Navigate replace to="/chat" />;
  }

  return (
    <div className="register-page">
      <section className="register-page__aside">
        <span className="register-page__eyebrow">Make it yours</span>
        <h1>Keep every good conversation close.</h1>
        <p>
          Create your ChatApp account and bring your conversations into one calm
          space.
        </p>
      </section>
      <section className="register-page__panel">
        <span className="register-page__panel-kicker">Create your account</span>
        <h2>Join ChatApp.</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            onChange={handleNameChange}
            placeholder="Alex Morgan"
            type="text"
            value={name}
          />
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            onChange={handleEmailChange}
            placeholder="alex@example.com"
            type="email"
            value={email}
          />
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            onChange={handlePasswordChange}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            onChange={handleConfirmPasswordChange}
            placeholder="Repeat your password"
            type="password"
            value={confirmPassword}
          />
          {displayedError && (
            <p className="register-page__error" role="alert">
              {displayedError}
            </p>
          )}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="register-page__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
};

export default Register;
