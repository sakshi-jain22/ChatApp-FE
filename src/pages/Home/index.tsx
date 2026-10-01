import React from "react";
import { Link } from "react-router-dom";

import "./home-styles.scss";
import { useAppSelector } from "../../store";

export interface IHomeProps {
  username?: string;
}

const Home: React.FC<IHomeProps> = () => {
  const { isLoggedIn } = useAppSelector(state => state.auth);
  // const navigate = useNavigate()

  // if (!isLoggedIn) {
  //   navigate('/login');
  // }

  return (
    <div className="home-page">
      <section className="home-page__intro">
        <span className="home-page__eyebrow">Private conversations, beautifully simple</span>
        <h1>Make space for better conversations.</h1>
        <p>ChatApp keeps your people, messages, and moments close without the noise.</p>
        <Link className="home-page__action" to={isLoggedIn ? "/chat" : "/login"}>
          {isLoggedIn ? "Open your chats" : "Start chatting"}
        </Link>
      </section>
      <section className="home-page__preview" aria-label="ChatApp features">
        <div className="home-page__preview-header"><span className="home-page__status-dot" /> Your conversations</div>
        <div className="home-page__message home-page__message--received">Welcome back, Alex.</div>
        <div className="home-page__message home-page__message--sent">Good to see you here.</div>
      </section>
    </div>
  );
};

export default Home;
