import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Send, Trash2, CornerDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function EventComments({ eventId, user }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // { id, user_name }
  const [otterUsername, setOtterUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
    if (user?.email) loadOtterUsername();

    const unsub = base44.entities.EventComment.subscribe((event) => {
      if (event.data?.event_id === eventId) {
        loadComments();
      }
    });
    return unsub;
  }, [eventId]);

  const loadOtterUsername = async () => {
    const records = await base44.entities.OtterUsername.filter({ user_email: user.email });
    if (records.length > 0) setOtterUsername(records[0].username);
  };

  const loadComments = async () => {
    const data = await base44.entities.EventComment.filter({ event_id: eventId }, "created_date", 100);
    setComments(data);
    setLoading(false);
  };

  const displayName = otterUsername || user?.full_name || user?.email;

  const handleSubmit = async () => {
    if (!text.trim() || !user?.email) return;
    setSubmitting(true);
    await base44.entities.EventComment.create({
      event_id: eventId,
      user_email: user.email,
      user_name: displayName,
      content: replyTo ? `@${replyTo.user_name} ${text.trim()}` : text.trim(),
      reply_to_id: replyTo?.id || null,
    });
    setText("");
    setReplyTo(null);
    setSubmitting(false);
    loadComments();
  };

  const handleDelete = async (id) => {
    await base44.entities.EventComment.delete(id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const canDelete = (comment) =>
    user?.email === comment.user_email ||
    user?.role === "admin" ||
    user?.role === "owner";

  // Top-level comments
  const topLevel = comments.filter(c => !c.reply_to_id);
  // Replies grouped by parent
  const replies = (parentId) => comments.filter(c => c.reply_to_id === parentId);

  if (loading) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-white/50 text-xs font-semibold">
        <MessageCircle size={13} />
        Comments ({comments.length})
      </div>

      {/* Comment input */}
      {user && (
        <div className="space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs">
              <span className="text-white/50">Replying to <span className="text-white/80">{replyTo.user_name}</span></span>
              <button onClick={() => setReplyTo(null)} className="text-white/30 hover:text-white ml-2">✕</button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
              placeholder={replyTo ? `Reply to ${replyTo.user_name}...` : "Ask a question or leave a comment..."}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/25"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-2">
        <AnimatePresence>
          {topLevel.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <CommentBubble
                comment={comment}
                user={user}
                canDelete={canDelete(comment)}
                onDelete={handleDelete}
                onReply={setReplyTo}
              />
              {/* Replies */}
              {replies(comment.id).map(reply => (
                <div key={reply.id} className="ml-4 flex gap-1.5">
                  <CornerDownRight size={12} className="text-white/20 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <CommentBubble
                      comment={reply}
                      user={user}
                      canDelete={canDelete(reply)}
                      onDelete={handleDelete}
                      onReply={null}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
        {topLevel.length === 0 && (
          <p className="text-white/20 text-xs text-center py-4">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}

function CommentBubble({ comment, user, canDelete, onDelete, onReply }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
            {(comment.user_name || "?").charAt(0).toUpperCase()}
          </div>
          <span className="text-white/70 text-xs font-semibold">{comment.user_name}</span>
          <span className="text-white/25 text-[10px]">
            {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onReply && user && (
            <button
              onClick={() => onReply({ id: comment.id, user_name: comment.user_name })}
              className="text-white/25 hover:text-blue-400 transition-colors text-[10px]"
            >
              Reply
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(comment.id)} className="text-white/20 hover:text-red-400 transition-colors">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
      <p className="text-white/80 text-xs leading-relaxed">{comment.content}</p>
    </div>
  );
}