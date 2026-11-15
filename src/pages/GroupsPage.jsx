// frontend/src/pages/GroupsPage.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMyGroups, createGroup, searchUsers } from "../lib/api";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Plus, Search, Users, X } from "lucide-react";
import debounce from "lodash/debounce";
import toast from "react-hot-toast";
import "./GroupUI.css";
import UserAvatar from "../components/UserAvatar";

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ["groups"],
    queryFn: getMyGroups,
    retry: 1,
  });

  const { mutate: createGroupMutation, isPending } = useMutation({
    mutationFn: createGroup,
    onSuccess: (data) => {
      toast.success(`Group "${data.group?.name || groupName}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setShowCreateModal(false);
      setGroupName("");
      setSelectedMembers([]);
      setSearchQuery("");
      setSearchResults([]);
    },
    onError: (error) => {
      console.error("Create group error:", error);
      toast.error(error.response?.data?.message || "Failed to create group");
    },
  });

  const searchUsersDebounced = useMemo(() => debounce(async (query) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(normalizedQuery);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 350), []);

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

  const handleCreateGroup = (event) => {
    event.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    createGroupMutation({
      name: groupName,
      memberIds: selectedMembers.map(m => m._id),
    });
  };

  if (isLoading) {
    return (
      <div className="groups-loading">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="groups-page"><div className="groups-error">Failed to load groups: {error.message}</div></div>
    );
  }

  return (
    <div className="groups-page">
      <header className="groups-header">
        <div>
          <p className="groups-header__eyebrow">KYAU / YOUR CIRCLES</p>
          <h1>Groups</h1>
          <p className="groups-header__description">Small spaces for the conversations you share.</p>
        </div>
        <button className="groups-create-button" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} aria-hidden="true" /> Create group
        </button>
      </header>

      <section className="groups-content" aria-label="Your groups">
        {groups.length === 0 ? (
          <div className="groups-empty">
            <div className="groups-empty__inner">
              <span className="groups-empty__mark"><Users size={21} aria-hidden="true" /></span>
              <h2>Your first circle starts here.</h2>
              <p>Create a group and bring your people into one conversation.</p>
              <button className="groups-create-button" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} aria-hidden="true" /> Create a group
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="groups-content__label">{groups.length} {groups.length === 1 ? "GROUP" : "GROUPS"}</p>
            <div className="groups-grid">
              {groups.map((group) => {
                const members = group.members || [];
                return (
                  <Link key={group._id} to={`/groups/${group._id}`} className="group-card">
                    <div className="group-card__top">
                      <span className="group-card__mark"><Users size={20} aria-hidden="true" /></span>
                      <ArrowUpRight className="group-card__arrow" size={18} aria-hidden="true" />
                    </div>
                    <h2>{group.name}</h2>
                    <p className="group-card__description">
                      {group.description || "A shared place for your group."}
                    </p>
                    <div className="group-card__footer">
                      <span className="group-card__members" aria-label={`${members.length} members`}>
                        {members.slice(0, 4).map((member) => (
                          <span className="group-card__avatar" key={member._id}>
                            <UserAvatar src={member.profilePicture} name={member.fullName || "Group member"} />
                          </span>
                        ))}
                      </span>
                      <span>{members.length} {members.length === 1 ? "member" : "members"}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      {showCreateModal && (
        <div className="groups-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <section className="groups-modal" role="dialog" aria-modal="true" aria-labelledby="create-group-title" onClick={(e) => e.stopPropagation()}>
            <div className="groups-modal__header">
              <div>
                <p>KYAU / NEW CIRCLE</p>
                <h2 id="create-group-title">Create a group</h2>
              </div>
              <button className="groups-modal__close" aria-label="Close dialog" onClick={() => setShowCreateModal(false)}>
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup}>
              <label className="groups-modal__field">
                <span>Group name</span>
                <span className="groups-modal__input-wrap">
                  <Users size={16} aria-hidden="true" />
                  <input
                    className="groups-modal__input"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Give your group a name"
                    maxLength={60}
                    required
                    autoFocus
                  />
                </span>
              </label>

              <label className="groups-modal__field">
                <span>Add members <span className="font-normal">(optional)</span></span>
                <span className="groups-modal__input-wrap">
                  <Search size={16} aria-hidden="true" />
                  <input
                    className="groups-modal__input"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search people by name"
                  />
                  {searchQuery.length >= 2 && (
                    <div className="groups-modal__results">
                      {isSearching ? (
                        <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
                      ) : searchResults.length > 0 ? searchResults.map((user) => (
                        <button className="groups-modal__result" type="button" key={user._id} onClick={() => handleAddMember(user)}>
                          <img src={user.profilePicture} alt="" />
                          <span>{user.fullName}</span>
                          <Plus size={15} />
                        </button>
                      )) : (
                        <div className="px-3 py-2 text-xs text-gray-500">No people found.</div>
                      )}
                    </div>
                  )}
                </span>
              </label>

              {selectedMembers.length > 0 && (
                <div className="groups-modal__selected" aria-label="Selected members">
                  {selectedMembers.map((member) => (
                    <span className="groups-selected" key={member._id}>
                      <img src={member.profilePicture} alt="" />
                      {member.fullName}
                      <button type="button" aria-label={`Remove ${member.fullName}`} onClick={() => handleRemoveMember(member._id)}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="groups-modal__actions">
                <button type="button" className="groups-modal__button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="groups-modal__button groups-modal__button--primary" disabled={!groupName.trim() || isPending}>
                  {isPending ? "Creating…" : "Create group"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}