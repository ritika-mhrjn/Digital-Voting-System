import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, User, CheckCircle, Trash2, Heart, MessageCircle, Share, ThumbsUp, Laugh } from "lucide-react";
import { 
  getPosts, 
  getCandidates, 
  getVoterById, 
  addReaction, 
  addComment,
  getElections,
  updateUserProfile,
  uploadProfileImage
} from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";

// NAVBAR 
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

// REACTION TYPES - Facebook style with available icons
const REACTION_TYPES = [
  { type: "like", emoji: "👍", label: "Like", icon: ThumbsUp, color: "text-blue-600" },
  { type: "love", emoji: "❤️", label: "Love", icon: Heart, color: "text-red-600" },
  { type: "haha", emoji: "😂", label: "Haha", icon: Laugh, color: "text-yellow-600" },
  { type: "wow", emoji: "😮", label: "Wow", color: "text-yellow-600" },
  { type: "sad", emoji: "😢", label: "Sad", color: "text-yellow-600" },
  { type: "angry", emoji: "😡", label: "Angry", color: "text-red-600" }
];

// POST CARD - UPDATED WITH FACEBOOK-STYLE REACTIONS
const PostCard = ({ post, onReact, onComment, user }) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [localComments, setLocalComments] = useState(post.comments || []);

  // Check if current user has already reacted
  const userReaction = localReactions.find((r) => r.user_id === user?.id);
  
  // Reaction summary - count by type
  const reactionSummary = {};
  localReactions.forEach((r) => {
    reactionSummary[r.type] = (reactionSummary[r.type] || 0) + 1;
  });

  // Total reactions count
  const totalReactions = localReactions.length;

  // Get display reaction for current user
  const getCurrentUserReaction = () => {
    if (!userReaction) return null;
    return REACTION_TYPES.find(r => r.type === userReaction.type);
  };

  const currentUserReaction = getCurrentUserReaction();

  const handleReaction = async (reactionType) => {
    try {
      // If user already reacted with this type, remove reaction
      if (userReaction?.type === reactionType) {
        // For now, we'll just update the local state
        setLocalReactions(prev => prev.filter(r => r.user_id !== user.id));
        setShowReactionPicker(false);
        return;
      }

      // If user has a different reaction, update it
      if (userReaction) {
        // Update existing reaction
        setLocalReactions(prev => 
          prev.map(r => 
            r.user_id === user.id ? { ...r, type: reactionType } : r
          )
        );
      } else {
        // Add new reaction
        const newReaction = {
          user_id: user.id,
          type: reactionType,
          user: {
            fullName: user.fullName,
            profilePic: user.profilePic
          }
        };
        setLocalReactions(prev => [...prev, newReaction]);
      }

      setShowReactionPicker(false);
      
      // Send to backend
      await onReact(post._id, { user_id: user.id, type: reactionType });
    } catch (error) {
      console.error("Failed to add reaction:", error);
      // Revert local state on error
      setLocalReactions(post.reactions || []);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const newComment = {
        user_id: user.id,
        text: comment,
        user: {
          fullName: user.fullName,
          profilePic: user.profilePic
        },
        timestamp: new Date().toISOString()
      };

      // Update local state immediately
      setLocalComments(prev => [...prev, newComment]);
      setComment("");
      setShowCommentInput(false);
      
      // Send to backend
      await onComment(post._id, newComment);
    } catch (error) {
      console.error("Failed to add comment:", error);
      // Revert local state on error
      setLocalComments(prev => prev.filter(c => c.text !== comment));
    }
  };

  // Get author information with fallbacks
  const getAuthorInfo = () => {
    if (post.author && typeof post.author === 'object') {
      return {
        name: post.author.fullName || "Unknown User",
        pic: post.author.profilePic,
        role: post.author.role
      };
    }
    return {
      name: "Unknown User",
      pic: "/default-avatar.png",
      role: "user"
    };
  };

  const authorInfo = getAuthorInfo();

  // Get top reactions for display
  const getTopReactions = () => {
    const counts = {};
    localReactions.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => REACTION_TYPES.find(r => r.type === type)?.emoji)
      .filter(Boolean);
  };

  const topReactions = getTopReactions();

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <img 
          src={authorInfo.pic || "/default-avatar.png"} 
          alt="author" 
          className="w-10 h-10 rounded-full object-cover border"
          onError={(e) => {
            e.target.src = "/default-avatar.png";
          }}
        />
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            {authorInfo.name}
            {authorInfo.role === 'candidate' && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Candidate</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Recent"}
          </div>
        </div>
      </div>

      {post.text && <p className="mb-3 text-gray-800 whitespace-pre-wrap">{post.text}</p>}

      {post.media?.url && post.media.type === "image" && (
        <img 
          src={post.media.url} 
          alt="post" 
          className="w-full rounded-lg border mb-3 max-h-96 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}

      {post.media?.url && post.media.type === "video" && (
        <video 
          src={post.media.url} 
          controls 
          className="w-full rounded-lg border mb-3 max-h-96"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}

      {/* Reaction and Comment Stats */}
      {(totalReactions > 0 || localComments.length > 0) && (
        <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-100 pb-2 mb-2">
          <div className="flex items-center gap-2">
            {totalReactions > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {topReactions.map((emoji, index) => (
                    <span key={index} className="text-xs bg-white rounded-full border border-white -ml-1 first:ml-0">
                      {emoji}
                    </span>
                  ))}
                </div>
                <span>{totalReactions}</span>
              </div>
            )}
          </div>
          {localComments.length > 0 && (
            <span>{localComments.length} comments</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center border-t border-gray-100 pt-2">
        <div className="relative flex-1">
          <button
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setTimeout(() => setShowReactionPicker(false), 300)}
            onClick={() => handleReaction(currentUserReaction?.type || "like")}
            className={`flex items-center justify-center gap-2 px-2 py-2 rounded-lg transition w-full ${
              currentUserReaction 
                ? `${currentUserReaction.color} font-semibold` 
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {currentUserReaction ? (
              <>
                <span className="text-lg">{currentUserReaction.emoji}</span>
                <span>{currentUserReaction.label}</span>
              </>
            ) : (
              <>
                <ThumbsUp size={18} />
                <span>Like</span>
              </>
            )}
          </button>

          {/* Reaction Picker */}
          {showReactionPicker && (
            <div 
              className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg p-2 flex gap-1"
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
            >
              {REACTION_TYPES.map((reaction) => (
                <button
                  key={reaction.type}
                  className={`transform transition-transform hover:scale-125 text-2xl ${
                    userReaction?.type === reaction.type ? 'scale-110' : ''
                  }`}
                  onClick={() => handleReaction(reaction.type)}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
        >
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition">
          <Share size={18} />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="mt-4 space-y-3">
        {localComments.map((comment, index) => (
          <div key={index} className="flex items-start gap-3">
            <img 
              src={comment.user?.profilePic || "/default-avatar.png"} 
              alt={comment.user?.fullName} 
              className="w-8 h-8 rounded-full object-cover border"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            <div className="flex-1 bg-gray-50 rounded-lg p-3">
              <div className="font-semibold text-sm">{comment.user?.fullName || "User"}</div>
              <div className="text-gray-700 mt-1">{comment.text}</div>
              <div className="text-xs text-gray-500 mt-1">
                {comment.timestamp ? new Date(comment.timestamp).toLocaleTimeString() : "Now"}
              </div>
            </div>
          </div>
        ))}

        {showCommentInput && (
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-3">
            <img 
              src={user.profilePic || "/default-avatar.png"} 
              alt="You" 
              className="w-8 h-8 rounded-full object-cover border"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            <div className="flex-1">
              <input
                type="text"
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCommentInput(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="px-4 py-1 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Comment
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// FEED PAGE - UPDATED WITH DATA PERSISTENCE
const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load posts from backend
  const loadPosts = async () => {
    try {
      setRefreshing(true);
      const data = await getPosts();
      console.log("Fetched posts from backend:", data);
      
      // Ensure we have an array and properly initialize reactions and comments
      const postsWithInteractions = Array.isArray(data) ? data.map(post => ({
        ...post,
        reactions: Array.isArray(post.reactions) ? post.reactions : [],
        comments: Array.isArray(post.comments) ? post.comments : []
      })) : [];
      
      setPosts(postsWithInteractions);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleReact = async (postId, reaction) => {
    try {
      console.log("Adding reaction:", { postId, reaction });
      
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            // Remove existing reaction from this user if any
            const filteredReactions = post.reactions.filter(r => r.user_id !== reaction.user_id);
            // Add new reaction
            return {
              ...post,
              reactions: [...filteredReactions, reaction]
            };
          }
          return post;
        })
      );

      // Send to backend
      const response = await addReaction(postId, reaction);
      console.log("Reaction response:", response);
      
      // Reload posts to ensure sync with backend
      await loadPosts();
    } catch (err) {
      console.error('Failed to add reaction:', err);
      // Revert optimistic update on error
      await loadPosts();
    }
  };

  const handleComment = async (postId, comment) => {
    try {
      console.log("Adding comment:", { postId, comment });
      
      // Send to backend first
      const response = await addComment(postId, comment);
      console.log("Comment response:", response);
      
      // Reload posts to get updated data from backend
      await loadPosts();
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert("Failed to add comment. Please try again.");
    }
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
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
          ) : (
            <span className="text-blue-800 font-semibold">
              {user?.fullName?.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800">
            Welcome, {user?.fullName}
          </h1>
        </div>
        
      </div>

      {postsLoading ? (
        <div className="text-center text-gray-500 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto mb-2"></div>
          Loading posts from candidates...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-lg mb-2">No posts available yet</p>
          <p className="text-sm text-gray-600">Candidates haven't posted anything recently.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
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
  const { user, updateUser } = useAuth(); // Make sure your AuthContext provides updateUser
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || "");
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, WebP)");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Please select an image smaller than 2MB");
      return;
    }

    setUploading(true);
    
    try {
      const response = await uploadProfileImage(user.id, file);
      
      if (response.data && response.data.profilePic) {
        updateUser({ profilePic: response.data.profilePic });
      } else if (response.profilePic) {
        // Handle different response structures
        updateUser({ profilePic: response.profilePic });
      }
      
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try another one.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      try {
        const response = await updateUserProfile(user.id, { profilePic: "" });
        
        // Update user context
        if (response.data) {
          updateUser({ profilePic: "" });
        }
        
        alert("Profile picture removed successfully!");
      } catch (error) {
        console.error("Error removing profile picture:", error);
        alert("Failed to remove profile picture");
      }
    }
  };

  const saveBio = async () => {
    try {

      const response = await updateUserProfile(user.id, { bio: bioText });
      
      if (response.data) {
        updateUser({ bio: bioText });
      }
      
      setIsEditingBio(false);
      alert("Bio updated successfully!");
    } catch (error) {
      console.error("Error updating bio:", error);
      alert("Failed to update bio");
    }
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
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                  updateUser({ profilePic: "/default-avatar.png" });
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          <label className={`absolute bottom-2 right-2 p-2 rounded-full cursor-pointer shadow-md transition ${
            uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
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
          <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Uploading...
          </div>
        )}

        <div className="mt-4 w-full max-w-md">
          {isEditingBio ? (
            <>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Write something about yourself..."
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">{bioText.length}/500</span>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button 
                  onClick={() => setIsEditingBio(false)} 
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveBio}
                  disabled={!bioText.trim()}
                  className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={`text-gray-700 ${!user.bio ? "text-gray-400 italic" : ""}`}>
                {user.bio || "No bio added yet"}
              </p>
              <button 
                onClick={() => setIsEditingBio(true)} 
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline transition"
              >
                {user.bio ? "Edit Bio" : "Add Bio"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div><strong>Full Name:</strong> {user.fullName}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Date of Birth:</strong> {user.dateOfBirth || "N/A"}</div>
          <div><strong>Phone:</strong> {user.phone || "N/A"}</div>
          <div><strong>ID Type:</strong> {user.idType || "N/A"}</div>
          <div><strong>ID Number:</strong> {user.idNumber || "N/A"}</div>
          <div><strong>Voter ID:</strong> {user.voterId || "N/A"}</div>
          <div><strong>Province:</strong> {user.province || "N/A"}</div>
          <div><strong>District:</strong> {user.district || "N/A"}</div>
          <div><strong>Ward:</strong> {user.ward || "N/A"}</div>
        </div>
      </div>
    </div>
  );
};

// VOTENOW PAGE (Keep existing implementation)
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
  const [elections, setElections] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCandidatesLoading(true);
        const [candidatesData, electionsData] = await Promise.all([
          getCandidates(),
          getElections()
        ]);
        setCandidates(candidatesData || []);
        setElections(electionsData || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setCandidates([]);
        setElections([]);
      } finally {
        setCandidatesLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVote = (candidate) => {
    console.log("Vote button clicked for:", candidate.fullName);
    setPendingCandidate(candidate);
    setVerifError(null);
    setShowVerifier(true);
  };

  const onVerificationComplete = async () => {
    try {
      setVerifLoading(true);
      setShowVerifier(false);
      if (!pendingCandidate) throw new Error("No candidate selected for vote");

      console.log("Voting for candidate:", pendingCandidate._id);
      
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
                    key={candidate._id}
                    className="bg-white border rounded-xl shadow-md p-5 flex flex-col items-center text-center hover:shadow-lg transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={candidate.profilePic || "/default-profile.png"}
                        alt={candidate.fullName}
                        className="w-28 h-28 rounded-full object-cover border-2"
                        onError={(e) => {
                          e.target.src = "/default-profile.png";
                        }}
                      />
                      <div className="flex flex-col items-center">
                        {candidate.politicalSign && (
                          <>
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2">
                              <img
                                src={candidate.politicalSign}
                                alt={`${candidate.fullName} sign`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                            <span className="text-gray-600 text-sm mt-1">{candidate.signName || "Signature"}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg mb-1">{candidate.fullName}</h3>
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
                  Please verify your identity to vote for <strong>{pendingCandidate?.fullName}</strong>.
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
            You voted for <strong className="text-blue-700">{selectedCandidate?.fullName}</strong> from {selectedCandidate?.party}.
          </p>
        </div>
      )}
    </div>
  );
};

// MAIN DASHBOARD 
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