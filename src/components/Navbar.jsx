// frontend/src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { MessageSquareText } from "lucide-react";
import { FaBell, FaUsers, FaUserFriends, FaSignOutAlt, FaInbox } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { useNotificationStore } from "../store/useNotificationStore";
import { useSocket } from "../hooks/useSocket";
import { getFriendRequests } from "../lib/api";
import UserAvatar from "./UserAvatar";
import toast from "react-hot-toast";

const formatBadgeCount = (count) => count > 99 ? "99+" : `${count}+`;

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isChatPage = location.pathname?.startsWith("/chat");
  const isInboxPage = location.pathname?.startsWith("/inbox");
  const pageTitle = {
    "/": "Overview",
    "/inbox": "Inbox",
    "/friends": "Friends",
    "/groups": "Groups",
    "/ai-mentor": "AI mentor",
    "/notifications": "Notifications",
    "/settings": "Settings",
  }[location.pathname] || "Your conversations";
  const { unreadCount, increment, reset } = useNotificationStore();
  const { socket } = useSocket();
  const { logoutMutation } = useLogout();
  const { data: friendRequestData } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    enabled: Boolean(authUser),
    staleTime: 30000,
  });
  const pendingFriendRequests = friendRequestData?.incomingReqs?.length || 0;

  useEffect(() => {
    if (!socket) return;
    const handleGroupMsg = (message) => {
      if (message?.sender?._id === authUser?._id || location.pathname.startsWith("/groups/")) return;
      increment();
    };
    const handlePrivateMsg = (message) => {
      if (message?.sender?._id === authUser?._id || isChatPage) return;
      increment();
    };
    socket.on("new_group_message", handleGroupMsg);
    socket.on("new_private_message", handlePrivateMsg);
    return () => {
      socket.off("new_group_message", handleGroupMsg);
      socket.off("new_private_message", handlePrivateMsg);
    };
  }, [socket, increment, authUser?._id, location.pathname, isChatPage]);

  const handleLogout = () => {
    reset();
    logoutMutation();
    toast.success("Logged out successfully");
  };

  return (
    <nav className="app-topbar">
      <div className="app-topbar__inner">
        {isChatPage || isInboxPage ? (
          <Link to="/" className="app-topbar__brand">
            <MessageSquareText size={20} />
            KYAU CHAT
          </Link>
        ) : (
          <div className="app-topbar__context">
            <p className="app-topbar__eyebrow">KYAU / YOUR SPACE</p>
            <p className="app-topbar__title">{pageTitle}</p>
          </div>
        )}

        <div className="app-topbar__actions">
          <Link to="/inbox" className="app-icon-button" aria-label="Inbox" title="Inbox" onClick={reset}>
            <FaInbox />
            {unreadCount > 0 && <span className="app-icon-button__count" aria-label={`${unreadCount} unread messages`}>{formatBadgeCount(unreadCount)}</span>}
          </Link>
          <button
            onClick={() => navigate("/groups")}
            className="app-icon-button app-mobile-groups md:hidden"
            aria-label="Groups"
            title="Groups"
          >
            <FaUsers />
          </button>
          <Link to="/notifications" className="app-icon-button" aria-label="Notifications" title="Notifications">
            <FaBell />
            {pendingFriendRequests > 0 && <span className="app-icon-button__count" aria-label={`${pendingFriendRequests} pending friend requests`}>{formatBadgeCount(pendingFriendRequests)}</span>}
          </Link>
          <ThemeSelector />

          <div className="relative">
            <button
              className="app-user-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Open profile menu"
              aria-expanded={showUserMenu}
            >
              <span className="app-user-trigger__avatar">
                <UserAvatar src={authUser?.profilePicture} name={authUser?.fullName} />
              </span>
            </button>

            {showUserMenu && (
              <div className="app-user-menu" onClick={() => setShowUserMenu(false)}>
                <p className="app-user-menu__name">{authUser?.fullName}</p>
                <Link to="/inbox"><FaInbox /> Inbox</Link>
                <Link to="/friends"><FaUserFriends /> My Friends</Link>
                <Link to="/settings"><IoSettingsOutline /> Settings</Link>
                <button className="is-danger" onClick={handleLogout}><FaSignOutAlt /> Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;