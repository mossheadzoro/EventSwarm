"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  RefreshCcw,
  Share2,
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";

export default function SocialWidget() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const generateCaption = async () => {
    setLoadingCaption(true);

    const res = await fetch("/api/demo-social-caption");
    const data = await res.json();

    setCaption(data.caption);
    setLoadingCaption(false);
  };

  const generateImage = async () => {
    setLoadingImage(true);

    const res = await fetch("/api/demo-social-image");
    const data = await res.json();

    setImage(data.image);
    setLoadingImage(false);
  };

  return (
    <div className="bg-[#0f171e] border border-[#1e293b] rounded-2xl p-6 mt-6 space-y-6">

      {/* Header */}
      <div className="flex items-center text-white font-semibold">
        <ImageIcon className="w-5 h-5 mr-2 text-[#00e5ff]" />
        AI Social Media Post
      </div>

      {/* Image Viewer */}
      <div className="relative bg-[#020617] border border-[#1e293b] rounded-xl overflow-hidden h-36 w-full flex items-center justify-center">

        {image ? (
          <img
            src={image}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-500 text-sm">
            AI generated image preview
          </span>
        )}

        <button
          onClick={generateImage}
          className="absolute bottom-3 right-3 flex items-center gap-2 text-xs bg-[#00e5ff]/10 text-[#00e5ff] px-3 py-2 rounded-lg hover:bg-[#00e5ff]/20"
        >
          <RefreshCcw className="w-3 h-3" />
          Recreate Image
        </button>
      </div>

      {/* Caption */}
      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">
          AI Tagline / Caption
        </p>

        <textarea
          rows={4}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="AI generated caption..."
          className="w-full bg-[#020617] border border-[#1e293b] text-white p-3 rounded-lg focus:border-[#00e5ff] outline-none"
        />

        <button
          onClick={generateCaption}
          className="mt-3 flex items-center gap-2 text-xs bg-[#00e5ff]/10 text-[#00e5ff] px-3 py-2 rounded-lg hover:bg-[#00e5ff]/20"
        >
          <RefreshCcw className="w-3 h-3" />
          Recreate Caption
        </button>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
        <div
          className={`h-full bg-[#00e5ff] transition-all ${
            loadingCaption || loadingImage
              ? "w-1/3 animate-pulse"
              : "w-3/4"
          }`}
        />
      </div>

      {/* Share Buttons */}
      <div className="flex justify-between items-center">

        <span className="text-gray-500 text-xs">
          Ready to publish
        </span>

        <div className="flex gap-3">

          <button className="flex items-center gap-2 bg-[#1877F2] text-white px-3 py-2 rounded-lg text-xs">
            <Facebook className="w-4 h-4" />
            Facebook
          </button>

          <button className="flex items-center gap-2 bg-linear-to-r from-pink-500 to-yellow-500 text-white px-3 py-2 rounded-lg text-xs">
            <Instagram className="w-4 h-4" />
            Instagram
          </button>

          <button className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg text-xs">
            <Twitter className="w-4 h-4" />
            X
          </button>

        </div>

      </div>

    </div>
  );
}