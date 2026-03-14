// models/SocialMedia.ts
import mongoose from "mongoose";

const SocialMediaSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  platform: { type: String, required: true },
  tagline: { type: String, required: true },
  image_url: { type: String }, // Can be a placeholder string for now
  status: { type: String, default: "approved" },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.SocialMedia || mongoose.model("SocialMedia", SocialMediaSchema);