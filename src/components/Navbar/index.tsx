import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiBell,
  FiChevronDown,
  FiMessageCircle,
  FiSearch,
} from "react-icons/fi";

import { useAppDispatch, useAppSelector } from "../../store";
import {
  setEnableNotifications,
  setOnlineStatus,
  setShowSearch,
} from "../../store/settings-slice";

import "./navbar-styles.scss";

export interface INavBarProps {
  showSearch?: boolean;
  enableNotifications?: boolean;
  isLoggedIn?: boolean;
  isOnline?: boolean;
  onLogout?: () => void;
}

const Navbar: React.FC<INavBarProps> = (props) => {
  const { onLogout } = props;

  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAppSelector((state) => state.auth);
  const {username } = useAppSelector(state => state.settings);
  const { enableNotifications, isOnline, showSearch } = useAppSelector(
    (state) => state.settings,
  );

  useEffect(() => {
    dispatch(setEnableNotifications(isLoggedIn));
    dispatch(setOnlineStatus(isLoggedIn));
    dispatch(setShowSearch(isLoggedIn));
  }, [isLoggedIn, dispatch, username]);

  console.log({username})

  return (
    <header className="navbar">
      <Link className="navbar__brand" to="/" aria-label="ChatApp home">
        <span className="navbar__brand-mark" aria-hidden="true">
          <FiMessageCircle />
        </span>
        <span className="navbar__brand-name">ChatApp</span>
      </Link>

      {isLoggedIn && showSearch && (
        <label className="navbar__search">
          <FiSearch aria-hidden="true" />
          <span className="sr-only">Search conversations</span>
          <input type="search" placeholder="Search conversations" />
          {/* <kbd>⌘ K</kbd> */}
        </label>
      )}

      <nav className="navbar__actions" aria-label="Account actions">
        {isLoggedIn && enableNotifications && (
          <button
            className="navbar__icon-button"
            type="button"
            aria-label="Notifications"
          >
            <FiBell aria-hidden="true" />
            <span className="navbar__notification-dot" aria-hidden="true" />
          </button>
        )}

        {isLoggedIn && (
          <>
            <button
              className="navbar__profile"
              type="button"
              aria-label="Open profile menu"
            >
              <span className="navbar__avatar" aria-hidden="true">
                AM
              </span>
              <span className="navbar__profile-copy">
                <strong>{username}</strong>
                {isOnline && (
                  <small>
                    <span className="navbar__online-dot" /> Online
                  </small>
                )}
              </span>
              <FiChevronDown aria-hidden="true" />
            </button>
            <button className="navbar__logout" onClick={onLogout} type="button">
              Sign out
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
