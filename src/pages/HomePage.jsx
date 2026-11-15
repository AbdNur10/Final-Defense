// frontend/src/pages/HomePage.jsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getOutgoingFriendReqs, getRecommendedUsers, getUserFriends, sendFriendRequest } from "../lib/api";
import { Link } from "react-router-dom";
import { FaUserPlus, FaUserCheck, FaUserFriends, FaMapMarkerAlt } from "react-icons/fa";
import { MdCheckCircle } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import toast from "react-hot-toast";
import UserAvatar from "../components/UserAvatar";

const EMPTY_REQUESTS = [];

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs = EMPTY_REQUESTS } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (_, userId) => {
      setOutgoingRequestsIds((prev) => new Set([...prev, userId]));
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      toast.success("Friend request sent!");
    },
    onError: () => toast.error("Failed to send request"),
  });

  useEffect(() => {
    if (!outgoingFriendReqs.length) {
      setOutgoingRequestsIds(new Set());
      return;
    }
    const ids = new Set(outgoingFriendReqs.map((req) => req.recipient?._id));
    setOutgoingRequestsIds(ids);
  }, [outgoingFriendReqs]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <div>
          <p className="dashboard-kicker">KYAU / COMMUNITY</p>
          <h1>Find your people.</h1>
          <p>Keep a good conversation going.</p>
        </div>
        <Link to="/notifications" className="dashboard-requests">
          <IoMdTime aria-hidden="true" />
          Friend requests
        </Link>
      </header>

      <section className="dashboard-section" aria-labelledby="friends-heading">
        <div className="dashboard-section__heading">
          <div>
            <h2 id="friends-heading">Your circle</h2>
            <p>{friends.length === 1 ? "1 connection" : `${friends.length} connections`}</p>
          </div>
          <span className="dashboard-count" aria-label={`${friends.length} friends`}>{friends.length}</span>
        </div>

        {loadingFriends ? (
          <div className="dashboard-loading"><span className="loading loading-spinner" /></div>
        ) : friends.length === 0 ? (
          <div className="dashboard-empty">Your conversations will appear here once you connect with someone.</div>
        ) : (
          <div className="dashboard-grid">
            {friends.map((friend) => (
              <article key={friend._id} className="dashboard-person">
                <div className="dashboard-person__identity">
                  <div className="dashboard-person__avatar">
                    <UserAvatar src={friend.profilePicture} name={friend.fullName} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="dashboard-person__name">{friend.fullName}</h3>
                    <p className="dashboard-person__location">Your friend</p>
                  </div>
                </div>
                <div className="dashboard-person__languages">
                  <span className="dashboard-language">Native · {friend.nativeLanguage}</span>
                  <span className="dashboard-language">Learning · {friend.learningLanguage}</span>
                </div>
                <Link to={`/chat/${friend._id}`} className="dashboard-person__action">
                  <FaUserCheck aria-hidden="true" /> Message
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section" aria-labelledby="learners-heading">
        <div className="dashboard-section__heading">
          <div>
            <h2 id="learners-heading">Meet new learners</h2>
            <p>People ready for their next conversation</p>
          </div>
          <FaUserPlus className="text-[#6a876e]" aria-hidden="true" />
        </div>

        {loadingUsers ? (
          <div className="dashboard-loading"><span className="loading loading-spinner" /></div>
        ) : recommendedUsers.length === 0 ? (
          <div className="dashboard-empty">No new recommendations at the moment.</div>
        ) : (
          <div className="dashboard-grid">
            {recommendedUsers.map((user) => {
              const hasSent = outgoingRequestsIds.has(user._id);
              return (
                <article key={user._id} className="dashboard-person">
                  <div className="dashboard-person__identity">
                    <div className="dashboard-person__avatar">
                      <UserAvatar src={user.profilePicture} name={user.fullName} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="dashboard-person__name">{user.fullName}</h3>
                      <p className="dashboard-person__location">
                        <FaMapMarkerAlt className="mr-1 inline" aria-hidden="true" />
                        {user.location || "Location not set"}
                      </p>
                    </div>
                  </div>
                  <div className="dashboard-person__languages">
                    <span className="dashboard-language">Native · {user.nativeLanguage}</span>
                    <span className="dashboard-language">Learning · {user.learningLanguage}</span>
                  </div>
                  {user.bio && <p className="dashboard-person__bio">{user.bio}</p>}
                  <button
                    className="dashboard-person__action"
                    disabled={hasSent || isPending}
                    onClick={() => sendRequestMutation(user._id)}
                  >
                    {hasSent ? <MdCheckCircle aria-hidden="true" /> : <FaUserPlus aria-hidden="true" />}
                    {hasSent ? "Request sent" : "Connect"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;