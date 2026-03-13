
// "use client";

// import React, { useRef, useState } from "react";
// import { motion } from "framer-motion";
// import { Mic, Check } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { generateTitle } from "@/lib/model/generateTitle";

// export function VoiceCommand() {
//   const router = useRouter();

//   const mediaRecorder = useRef<MediaRecorder | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const chunks = useRef<Blob[]>([]);

//   const [recording, setRecording] = useState(false);
//   const [text, setText] = useState("");
//   const [editableText, setEditableText] = useState("");
//   const [loading, setLoading] = useState(false);

//   const startRecording = async () => {
//     try {
//       chunks.current = [];

//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;

//       const recorder = new MediaRecorder(stream);

//       recorder.ondataavailable = (e) => {
//         if (e.data.size > 0) {
//           chunks.current.push(e.data);
//         }
//       };

//       recorder.onstop = async () => {
//         try {
//           setLoading(true);

//           const blob = new Blob(chunks.current, { type: "audio/webm" });

//           const res = await fetch("/api/transcribe", {
//             method: "POST",
//             body: blob,
//           });

//           const data = await res.json();

//           setText(data.text || "No speech detected");
//           setEditableText(data.text || "");

//         } catch (err) {
//           console.error(err);
//           setText("Error processing voice");
//         } finally {
//           setLoading(false);
//         }

//         chunks.current = [];
//         streamRef.current?.getTracks().forEach((track) => track.stop());
//       };

//       recorder.start();
//       mediaRecorder.current = recorder;
//       setRecording(true);

//     } catch (err) {
//       console.error(err);
//       alert("Microphone access denied");
//     }
//   };

//   const stopRecording = () => {
//     mediaRecorder.current?.stop();
//     setRecording(false);
//   };



//   const confirmCommand = async () => {
//       const title = generateTitle(editableText)
//     const res = await fetch("/api/voice/save", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({title: title, text: editableText }),
//     });

//     if (res.ok) {
//       router.push("/dashboard");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center my-12 w-full">

//       {/* MIC BUTTON */}
//       <motion.div
//         animate={{
//           scale: recording ? [1, 1.15, 1] : 1,
//         }}
//         transition={{
//           duration: 1,
//           repeat: recording ? Infinity : 0,
//         }}
//         onClick={recording ? stopRecording : startRecording}
//         className="w-32 h-32 rounded-full bg-[#00e5ff]/10 flex items-center justify-center mb-8 cursor-pointer"
//       >
//         <div className="w-24 h-24 rounded-full bg-[#00e5ff] flex items-center justify-center shadow-[0_0_40px_rgba(0,229,255,0.6)]">
//           <Mic className={`w-10 h-12 rounded-full bg-[#00e5ff] flex items-center justify-center
// ${recording ? "shadow-[0_0_60px_rgba(0,229,255,0.9)]" : "shadow-[0_0_40px_rgba(0,229,255,0.4)]"}`} />
//         </div>
//       </motion.div>

//       {/* SOUND BARS */}
//       <div className="flex space-x-1.5 items-center mb-10 h-10">
//         {[16, 28, 40, 32, 20].map((h, i) => (
//           <motion.div
//             key={i}
//             animate={{
//               height: recording ? [6, h, 6] : 6,
//             }}
//             transition={{
//               duration: 0.8,
//               repeat: recording ? Infinity : 0,
//               delay: i * 0.15,
//             }}
//             className="w-1.5 bg-[#00e5ff] rounded-full"
//           />
//         ))}
//       </div>

//       {/* TRANSCRIPT BOX */}
//       <div className="bg-[#0f171e]/80 border border-[#1e293b] rounded-2xl p-6 w-full max-w-lg shadow-xl backdrop-blur-sm">

//         {loading ? (
//           <p className="text-gray-400 text-center">Processing voice...</p>
//         ) : editableText ? (
//           <>
//             <textarea
//               value={editableText}
//               onChange={(e) => setEditableText(e.target.value)}
//               className="w-full bg-transparent text-[#00e5ff] text-center outline-none resize-none"
//               rows={3}
//             />

//             <div className="flex justify-center mt-4">
//               <button
//                 onClick={confirmCommand}
//                 className="flex items-center px-5 py-2 rounded-lg bg-[#00e5ff] text-black hover:bg-[#00c8e0]"
//               >
//                 <Check className="w-4 h-4 mr-2" />
//                 Confirm Command
//               </button>
//             </div>
//           </>
//         ) : (
//           <>
//             <p className="text-gray-400 text-center text-sm mb-3">
//               Click mic and say
//             </p>

//             <p className="text-[#00e5ff] text-center text-base italic font-medium">
//               "Plan a hackathon announcement, schedule speakers, and send invitations."
//             </p>
//           </>
//         )}

//       </div>
//     </div>
//   );
// }



"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateTitle } from "@/lib/model/generateTitle";

export function VoiceCommand() {

  const router = useRouter();

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [editableText, setEditableText] = useState("");
  const [loading, setLoading] = useState(false);

  /* START RECORDING */

  const startRecording = async () => {
    try {

      chunks.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      recorder.onstop = async () => {

        try {

          setLoading(true);

          const blob = new Blob(chunks.current, { type: "audio/webm" });

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: blob
          });

          const data = await res.json();

          const transcript = data.text || "";

          setEditableText(transcript);

        } catch (err) {

          console.error(err);
          alert("Voice transcription failed");

        } finally {

          setLoading(false);

        }

        chunks.current = [];
        streamRef.current?.getTracks().forEach(track => track.stop());

      };

      recorder.start();

      mediaRecorder.current = recorder;

      setRecording(true);

    } catch (err) {

      console.error(err);
      alert("Microphone access denied");

    }
  };

  /* STOP RECORDING */

  const stopRecording = () => {

    mediaRecorder.current?.stop();
    setRecording(false);

  };

  /* CONFIRM COMMAND */

  const confirmCommand = async () => {

    if (!editableText.trim()) return;

    try {

      setLoading(true);

      const title = generateTitle(editableText);

      const res = await fetch("/api/voice/create", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          transcript: editableText,
          title
        })

      });

      if (!res.ok) throw new Error("Job creation failed");

      router.push("/dashboard");

    } catch (err) {

      console.error(err);
      alert("Failed to create event");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="flex flex-col items-center my-12 w-full">

      {/* MIC BUTTON */}

      <motion.div
        animate={{ scale: recording ? [1, 1.15, 1] : 1 }}
        transition={{ duration: 1, repeat: recording ? Infinity : 0 }}
        onClick={recording ? stopRecording : startRecording}
        className="w-32 h-32 rounded-full bg-[#00e5ff]/10 flex items-center justify-center mb-8 cursor-pointer"
      >

        <div className="w-24 h-24 rounded-full bg-[#00e5ff] flex items-center justify-center shadow-[0_0_40px_rgba(0,229,255,0.6)]">

          <Mic className={`w-10 h-10 text-black ${
            recording
              ? "drop-shadow-[0_0_20px_rgba(0,229,255,0.9)]"
              : "drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
          }`} />

        </div>

      </motion.div>

      {/* SOUND BARS */}

      <div className="flex space-x-1.5 items-center mb-10 h-10">

        {[16, 28, 40, 32, 20].map((h, i) => (

          <motion.div
            key={i}
            animate={{ height: recording ? [6, h, 6] : 6 }}
            transition={{ duration: 0.8, repeat: recording ? Infinity : 0, delay: i * 0.15 }}
            className="w-1.5 bg-[#00e5ff] rounded-full"
          />

        ))}

      </div>

      {/* TRANSCRIPT BOX */}

      <div className="bg-[#0f171e]/80 border border-[#1e293b] rounded-2xl p-6 w-full max-w-lg shadow-xl backdrop-blur-sm">

        {loading ? (

          <p className="text-gray-400 text-center">Processing voice...</p>

        ) : editableText ? (

          <>

            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="w-full bg-transparent text-[#00e5ff] text-center outline-none resize-none"
              rows={3}
            />

            <div className="flex justify-center mt-4">

              <button
                onClick={confirmCommand}
                className="flex items-center px-5 py-2 rounded-lg bg-[#00e5ff] text-black hover:bg-[#00c8e0]"
              >

                <Check className="w-4 h-4 mr-2" />

                Confirm Command

              </button>

            </div>

          </>

        ) : (

          <>

            <p className="text-gray-400 text-center text-sm mb-3">
              Click mic and say
            </p>

            <p className="text-[#00e5ff] text-center text-base italic font-medium">
              "Create a hackathon event called AI Hackathon on 27 March 2026"
            </p>

          </>

        )}

      </div>

    </div>

  );

}