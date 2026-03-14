// models/SocialPost.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISocialPost extends Document {
  jobId: string;
  caption: string;
  image_url?: string;
  platform: string;
  status: "draft" | "published" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema: Schema = new Schema(
  {
    jobId: { 
      type: String, 
      required: true,
      index: true // Useful for querying posts by specific jobs later
    },
    caption: { 
      type: String, 
      required: true 
    },
    image_url: { 
      type: String, 
      default: null 
    },
    platform: { 
      type: String, 
      required: true,
      enum: ["Twitter", "Instagram", "LinkedIn", "Facebook"] 
    },
    status: { 
      type: String, 
      required: true,
      enum: ["draft", "published", "failed"],
      default: "draft"
    }
  },
  { timestamps: true }
);

// Prevent mongoose from compiling the model multiple times in Next.js development
export default mongoose.models.SocialPost || mongoose.model<ISocialPost>("SocialPost", SocialPostSchema);