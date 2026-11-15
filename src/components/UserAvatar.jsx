import { useState } from "react";
import { UserRound } from "lucide-react";
import "./UserAvatar.css";

const getInitials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function UserAvatar({ src, name, className = "" }) {
  const [failedSrc, setFailedSrc] = useState("");
  const initials = getInitials(name);

  if (!src || failedSrc === src) {
    return (
      <span className={`user-avatar-fallback ${className}`} role="img" aria-label={`${name || "User"} avatar`}>
        {initials || <UserRound aria-hidden="true" />}
      </span>
    );
  }

  return (
    <img
      className={`user-avatar-image ${className}`}
      src={src}
      alt={`${name || "User"} avatar`}
      onError={() => setFailedSrc(src)}
    />
  );
}