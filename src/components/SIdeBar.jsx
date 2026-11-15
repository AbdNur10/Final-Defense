// frontend/src/components/Sidebar.jsx
import useAuthUser from '../hooks/useAuthUser';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquareText } from "lucide-react";
import { MdHome, MdGroups, MdNotifications, MdSmartToy } from "react-icons/md";
import { FaUserFriends, FaInbox, FaTimes } from "react-icons/fa";
import UserAvatar from "./UserAvatar";

const Sidebar = ({ onClose }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: "/", icon: <MdHome className="size-5" />, label: "Home" },
    { path: "/inbox", icon: <FaInbox className="size-5" />, label: "Inbox" },
    { path: "/friends", icon: <FaUserFriends className="size-5" />, label: "Friends" },
    { path: "/groups", icon: <MdGroups className="size-5" />, label: "Groups" },
    { path: "/ai-mentor", icon: <MdSmartToy className="size-5" />, label: "AI Mentor" },
    { path: "/notifications", icon: <MdNotifications className="size-5" />, label: "Notifications" },
  ];

  return (
    <aside className="app-sidebar">
      {/* Close Button (Mobile Only) */}
      <div className="lg:hidden flex justify-end p-4 border-b">
        <button onClick={onClose} className="app-mobile-close" aria-label="Close navigation">
          <FaTimes className="size-5" />
        </button>
      </div>

      {/* Logo */}
      <div>
        <Link to="/" className="app-sidebar__brand" onClick={onClose}>
          <span className="app-sidebar__brand-mark"><MessageSquareText size={21} /></span>
          <span className="app-sidebar__brand-name">KYAU CHAT</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="app-sidebar__nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`app-nav-item ${currentPath === item.path ? "is-active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="app-sidebar__profile">
        <div className="app-sidebar__profile-row">
          <div className="app-sidebar__avatar">
            <UserAvatar src={authUser?.profilePicture} name={authUser?.fullName} />
          </div>
          <div className="app-sidebar__identity">
            <p className="app-sidebar__name">{authUser?.fullName}</p>
            <p className="app-sidebar__status">Online</p>
          </div>
        </div>
        <div className="app-sidebar__languages">
          <span className="app-language-tag">Native · {authUser?.nativeLanguage}</span>
          <span className="app-language-tag">Learning · {authUser?.learningLanguage}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;