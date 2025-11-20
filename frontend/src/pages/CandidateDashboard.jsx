import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Video, X, Edit2, Trash2, Save, LogOut } from "lucide-react";
import { getPosts, createPost, updatePost, deletePost, uploadProfileImage, updateUserProfile } from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";

const Notification = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border ${
      type === "success" 
        ? "bg-green-100 border-green-400 text-green-800" 
        : "bg-red-100 border-red-400 text-red-800"
    }`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// -------- Navbar --------
const Navbar = ({ setPage, search, setSearch }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-blue-50 text-black flex items-center justify-between px-6 py-3 shadow-md fixed w-full top-0 left-0 z-20">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage("feed")}>
        <img src="/logo.png" alt="logo" className="h-22 w-auto object-contain cursor-pointer" />
      </div>
      <div className="hidden md:block w-1/3 mx-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring"
        />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setPage("feed")} className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900">
          Feed
        </button>
        <button onClick={() => setPage("profile")} className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900">
          Profile
        </button>
        <button onClick={handleLogout} className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 flex items-center gap-1">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </nav>
  );
};

// -------- PostCard --------
const PostCard = ({ post, user, onViewMedia, onDelete, onSaveEdit }) => {
  const [editText, setEditText] = useState(post.text);
  const [isEditing, setIsEditing] = useState(false);
  
  const authorImageErrorRef = useRef(false);
  const mediaImageErrorRef = useRef(false);

  useEffect(() => {
    authorImageErrorRef.current = false;
    mediaImageErrorRef.current = false;
  }, [post.authorPic, post.media?.url]);

  const isOwner = post.author?._id === user?.id || 
                  post.authorId === user?.id || 
                  post.author === user?.id;

  // Get initial from name
  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const saveEdit = async () => {
    if (!editText.trim()) {
      alert("Post text cannot be empty");
      return;
    }
    
    try {
      await updatePost(post._id, { text: editText });
      onSaveEdit(post._id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("Failed to update post. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      await deletePost(post._id);
      onDelete(post._id);
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  // Get author information with multiple fallbacks 
  const getAuthorInfo = () => {
    // Case 1: Author is populated with full object and has profilePic
    if (post.author && typeof post.author === 'object' && post.author.fullName && post.author.profilePic) {
      return {
        name: post.author.fullName,
        pic: post.author.profilePic,
        initial: getInitial(post.author.fullName)
      };
    }
    
    // Case 2: Direct authorPic field exists
    if (post.authorPic) {
      return {
        name: post.authorName || (post.author && typeof post.author === 'object' ? post.author.fullName : "User"),
        pic: post.authorPic,
        initial: getInitial(post.authorName || (post.author && typeof post.author === 'object' ? post.author.fullName : "U"))
      };
    }
    
    // Case 3: Current user is the author and has profilePic
    if (isOwner && user && user.profilePic) {
      return {
        name: user.fullName,
        pic: user.profilePic,
        initial: getInitial(user.fullName)
      };
    }
    
    // Case 4: Author object exists but no profilePic - show initial
    if (post.author && typeof post.author === 'object' && post.author.fullName) {
      return {
        name: post.author.fullName,
        pic: null, // Force showing initial
        initial: getInitial(post.author.fullName)
      };
    }
    
    // Case 5: Direct authorName but no authorPic - show initial
    if (post.authorName) {
      return {
        name: post.authorName,
        pic: null, // Force showing initial
        initial: getInitial(post.authorName)
      };
    }
    
    // Case 6: Current user is the author but no profilePic
    if (isOwner && user) {
      return {
        name: user.fullName,
        pic: null, // Force showing initial
        initial: getInitial(user.fullName)
      };
    }
    
    // Case 7: Fallback
    return {
      name: "Unknown User",
      pic: null, // Force showing initial
      initial: "U"
    };
  };

  const authorInfo = getAuthorInfo();
  const postDate = post.createdAt ? new Date(post.createdAt).toLocaleString() : 
                   post.time || "Unknown date";

  // Safe image handler to prevent blob URL errors
  const getSafeImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:')) {
      return null;
    }
    return url;
  };

  // Determine what to show based on error state and available data
  const shouldShowAuthorImage = authorInfo.pic && !authorImageErrorRef.current;
  const shouldShowMediaImage = post.media && post.media.type === "image" && !mediaImageErrorRef.current;

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        {shouldShowAuthorImage ? (
          <img 
            src={getSafeImageUrl(authorInfo.pic)} 
            alt="author" 
            className="w-10 h-10 rounded-full object-cover border cursor-pointer" 
            onClick={() => onViewMedia(getSafeImageUrl(authorInfo.pic), "image")} 
            onError={(e) => {
              console.error("Failed to load author image:", authorInfo.pic);
              authorImageErrorRef.current = true;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full border bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">{authorInfo.initial}</span>
          </div>
        )}
        <div className="flex-1">
          <div className="font-semibold">{authorInfo.name}</div>
          <div className="text-xs text-gray-500">{postDate}</div>
        </div>
        {isOwner && (
          <div className="flex gap-3 text-gray-600">
            {isEditing ? (
              <button onClick={saveEdit} title="Save" className="hover:text-blue-700">
                <Save size={18} />
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} title="Edit" className="hover:text-blue-700">
                <Edit2 size={18} />
              </button>
            )}
            <button onClick={handleDelete} title="Delete" className="hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea 
          value={editText} 
          onChange={(e) => setEditText(e.target.value)} 
          className="w-full border rounded p-2"
          rows={3}
        />
      ) : (
        post.text && <p className="mb-3 text-gray-800 whitespace-pre-wrap">{post.text}</p>
      )}

      {shouldShowMediaImage && (
        <img 
          src={getSafeImageUrl(post.media.url)} 
          alt="post" 
          className="w-full object-contain rounded-lg border cursor-pointer max-h-[600px]" 
          onClick={() => onViewMedia(getSafeImageUrl(post.media.url), "image")} 
          onError={(e) => {
            mediaImageErrorRef.current = true;
            e.target.style.display = 'none';
          }}
        />
      )}
      {post.media && post.media.type === "video" && (
        <video 
          src={post.media.url} 
          controls 
          className="w-full rounded-lg border cursor-pointer max-h-[600px]" 
          onClick={() => onViewMedia(post.media.url, "video")} 
          onError={(e) => {
            console.error("Failed to load post video:", post.media.url);
            e.target.style.display = 'none';
          }}
        />
      )}
    </div>
  );
};

// -------- PostCreator --------
const PostCreator = ({ user, posts, setPosts, onPostCreated }) => {
  const [text, setText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get initial from user name
  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const handlePickMedia = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (type === "image" && !file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }
    
    if (type === "video" && !file.type.startsWith('video/')) {
      alert("Please select a video file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("File size should be less than 10MB");
      return;
    }
    
    const url = URL.createObjectURL(file);
    setSelectedMedia({ 
      type, 
      url,
      file
    });
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedMedia) {
      alert("Please add some text or media to your post.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Convert file to base64 for proper storage
      let mediaData = undefined;
      
      if (selectedMedia?.file) {
        const base64 = await fileToBase64(selectedMedia.file);
        mediaData = {
          type: selectedMedia.type,
          url: base64,
          filename: selectedMedia.file.name
        };
      }

      // Prepare complete post data with all required fields - FIXED PROFILE PICTURE DATA
      const postData = {
        text: text.trim(),
        author: user?.id,
        authorName: user?.fullName,
        authorPic: user?.profilePic, // This should now contain the actual profile picture
        media: mediaData,
        reactionsCount: 0,
        comments: [],
        isCandidatePost: true,
        createdAt: new Date().toISOString()
      };

      console.log("Sending post data with profile pic:", user?.profilePic ? "YES" : "NO");

      const savedPost = await createPost(postData);
      
      // Handle different response structures from createPost
      const newPost = savedPost.data || savedPost;
      
      // Create a complete temporary post for immediate display - FIXED AUTHOR DATA
      const tempPost = {
        ...newPost,
        _id: newPost._id || `temp-${Date.now()}`,
        author: {
          _id: user?.id,
          fullName: user?.fullName,
          profilePic: user?.profilePic // Ensure profile pic is passed to author object
        },
        authorName: newPost.authorName || user?.fullName,
        authorPic: newPost.authorPic || user?.profilePic, // Ensure profile pic is passed
        reactionsCount: newPost.reactionsCount || 0,
        comments: newPost.comments || [],
        createdAt: newPost.createdAt || new Date().toISOString()
      };
      
      console.log("Created temp post with author data:", {
        author: tempPost.author,
        authorPic: tempPost.authorPic
      });
      
      // Add the new post to the beginning of the posts array
      setPosts(prevPosts => {
        const safePrevPosts = Array.isArray(prevPosts) ? prevPosts : [];
        return [tempPost, ...safePrevPosts];
      });
      
      setText("");
      setSelectedMedia(null);
      
      // Clean up the blob URL
      if (selectedMedia?.url) {
        URL.revokeObjectURL(selectedMedia.url);
      }

      // Show success notification
      if (onPostCreated) {
        onPostCreated("Post created successfully!");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please check the data and try again.");
      
      // Show error notification
      if (onPostCreated) {
        onPostCreated("Failed to create post. Please try again.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleRemoveMedia = () => {
    if (selectedMedia?.url) {
      URL.revokeObjectURL(selectedMedia.url);
    }
    setSelectedMedia(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
      <div className="flex items-center gap-3 mb-3">
        {/* Profile picture in PostCreator - FIXED */}
        {user?.profilePic ? (
          <img 
            src={user.profilePic} 
            alt="profile" 
            className="w-10 h-10 rounded-full object-cover border" 
            onError={(e) => {
              console.error("Failed to load profile picture in PostCreator:", user.profilePic);
              e.target.style.display = 'none';
              // This will fall back to showing the initial in the next render
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full border bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">{getInitial(user?.fullName)}</span>
          </div>
        )}
        <textarea
          placeholder={`What's on your mind, ${user?.fullName || 'User'}?`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 outline-none resize-none"
          rows={3}
        />
      </div>
      
      {selectedMedia && (
        <div className="relative mb-3">
          {selectedMedia.type === "image" ? (
            <img 
              src={selectedMedia.url} 
              alt="preview" 
              className="w-full rounded border object-contain max-h-[300px]" 
            />
          ) : (
            <video 
              src={selectedMedia.url} 
              controls 
              className="w-full rounded border max-h-[300px]" 
            />
          )}
          <button 
            type="button" 
            className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80"
            onClick={handleRemoveMedia}
          >
            <X size={18} />
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
            <Camera className="w-5 h-5" />
            <span className="text-sm">Photo</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handlePickMedia(e, "image")} 
              className="hidden" 
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
            <Video className="w-5 h-5" />
            <span className="text-sm">Video</span>
            <input 
              type="file" 
              accept="video/*" 
              onChange={(e) => handlePickMedia(e, "video")} 
              className="hidden" 
            />
          </label>
        </div>
        <button
          onClick={handlePostSubmit}
          disabled={isSubmitting || (!text.trim() && !selectedMedia)}
          className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

// -------- FeedPage --------
const FeedPage = ({ posts, setPosts, onViewMedia, search, onPostCreated }) => {
  const { user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts();
        console.log("Fetched posts data:", data);
        
        // Ensure posts is always an array and enhance with user data if needed
        if (Array.isArray(data)) {
          const enhancedPosts = data.map(post => {
            // If the post doesn't have proper author data but we have the current user info,
            // enhance the post data with current user's profile picture
            if ((!post.author || !post.author.profilePic) && user && post.author === user.id) {
              return {
                ...post,
                author: {
                  _id: user.id,
                  fullName: user.fullName,
                  profilePic: user.profilePic
                },
                authorPic: user.profilePic
              };
            }
            return post;
          });
          setPosts(enhancedPosts);
        } else {
          console.warn("Expected array but got:", typeof data, data);
          setPosts([]);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setPosts([]);
      }
    };
    fetchPosts();
  }, [setPosts, user]); // Added user dependency

  // Ensure posts is always treated as an array
  const safePosts = Array.isArray(posts) ? posts : [];
  
  const filtered = safePosts.filter((p) => {
    if (!search) return true;
    
    const searchTerm = search.toLowerCase();
    return (
      p.author?.fullName?.toLowerCase().includes(searchTerm) ||
      (p.text && p.text.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <div className="max-w-2xl mx-auto mt-28 px-4">
      <PostCreator 
        user={user} 
        posts={safePosts} 
        setPosts={setPosts} 
        onPostCreated={onPostCreated}
      />
      
      <div className="mt-6">
        {!Array.isArray(posts) ? (
          <div className="text-center text-red-500 border bg-white p-6 rounded-lg">
            Error: Posts data is invalid
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 border bg-white p-6 rounded-lg">
            {safePosts.length === 0 ? "No posts available. Be the first to post!" : "No posts match your search."}
          </div>
        ) : (
          filtered.map((p) => (
            <PostCard
              key={p._id}
              post={p}
              user={user}
              onViewMedia={onViewMedia}
              onDelete={(id) => setPosts(safePosts.filter(post => post._id !== id))}
              onSaveEdit={(id, newText) => setPosts(safePosts.map(post => 
                post._id === id ? { ...post, text: newText } : post
              ))}
            />
          ))
        )}
      </div>
    </div>
  );
};

// -------- MediaModal --------
const MediaModal = ({ media, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!media) return null;
  
  const isImage = media.type === "image";
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" 
      onClick={(e) => { 
        if (e.target === e.currentTarget) onClose(); 
      }}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white hover:text-red-400 bg-black bg-opacity-50 rounded-full p-2 z-10 transition-colors"
      >
        <X size={24} />
      </button>
      
      <div className="relative max-w-full max-h-full">
        {isImage ? (
          <img 
            src={media.url} 
            alt="preview" 
            className="max-w-full max-h-full rounded-lg object-contain"
            onError={(e) => {
              console.error("Failed to load media:", media.url);
              e.target.alt = "Failed to load image";
            }}
          />
        ) : (
          <video 
            src={media.url} 
            controls 
            autoPlay 
            className="max-w-full max-h-full rounded-lg"
            onError={(e) => {
              console.error("Failed to load media:", media.url);
            }}
          />
        )}
      </div>
    </div>
  );
};

// -------- ProfilePage --------
const ProfilePage = ({ posts, setPosts, onViewMedia, onPostCreated }) => {
  const { user, updateUser, updateBio, updatePoliticalSign, updateSignName } = useAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || "");
  const [uploading, setUploading] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);
  
  // File input refs
  const profileFileInputRef = useRef(null);
  const signFileInputRef = useRef(null);
  
  // Initialize refs when user data changes
  useEffect(() => {
    if (user?.bio) {
      setBioText(user.bio);
    }
  }, [user]);

  // Ensure posts is always treated as an array
  const safePosts = Array.isArray(posts) ? posts : [];

  // Filter posts to show only the current user's posts
  const userPosts = safePosts.filter((p) => {
    return p.author?._id === user?.id || 
           p.authorId === user?.id || 
           p.author === user?.id;
  });

  const saveBio = async () => {
    if (!bioText.trim()) {
      alert("Bio cannot be empty");
      return;
    }
    
    try {
      await updateBio(bioText);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
      alert("Failed to update bio. Please try again.");
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;

    // Reset file input
    if (profileFileInputRef.current) {
      profileFileInputRef.current.value = '';
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

  const handlePoliticalSignChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploadingSign) return;

    // Reset file input
    if (signFileInputRef.current) {
      signFileInputRef.current.value = '';
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

    setUploadingSign(true);
    
    try {
      // Convert to base64 for storage (since we don't have a specific political sign upload endpoint)
      const base64 = await fileToBase64(file);
      await updatePoliticalSign(base64);
      alert("Political sign updated successfully!");
    } catch (error) {
      console.error("Error uploading political sign:", error);
      alert("Failed to upload political sign. Please try another one.");
    } finally {
      setUploadingSign(false);
    }
  };

  const handleRemovePoliticalSign = async () => {
    if (window.confirm("Are you sure you want to remove your political sign?")) {
      try {
        await updatePoliticalSign(null);
        alert("Political sign removed successfully!");
      } catch (error) {
        console.error("Error removing political sign:", error);
        alert("Failed to remove political sign");
      }
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      await deletePost(id);
      setPosts(safePosts.filter(p => p._id !== id));
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleSaveEdit = async (id, newText) => {
    try {
      await updatePost(id, { text: newText });
      setPosts(safePosts.map(p => p._id === id ? { ...p, text: newText } : p));
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("Failed to update post. Please try again.");
    }
  };

  if (!user) {
    return <div className="max-w-2xl mx-auto mt-28 px-4">Loading user data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-28 px-4 space-y-6">
      {/* Profile Info */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col items-center relative">
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
                onClick={() => onViewMedia(user.profilePic, "image")}
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-gray-400 text-4xl font-bold">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </span>
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
              ref={profileFileInputRef}
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

        <h2 className="mt-4 text-2xl font-semibold text-gray-800">{user.fullName}</h2>
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
                <span className="text-xs text-gray-500 ">{bioText.length}/500</span>
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
              <p className={`text-gray-700 ${!user.bio ? "text-gray-400 italic ml-40" : ""}`}>
                {user.bio || "No bio added yet"}
              </p>
              <button 
                onClick={() => setIsEditingBio(true)} 
                className="mt-2 text-sm text-blue-600 ml-50 hover:text-blue-800 underline transition"
              >
                {user.bio ? "Edit Bio" : "Add Bio"}
              </button>
            </>
          )}
        </div>

        {/* Political Sign Section */}
        <div className="mt-8 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">Political Sign</h3>
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100 relative">
              {uploadingSign && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-800"></div>
                </div>
              )}
              
              {user.politicalSign ? (
                <img 
                  src={user.politicalSign} 
                  alt="Political Sign" 
                  className="w-full h-full object-cover"
                  onClick={() => onViewMedia(user.politicalSign, "image")}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm text-center px-2">No Sign</span>
                </div>
              )}
            </div>

            <label className={`absolute bottom-1 right-1 p-2 rounded-full cursor-pointer shadow-md transition ${
              uploadingSign 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}>
              {uploadingSign ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
              <input 
                ref={signFileInputRef}
                type="file" 
                accept="image/jpeg,image/jpg,image/png,image/webp" 
                onChange={handlePoliticalSignChange} 
                disabled={uploadingSign}
                className="hidden" 
              />
            </label>

            {user.politicalSign && !uploadingSign && (
              <button
                onClick={handleRemovePoliticalSign}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                title="Remove political sign"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Enter Sign Name"
            value={user.signName || ""}
            onChange={(e) => updateSignName(e.target.value)}
            className="mt-3 w-40 text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {uploadingSign && (
            <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              Uploading...
            </div>
          )}
        </div>
      </div>

      {/* Create Post - This will appear in both feed and profile */}
      <PostCreator 
        user={user} 
        posts={safePosts} 
        setPosts={setPosts} 
        onPostCreated={onPostCreated}
      />

      {/* User Posts - Only shows posts created by this user */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Your Posts ({userPosts.length})</h3>
        {userPosts.length === 0 ? (
          <div className="text-gray-500 p-4 border rounded bg-white text-center">
            You haven't created any posts yet. Share your thoughts with the community!
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              user={user}
              onViewMedia={onViewMedia}
              onDelete={handleDelete}
              onSaveEdit={handleSaveEdit}
            />
          ))
        )}
      </div>
    </div>
  );
};

// -------- Main CandidateDashboard Component --------
const CandidateDashboard = () => {
  const [page, setPage] = useState("feed");
  const [search, setSearch] = useState("");
  const [media, setMedia] = useState(null);
  const [posts, setPosts] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

  // Debug posts state
  useEffect(() => {
    console.log("Current posts state:", {
      type: typeof posts,
      isArray: Array.isArray(posts),
      value: posts
    });
  }, [posts]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification({ show: false, message: "", type: "success" });
  };

  const onViewMedia = (url, type) => {
    // Only allow viewing of non-blob URLs
    if (url && type && !url.startsWith('blob:')) {
      setMedia({ url, type });
    }
  };
  
  const onCloseMedia = () => setMedia(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar setPage={setPage} search={search} setSearch={setSearch} />
      
      {notification.show && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      
      {page === "feed" && (
        <FeedPage 
          posts={posts} 
          setPosts={setPosts} 
          onViewMedia={onViewMedia} 
          search={search}
          onPostCreated={showNotification}
        />
      )}
      {page === "profile" && (
        <ProfilePage 
          posts={posts} 
          setPosts={setPosts} 
          onViewMedia={onViewMedia}
          onPostCreated={showNotification}
        />
      )}
      <MediaModal media={media} onClose={onCloseMedia} />
    </div>
  );
};

export default CandidateDashboard;