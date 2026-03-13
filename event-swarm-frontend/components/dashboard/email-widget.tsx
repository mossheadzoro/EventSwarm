"use client";

import { useState } from "react";
import { Mail, RefreshCcw, Upload, Send } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function EmailWidget() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Upload CSV / Excel
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop();

    if (extension === "csv") {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const emails = results.data 
            .map((row: any) => row.email)
            .filter(Boolean);

          setRecipients(emails);
        },
      });
    }

    if (extension === "xlsx") {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      const emails = json.map((row) => row.email).filter(Boolean);

      setRecipients(emails);
    }
  };

  // Fake AI generation
  const generateEmail = async () => {
    setLoading(true);

    const res = await fetch("/api/demo-email");
    const data = await res.json();

    setSubject(data.subject);
    setBody(data.body);

    setLoading(false);
  };

  return (
    <div className="bg-[#0f171e] border border-[#1e293b] rounded-2xl p-6 mt-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-white font-semibold">
          <Mail className="w-5 h-5 mr-2 text-[#00e5ff]" />
          AI Email Composer
        </div>

        <button
          onClick={generateEmail}
          className="flex items-center gap-2 text-xs bg-[#00e5ff]/10 text-[#00e5ff] px-3 py-2 rounded-lg hover:bg-[#00e5ff]/20 transition"
        >
          <RefreshCcw className="w-3 h-3" />
          RECREATE
        </button>
      </div>

      {/* Upload */}
      <div>
        <p className="text-gray-400 text-xs mb-2 uppercase">
          Upload Recipients CSV / Excel
        </p>

        <label className="flex items-center gap-3 bg-[#020617] border border-[#1e293b] p-3 rounded-lg cursor-pointer hover:border-[#00e5ff] transition">
          <Upload className="w-4 h-4 text-[#00e5ff]" />
          <span className="text-gray-300 text-sm">
            Upload File
          </span>

          <input
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        <p className="text-xs text-gray-500 mt-2">
          {recipients.length} recipients loaded
        </p>
      </div>

      {/* Subject */}
      <div>
        <p className="text-gray-400 text-xs mb-2 uppercase">
          Email Title
        </p>

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="AI generated subject..."
          className="w-full bg-[#020617] border border-[#1e293b] text-white p-3 rounded-lg focus:border-[#00e5ff] outline-none"
        />
      </div>

      {/* Body */}
      <div>
        <p className="text-gray-400 text-xs mb-2 uppercase">
          Email Body
        </p>

        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="AI generated email..."
          className="w-full bg-[#020617] border border-[#1e293b] text-white p-3 rounded-lg focus:border-[#00e5ff] outline-none"
        />
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
        <div
          className={`h-full bg-[#00e5ff] transition-all ${
            loading ? "w-1/3 animate-pulse" : "w-3/4"
          }`}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">

        <span className="text-gray-500 text-xs">
          {loading
            ? "AI generating optimized campaign..."
            : "Campaign ready"}
        </span>

        <button className="flex items-center gap-2 bg-[#00e5ff] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Send className="w-4 h-4" />
          Send Test
        </button>

      </div>
    </div>
  );
}