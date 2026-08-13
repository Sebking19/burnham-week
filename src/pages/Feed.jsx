import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, ImageIcon, X, Send, Trash2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { usePullToRefresh } from "@/components/PullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import PhotoOfTheWeek from "@/components/feed/PhotoOfTheWeek";
import Tilt3D from "@/components/Tilt3D";

const REACTION_EMOJIS = ["🔥", "⛵", "👏"];

const TRAINER_ROLES = ["pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"];
const CAN_SEE_TRAINER_CHAT = ["admin", "owner", "chairman", "viewer", ...TRAINER_ROLES];

const GROUP_MAP = {
  pond: "pond", pond_trainer: "pond", pond_parent: "pond",
  river1: "river1", river1_trainer: "river1", river1_parent: "river1",
  river2: "river2", river2_trainer: "river2", river2_parent: "river2",
  race: "race", race_trainer: "race", race_parent: "race",
  cadets: "cadets", cadet_trainer: "cadets", cadet_parent: "cadets",
  fast: "fast", fast_trainer: "fast", fast_parent: "fast",
};

const GROUP_LABELS = {
  pond: "Pond", river1: "River 1", river2: "River 2",
  race: "Race", cadets: "Cadets", fast: "Fast", all: "All",
};

const GROUP_DOTS = {
  pond: "bg-cyan-400", river1: "bg-green-400", river2: "bg-teal-400",
  race: "bg-red-400", cadets: "bg-orange-400", fast: "bg-purple-400",
  trainers: "bg-amber-400", all: "bg-white/70",
};

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [otterUsernames, setOtterUsernames] = useState({});
  const [avatars, setAvatars] = useState({});
  const fileRef = useRef();

  const handleRefreshCallback = async () => {
    await loadPosts(user);
  };

  const { pullY, refreshing, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(handleRefreshCallback);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      loadPosts(u);
      base44.entities.OtterUsername.list().then(records => {
        const map = {};
        const avatarMap = {};
        records.forEach(r => {
          if (r.user_email) {
            map[r.user_email] = r.username || "";
            if (r.avatar_emoji || r.avatar_color) avatarMap[r.user_email] = { emoji: r.avatar_emoji, color: r.avatar_color };
          }
        });
        setOtterUsernames(map);
        setAvatars(avatarMap);
      }).catch(() => {});
    }).catch(() => {});
  }, []);



  const loadPosts = async (u) => {
    const data = await base44.entities.Post.list("-created_date", 50);
    const userGroup = GROUP_MAP[u?.role];
    // Extra groups from roles array
    const extraGroups = (u?.roles || []).map(r => GROUP_MAP[r]).filter(Boolean);
    const allUserGroups = [...new Set([...(userGroup ? [userGroup] : []), ...extraGroups])];
    const canSeeTrainers = u && CAN_SEE_TRAINER_CHAT.includes(u.role);
    const filtered = data.filter(p => {
      if (u?.role === "admin" || u?.role === "owner" || u?.role === "viewer" || u?.role === "chairman") return true;
      if (p.group === "trainers") return canSeeTrainers;
      if (allUserGroups.length === 0) return p.group === "all";
      return p.group === "all" || allUserGroups.includes(p.group);
    });
    setPosts(filtered);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    setUploading(true);
    const userGroup = GROUP_MAP[user?.role] || "all";
    const postGroup = activeTab === "trainers" ? "trainers" : (adminFilter || userGroup);
    const tempPost = {
      id: "temp-" + Date.now(),
      content: content.trim(),
      image_url: imagePreview,
      author_name: otterUsernames[user?.email] || user?.full_name || "Teammate",
      likes: 0,
      liked_by: [],
      group: postGroup,
      created_date: new Date().toISOString(),
      created_by: user?.email,
    };
    setPosts(prev => [tempPost, ...prev]);
    const savedContent = content.trim();
    const savedImageFile = imageFile;
    setContent("");
    setImageFile(null);
    setImagePreview(null);

    let image_url = null;
    if (savedImageFile) {
      const res = await base44.integrations.Core.UploadFile({ file: savedImageFile });
      image_url = res.file_url;
    }
    const created = await base44.entities.Post.create({
      content: savedContent,
      image_url,
      author_name: otterUsernames[user?.email] || user?.full_name || "Teammate",
      likes: 0,
      liked_by: [],
      group: tempPost.group,
    });
    setPosts(prev => prev.map(p => p.id === tempPost.id ? created : p));
    setUploading(false);
  };

  const handleLike = async (post) => {
    if (!user) return;
    const likedBy = post.liked_by || [];
    const hasLiked = likedBy.includes(user.email);
    const newLikedBy = hasLiked ? likedBy.filter(e => e !== user.email) : [...likedBy, user.email];
    await base44.entities.Post.update(post.id, { liked_by: newLikedBy, likes: newLikedBy.length });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked_by: newLikedBy, likes: newLikedBy.length } : p));
  };

  const handleReact = async (post, emoji) => {
    if (!user) return;
    const reactions = { ...(post.reactions || {}) };
    const users = reactions[emoji] || [];
    reactions[emoji] = users.includes(user.email) ? users.filter(e => e !== user.email) : [...users, user.email];
    if (reactions[emoji].length === 0) delete reactions[emoji];
    await base44.entities.Post.update(post.id, { reactions });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, reactions } : p));
  };

  const handleDelete = async (id) => {
    await base44.entities.Post.delete(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isViewer = user?.role === "viewer";
  const isChairman = user?.role === "chairman";
  const userGroup = GROUP_MAP[user?.role];
  const extraGroups = (user?.roles || []).map(r => GROUP_MAP[r]).filter(Boolean);
  const allUserGroups = [...new Set([...(userGroup ? [userGroup] : []), ...extraGroups])];
  const isTrainer = user?.role && TRAINER_ROLES.includes(user.role);
  const canSeeTrainerChat = user && CAN_SEE_TRAINER_CHAT.includes(user.role);
  const [activeTab, setActiveTab] = useState("team");
  const [adminFilter, setAdminFilter] = useState(null); // null = all
  const [groupFilter, setGroupFilter] = useState(null); // for multi-group users

  const teamPosts = posts.filter(p => p.group !== "trainers");
  const trainerPosts = posts.filter(p => p.group === "trainers");

  const visiblePosts = activeTab === "trainers"
    ? trainerPosts
    : ((isAdmin || isViewer || isChairman) && adminFilter
      ? teamPosts.filter(p => p.group === adminFilter)
      : (groupFilter
        ? teamPosts.filter(p => p.group === groupFilter || p.group === "all")
        : teamPosts));

  return (
    <div
      className="py-2"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Team Feed</h1>
          <p className="text-cyan-200/40 text-sm mt-0.5">
            {isAdmin ? "All groups" : userGroup ? `${GROUP_LABELS[userGroup]} group` : "What's happening"}
          </p>
        </div>
        <button
           onClick={handleRefreshCallback}
           aria-label="Refresh feed"
           className="mt-1 w-9 h-9 flex items-center justify-center rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
         >
           <RefreshCw size={15} className={refreshing ? "animate-spin text-blue-400" : ""} />
         </button>
      </div>

      {/* Tabs */}
      {canSeeTrainerChat && (
        <div className="flex gap-1 mb-5 p-1.5 rounded-full bg-slate-900/70 border border-cyan-400/25 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
          <button
            onClick={() => setActiveTab("team")}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === "team" ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-lg shadow-cyan-500/40" : "text-white/60 hover:text-white"}`}
          >
            Team Feed
          </button>
          <button
            onClick={() => setActiveTab("trainers")}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === "trainers" ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-lg shadow-cyan-500/40" : "text-white/60 hover:text-white"}`}
          >
            Trainers
          </button>
        </div>
      )}

      {/* Multi-group filter for non-admin users with multiple groups */}
      {activeTab === "team" && !isAdmin && !isViewer && !isChairman && allUserGroups.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setGroupFilter(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${groupFilter === null ? "bg-white/15 text-white border-white/20" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"}`}
          >
            All
          </button>
          {allUserGroups.map(g => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${groupFilter === g ? "bg-white/15 text-white border-white/20" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"}`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${GROUP_DOTS[g]}`} />
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>
      )}

      {activeTab === "team" && (isAdmin || isViewer || isChairman) && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setAdminFilter(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              adminFilter === null ? "bg-white/15 text-white border-white/20" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {["pond", "river1", "river2", "race", "cadets", "fast"].map(g => (
            <button
              key={g}
              onClick={() => setAdminFilter(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                adminFilter === g ? "bg-white/15 text-white border-white/20" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${GROUP_DOTS[g]}`} />
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>
      )}

      {/* Compose - hide for viewer, and hide trainer compose on team tab if not trainer/admin */}
      {!isViewer && (activeTab === "trainers" ? canSeeTrainerChat && !isViewer : true) && (
      <div className="rounded-[28px] p-4 mb-6 bg-slate-900/60 border border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
        <textarea
          className="w-full bg-transparent text-white placeholder-white/25 text-sm resize-none focus:outline-none leading-relaxed"
          placeholder={activeTab === "trainers" ? "Message trainers..." : userGroup ? `Share something with your ${GROUP_LABELS[userGroup]} group...` : "Share something with the team..."}
          rows={3}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.33, 0.66, 0.66, 1] }}
              className="relative mt-2 rounded-2xl overflow-hidden"
            >
              <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                aria-label="Remove image"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Attach an image"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5"
            style={{ transition: "color 0.4s cubic-bezier(0.33, 0.66, 0.66, 1)" }}
          >
            <ImageIcon size={18} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button
            onClick={handleSubmit}
            disabled={uploading || (!content.trim() && !imageFile)}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-cyan-500/40 disabled:opacity-30 hover:opacity-90"
            style={{ transition: "all 0.4s cubic-bezier(0.33, 0.66, 0.66, 1)" }}
          >
            {uploading ? (
              <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Post
          </button>
        </div>
      </div>
      )}

      {/* Photo of the Week */}
      {activeTab === "team" && <PhotoOfTheWeek posts={teamPosts} />}

      {/* Posts */}
      <div className="space-y-4">
        <AnimatePresence>
          {visiblePosts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.33, 0.66, 0.66, 1] }}
            >
            <Tilt3D max={4}>
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-200">
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={`Photo shared by ${post.author_name || "a teammate"}`}
                  className="w-full max-h-72 object-cover cursor-pointer"
                  title="Double-tap to like"
                  onDoubleClick={() => {
                    if (user && !(post.liked_by || []).includes(user.email)) handleLike(post);
                  }}
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className="w-7 h-7 rounded-full shadow-md shadow-cyan-500/30 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: avatars[post.created_by]?.color
                          ? `linear-gradient(135deg, ${avatars[post.created_by].color}, ${avatars[post.created_by].color}88)`
                          : "linear-gradient(135deg, #0ea5e9, #22d3ee)",
                      }}
                    >
                      {avatars[post.created_by]?.emoji || (post.author_name || "T").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white/70 text-sm font-medium">{post.author_name || "Teammate"}</span>
                    <span className="text-white/25 text-xs">
                      {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                    </span>
                    {(isAdmin || isViewer || isChairman) && post.group && post.group !== "all" && (
                      <span className="flex items-center gap-1 text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full">
                        <span className={`w-1.5 h-1.5 rounded-full ${GROUP_DOTS[post.group] || "bg-white/60"}`} />
                        {GROUP_LABELS[post.group] || post.group}
                      </span>
                    )}
                  </div>
                  {(user?.email === post.created_by || isAdmin) && !isViewer && (
                    <button aria-label="Delete post" onClick={() => handleDelete(post.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {post.content && <p className="text-white/85 text-sm leading-relaxed">{post.content}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleLike(post)}
                    aria-label={user && (post.liked_by || []).includes(user.email) ? "Unlike post" : "Like post"}
                    aria-pressed={user ? (post.liked_by || []).includes(user.email) : false}
                    className={`flex items-center gap-1.5 min-h-[36px] px-1 text-xs font-medium transition-all ${
                      user && (post.liked_by || []).includes(user.email)
                        ? "text-red-400"
                        : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    <Heart
                      size={15}
                      fill={user && (post.liked_by || []).includes(user.email) ? "currentColor" : "none"}
                    />
                    {post.likes > 0 && <span>{post.likes}</span>}
                  </button>
                  {REACTION_EMOJIS.map(emoji => {
                    const reactedUsers = (post.reactions || {})[emoji] || [];
                    const mine = user && reactedUsers.includes(user.email);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReact(post, emoji)}
                        aria-label={`React with ${emoji}`}
                        aria-pressed={mine}
                        className={`flex items-center gap-1 min-h-[36px] px-2 rounded-full text-sm transition-all border ${
                          mine ? "bg-cyan-500/15 border-cyan-400/40" : "border-transparent hover:bg-white/5 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <span>{emoji}</span>
                        {reactedUsers.length > 0 && <span className="text-xs text-white/50 font-medium">{reactedUsers.length}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            </Tilt3D>
            </motion.div>
          ))}
        </AnimatePresence>
        {visiblePosts.length === 0 && (
          <p className="text-center text-white/20 text-sm py-12">No posts yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}