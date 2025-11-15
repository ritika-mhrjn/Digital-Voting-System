import React, { useState, useEffect, useRef  } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, User, CheckCircle, Trash2 } from "lucide-react";
import { getPosts, getCandidates, addVoter, getVoterById, addReaction, addComment } from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";

//NAVBAR 
const Navbar = ({ setPage }) => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleNavigation = (pageName) => {
    console.log("Navigating to:", pageName);
    setPage(pageName);
  };

  return (
    <nav className="bg-blue-50 text-black flex items-center justify-between px-6 py-5 shadow-md fixed w-full top-0 left-0 z-50">
      <div
        className="flex-1 flex justify-center items-center cursor-pointer"
        onClick={() => handleNavigation("feed")}
      >
        <img src="/logo.png" alt="logo" className="h-16 w-auto object-contain cursor-pointer" />
      </div>
      <div className="flex items-center gap-5">
        <button
          onClick={() => handleNavigation("feed")}
          className="px-5 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition"
        >
          Feed
        </button>
        <button
          onClick={() => handleNavigation("profile")}
          className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition"
        >
          Profile
        </button>
        <button
          onClick={() => handleNavigation("votenow")}
          className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition"
        >
          Vote Now
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition flex items-center gap-1"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

//  POST CARD 
const PostCard = ({ post, onReact, onComment, user }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [comment, setComment] = useState("");

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onComment(post.id, {
        userId: user.id,
        userName: user.fullName,
        userPic: user.profilePic,
        text: comment,
      });
      setComment("");
    }
  };

  const reactionsList = ["👍", "❤️", "😂", "😮", "😢", "😡"];
  const userReaction = post.reactions?.find((r) => r.userId === user.id);
  const reactionSummary = {};
  post.reactions?.forEach((r) => {
    reactionSummary[r.emoji] = (reactionSummary[r.emoji] || 0) + 1;
  });

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <img src={post.authorPic || "/default-profile.png"} alt="author" className="w-10 h-10 rounded-full object-cover border" />
        <div className="flex-1">
          <div className="font-semibold">{post.authorName}</div>
          <div className="text-xs text-gray-500">{post.time}</div>
        </div>
      </div>

      {post.text && <p className="mb-3 text-gray-800">{post.text}</p>}

      {post.media && post.media.type === "image" && (
        <img src={post.media.url} alt="post" className="w-full rounded-lg border mb-3" />
      )}
      {post.media && post.media.type === "video" && (
        <video src={post.media.url} controls className="w-full rounded-lg mb-3" />
      )}

      <div className="flex items-center gap-2 mb-2 relative">
        <button
          className="px-3 py-1 border rounded hover:bg-gray-200 transition flex items-center gap-1"
          onMouseEnter={() => setShowReactions(true)}
        >
          {userReaction ? userReaction.emoji : "👍"} Like {post.reactions?.length > 0 && `(${post.reactions.length})`}
        </button>
        {showReactions && (
          <div
            className="absolute top-10 flex gap-2 bg-white border shadow rounded p-2 z-10"
            onMouseLeave={() => setShowReactions(false)}
          >
            {reactionsList.map((emoji) => (
              <span
                key={emoji}
                className="cursor-pointer text-xl transform hover:scale-125 transition"
                onClick={() => {
                  onReact(post.id, { userId: user.id, emoji });
                  setShowReactions(false);
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 mb-2">
        {Object.keys(reactionSummary).map((emoji) => (
          <span key={emoji} className="mr-2">
            {emoji} {reactionSummary[emoji]}
          </span>
        ))}
      </div>

      <div className="mt-2 space-y-2">
        {post.comments?.map((c, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            {c.userPic ? (
              <img src={c.userPic} alt={c.userName} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <span className="font-semibold">{c.userName}: </span> {c.text}
            </div>
          </div>
        ))}
        <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 border px-2 py-1 rounded"
          />
          <button type="submit" className="px-3 py-1 bg-blue-800 text-white rounded">Post</button>
        </form>
      </div>
    </div>
  );
};

// FEED PAGE
const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);
        const data = await getPosts();
        setPosts(data || []);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleReact = (postId, newReaction) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const existing = p.reactions?.find((r) => r.userId === newReaction.userId);
          const updatedReactions = existing
            ? p.reactions.map((r) =>
              r.userId === newReaction.userId ? { ...r, emoji: newReaction.emoji } : r
            )
            : [...(p.reactions || []), newReaction];
          return { ...p, reactions: updatedReactions };
        }
        return p;
      })
    );

    (async () => {
      try {
        await addReaction(postId, {
          user_id: newReaction.userId,
          type: newReaction.emoji,
        });
      } catch (err) {
        console.error('Failed to persist reaction:', err);
      }
    })();
  };

  const handleComment = (postId, commentObj) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? {
          ...p,
          comments: [...(p.comments || []), commentObj]
        } : p
      )
    );

    (async () => {
      try {
        await addComment(postId, {
          user_id: commentObj.userId,
          text: commentObj.text,
        });
      } catch (err) {
        console.error('Failed to persist comment:', err);
      }
    })();
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-28 px-4">
        <div className="text-center text-gray-500">Please wait...</div>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto mt-28 px-4">
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-gray-300">
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt={user?.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-blue-800 font-semibold">
              {user?.fullName?.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Welcome, {user?.fullName}
          </h1>
        </div>
      </div>
      {postsLoading ? (
        <div className="text-center text-gray-500">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500">No posts available</div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReact={handleReact}
            onComment={handleComment}
            user={user}
          />
        ))
      )}
    </div>
  );
};

// PROFILE PAGE 
const ProfilePage = () => {
  const { user, updateBio, updateProfilePic } = useAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.bio) {
      setBioText(user.bio);
    }
  }, [user]);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
t
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB max
      alert("Please select an image smaller than 2MB");
      return;
    }

    setUploading(true);
    
    try {
      const url = URL.createObjectURL(file);
      updateProfilePic(url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try another one.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfilePic = () => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      updateProfilePic(null);
    }
  };

  const saveBio = () => {
    updateBio(bioText);
    setIsEditingBio(false);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-28 px-4">
        <div className="text-center text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-28 px-4 space-y-8">
      <div className="bg-white rounded-xl shadow-lg border p-8 flex flex-col items-center text-center relative">
        <div className="relative">
          <div className="w-40 h-40 rounded-full border-4 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100 relative">
            {uploading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
              </div>
            )}
            
            {user.profilePic ? (
              <img 
                src={user.profilePic} 
                alt="profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-sm font-medium">Profile</span>
            )}
          </div>

          {/* Camera button */}
          <label className={`absolute bottom-2 right-2 p-2 rounded-full cursor-pointer shadow-md transition ${
            uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gray-700 hover:bg-gray-800'
          }`}>
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/jpg,image/png,image/webp" 
              onChange={handleProfilePicChange} 
              disabled={uploading}
              className="hidden" 
            />
          </label>

          {user.profilePic && !uploading && (
            <button
              onClick={handleRemoveProfilePic}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
              title="Remove profile picture"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-gray-800">{user.fullName} ({user.role})</h2>
        <p className="text-gray-500">{user.email}</p>

        {uploading && (
          <div className="mt-2 text-sm text-blue-600">
            Uploading...
          </div>
        )}

        <div className="mt-4 w-full">
          {isEditingBio ? (
            <>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
                rows={3}
                placeholder="Write something about yourself..."
              />
              <div className="flex justify-end gap-2 mt-3">
                <button 
                  onClick={() => setIsEditingBio(false)} 
                  className="px-4 py-2 rounded border hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveBio} 
                  className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition"
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={`text-gray-700 italic ${!user.bio ? "underline text-gray-400" : ""}`}>
                {user.bio || "No bio added yet"}
              </p>
              <button 
                onClick={() => setIsEditingBio(true)} 
                className="mt-2 text-sm text-gray-600 hover:underline"
              >
                Edit Bio
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
        <div className="flex flex-col gap-3 text-gray-700">
          <p><strong>FullName:</strong> {user.fullName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Date of Birth:</strong> {user.dateOfBirth || "N/A"}</p>
          <p><strong>Phone:</strong> {user.phone || "N/A"}</p>
          <p><strong>ID Type:</strong> {user.idType || "N/A"}</p>
          <p><strong>ID Number:</strong> {user.idNumber || "N/A"}</p>
          <p><strong>Voter ID:</strong> {user.voterId}</p>
          <p><strong>Province:</strong> {user.province || "N/A"}</p>
          <p><strong>District:</strong> {user.district || "N/A"}</p>
          <p><strong>Ward:</strong> {user.ward || "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

//  VOTENOW PAGE 
const VoteNowPage = () => {
  const { user } = useAuth();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voted, setVoted] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [pendingCandidate, setPendingCandidate] = useState(null);
  const [showVerifier, setShowVerifier] = useState(false);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifError, setVerifError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setCandidatesLoading(true);
        const data = await getCandidates();
        setCandidates(data || []);
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
        setCandidates([]);
      } finally {
        setCandidatesLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const handleVote = (candidate) => {
    console.log("Vote button clicked for:", candidate.name);
    setPendingCandidate(candidate);
    setVerifError(null);
    setShowVerifier(true);
  };

  const onVerificationComplete = async () => {
    try {
      setVerifLoading(true);
      setShowVerifier(false);
      if (!pendingCandidate) throw new Error("No candidate selected for vote");

      const effectiveUserId = user?._id || user?.id || user?.voterId || localStorage.getItem("voterId");
      console.log("Submitting vote for user:", effectiveUserId);

      await addVoter({ userId: effectiveUserId, candidateId: pendingCandidate.id });
      setSelectedCandidate(pendingCandidate);
      setVoted(true);
      setPendingCandidate(null);
    } catch (err) {
      console.error("Voting failed:", err);
      setVerifError(err.response?.data?.message || err.message || "Vote failed.");
    } finally {
      setVerifLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-28 px-4">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-28 px-4">
      {!voted ? (
        <>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6 text-center">
            Vote for Change <br />
            <span className="text-2xl font-bold text-blue-800 block mt-2">Select Your Representative</span>
          </h2>

          {candidatesLoading ? (
            <div className="text-center text-gray-500">Loading candidates...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {candidates.length === 0 ? (
                <div className="col-span-3 text-center text-gray-500">No candidates available</div>
              ) : (
                candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white border rounded-xl shadow-md p-5 flex flex-col items-center text-center hover:shadow-lg transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={candidate.photo || "/default-profile.png"}
                        alt={candidate.name}
                        className="w-28 h-28 rounded-full object-cover border-2"
                      />
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2">
                          <img
                            src={candidate.sign || "/default-sign.png"}
                            alt={`${candidate.name} sign`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-gray-600 text-sm mt-1">{candidate.signName || "Signature"}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg mb-1">{candidate.name}</h3>
                    <p className="text-gray-500 mb-2">{candidate.party}</p>
                    <p className="text-gray-600 italic text-sm mt-1 mb-3">{candidate.bio}</p>
                    <button
                      onClick={() => handleVote(candidate)}
                      className="px-5 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 transition"
                    >
                      Vote
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {showVerifier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Verification Required</h3>
                  <button
                    onClick={() => {
                      setShowVerifier(false);
                      setPendingCandidate(null);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Please verify your identity to vote for <strong>{pendingCandidate?.name}</strong>.
                </p>

                <div className="p-4 border rounded bg-gray-50 text-center">
                  <p className="mb-4">Verification component would appear here</p>
                  <button
                    onClick={onVerificationComplete}
                    className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 disabled:opacity-50"
                    disabled={verifLoading}
                  >
                    {verifLoading ? "Verifying..." : "Simulate Verification"}
                  </button>
                </div>

                {verifError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {verifError}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center bg-white p-10 rounded-xl shadow-lg">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-3 animate-bounce" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Vote Submitted Successfully!</h2>
          <p className="text-gray-600">
            You voted for <strong className="text-blue-700">{selectedCandidate?.name}</strong> from {selectedCandidate?.party}.
          </p>
        </div>
      )}
    </div>
  );
};

//  MAIN DASHBOARD 
const VoterDashboard = () => {
  const [page, setPage] = useState("feed");
  const { user, loading } = useAuth();

  console.log("Current page:", page);
  console.log("User state:", user);
  console.log("Loading state:", loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar setPage={setPage} />
      {page === "feed" && <FeedPage />}
      {page === "profile" && <ProfilePage />}
      {page === "votenow" && <VoteNowPage />}
    </div>
  );
};

export default VoterDashboard;