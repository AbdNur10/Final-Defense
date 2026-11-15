// frontend/src/components/AddMembersModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { searchUsers, addGroupMembers } from "../lib/api";
import { Search, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import debounce from "lodash/debounce";
import "../pages/GroupUI.css";
import UserAvatar from "./UserAvatar";

export default function AddMembersModal({ groupId, groupName, existingMembers = [], onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();
  const existingMemberIds = useMemo(
    () => new Set(existingMembers.map((member) => String(member._id))),
    [existingMembers]
  );

  const searchUsersDebounced = useMemo(() => debounce(async (query) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(normalizedQuery);
      setSearchResults(
        (Array.isArray(results) ? results : []).filter(
          (user) => !existingMemberIds.has(String(user._id))
        )
      );
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 350), [existingMemberIds]);

  useEffect(() => () => searchUsersDebounced.cancel(), [searchUsersDebounced]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsersDebounced(query);
  };

  const handleAddMember = (user) => {
    setSelectedMembers((members) =>
      members.some((member) => member._id === user._id) ? members : [...members, user]
    );
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers((members) => members.filter((member) => member._id !== userId));
  };

  const { mutate: addMembers, isPending } = useMutation({
    mutationFn: () => addGroupMembers(groupId, selectedMembers.map(m => m._id)),
    onSuccess: (data) => {
      if (data?.group) {
        queryClient.setQueryData(["groups"], (groups = []) =>
          groups.map((group) => group._id === groupId ? data.group : group)
        );
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success(`${selectedMembers.length} member(s) added!`);
      onClose();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to add members"),
  });

  return (
    <div className="groups-modal-backdrop" onClick={onClose}>
      <section
        className="groups-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-members-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="groups-modal__header">
          <div>
            <p>KYAU / GROUP MEMBERS</p>
            <h2 id="add-members-title">Add to {groupName}</h2>
          </div>
          <button className="groups-modal__close" aria-label="Close dialog" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <label className="groups-modal__field">
          <span>Find people</span>
          <span className="groups-modal__input-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              className="groups-modal__input"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name or email"
              autoFocus
            />
            {searchQuery.trim().length >= 2 && (
              <div className="groups-modal__results">
                {isSearching ? (
                  <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
                ) : searchResults.length > 0 ? searchResults.map((user) => (
                  <button
                    className="groups-modal__result"
                    type="button"
                    key={user._id}
                    disabled={selectedMembers.some((member) => member._id === user._id) || isPending}
                    onClick={() => handleAddMember(user)}
                  >
                    <UserAvatar src={user.profilePicture} name={user.fullName} className="groups-modal__result-avatar" />
                    <span>{user.fullName}</span>
                    <UserPlus size={15} />
                  </button>
                )) : (
                  <div className="px-3 py-2 text-xs text-gray-500">No new members found.</div>
                )}
              </div>
            )}
          </span>
        </label>

        {selectedMembers.length > 0 && (
          <div className="groups-modal__selected" aria-label="Selected members">
            {selectedMembers.map((member) => (
              <span className="groups-selected" key={member._id}>
                <UserAvatar src={member.profilePicture} name={member.fullName} className="groups-selected-avatar" />
                {member.fullName}
                <button type="button" aria-label={`Remove ${member.fullName}`} disabled={isPending} onClick={() => handleRemoveMember(member._id)}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="groups-modal__actions">
          <button className="groups-modal__button" onClick={onClose} disabled={isPending}>Cancel</button>
          <button className="groups-modal__button groups-modal__button--primary" onClick={() => addMembers()} disabled={!selectedMembers.length || isPending}>
            {isPending ? "Adding…" : `Add ${selectedMembers.length} ${selectedMembers.length === 1 ? "member" : "members"}`}
          </button>
        </div>
      </section>
    </div>
  );
}