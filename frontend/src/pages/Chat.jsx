import { useState } from "react";
import axios from "axios";

export default function Chat() {
  const storedData = JSON.parse(localStorage.getItem("devlensData"));
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message) return;

    const res = await axios.post(
      `http://127.0.0.1:8000/chat/${storedData.github_username}/${storedData.leetcode_username}`,
      { message }
    );

    setChat([...chat, { user: message, bot: res.data.reply }]);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-10">
      <h1 className="text-2xl mb-6">AI Assistant</h1>

      <div className="bg-gray-900 p-6 rounded-xl h-[500px] overflow-y-auto mb-6">
        {chat.map((c, i) => (
          <div key={i} className="mb-4">
            <div className="text-indigo-400">You:</div>
            <div>{c.user}</div>
            <div className="text-green-400 mt-2">AI:</div>
            <div>{c.bot}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-3 bg-gray-900 border border-gray-800 rounded-lg"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 px-6 py-3 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
