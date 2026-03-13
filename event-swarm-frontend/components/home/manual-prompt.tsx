"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ManualPrompt() {

  const [text, setText] = useState("");
  const router = useRouter();

  const submit = async () => {

    if (!text) return;

    await fetch("/api/voice/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        title: text
      })
    });

    router.push("/dashboard");

  };

  return (

    <div className="bg-[#0f171e]/80 border border-[#1e293b] rounded-2xl p-6 w-full max-w-lg">

      <textarea
        placeholder="Describe your event..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-transparent text-[#00e5ff] outline-none resize-none"
        rows={4}
      />

      <button
        onClick={submit}
        className="mt-4 px-5 py-2 bg-[#00e5ff] text-black rounded-lg hover:bg-[#00c8e0]"
      >
        Submit Prompt
      </button>

    </div>

  );

}