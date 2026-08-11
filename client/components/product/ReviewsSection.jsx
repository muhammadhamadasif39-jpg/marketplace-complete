"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import StarRating from "@/components/ui/StarRating";

export default function ReviewsSection({ productId, initialReviews = [], initialRating, onUpdated }) {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(initialRating || { average: 0, count: 0 });
  const [formRating, setFormRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const myReview = user ? reviews.find((r) => r.user?._id === user._id) : null;

  const startEdit = () => {
    setFormRating(myReview.rating);
    setComment(myReview.comment || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formRating === 0) {
      showToast("Please select a star rating", "error");
      return;
    }
    setSubmitting(true);
    try {
      const updatedProduct = myReview
        ? await api.updateReview(productId, { rating: formRating, comment }, token)
        : await api.addReview(productId, { rating: formRating, comment }, token);

      setReviews(updatedProduct.reviews);
      setRating(updatedProduct.rating);
      setFormRating(0);
      setComment("");
      showToast(myReview ? "Review updated ✅" : "Review submitted ✅", "success");
      onUpdated?.(updatedProduct);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete your review?")) return;
    try {
      const data = await api.deleteReview(productId, token);
      setReviews(data.product.reviews);
      setRating(data.product.rating);
      showToast("Review deleted", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display text-xl font-bold">Reviews</h2>
        {rating.count > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <StarRating value={Math.round(rating.average)} readOnly size="text-sm" />
            {rating.average.toFixed(1)} ({rating.count} review{rating.count !== 1 ? "s" : ""})
          </span>
        )}
      </div>

      {/* Write / edit review form */}
      {user ? (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-6 max-w-lg">
          <p className="text-sm font-medium mb-2">{myReview ? "Edit your review" : "Write a review"}</p>
          <StarRating value={formRating} onChange={setFormRating} size="text-2xl" />
          <textarea
            placeholder="Share your thoughts about this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm mt-3"
          />
          <div className="flex gap-3 mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : myReview ? "Update Review" : "Submit Review"}
            </button>
            {myReview && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-500 text-sm hover:underline"
              >
                Delete my review
              </button>
            )}
            {myReview && formRating === 0 && (
              <button type="button" onClick={startEdit} className="text-brand-accent text-sm hover:underline">
                Load my current review
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-6">
          <a href="/login" className="text-brand-accent underline">
            Log in
          </a>{" "}
          to write a review. (You need to have ordered this product first.)
        </p>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="border-b pb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{r.user?.name || "Anonymous"}</p>
                <StarRating value={r.rating} readOnly size="text-sm" />
              </div>
              {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              {r.createdAt && (
                <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
