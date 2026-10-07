import React, { useState } from "react";
import InstructorPage from "./InstructorPage";

const SAMPLE_THREADS = [
  { id: 1, title: "Java Collections Framework", student: "Rahul Sharma", course: "Java Programming", lastMessage: "Can you explain HashMap vs TreeMap?", time: "2 hours ago", replies: 5, unread: 2 },
  { id: 2, title: "React State Management", student: "Priya Patel", course: "Web Development", lastMessage: "Is Redux still relevant in 2026?", time: "5 hours ago", replies: 3, unread: 0 },
  { id: 3, title: "SQL Query Optimization", student: "Amit Kumar", course: "Database Systems", lastMessage: "My JOIN query is very slow", time: "1 day ago", replies: 8, unread: 1 },
  { id: 4, title: "Sorting Algorithms Doubt", student: "Sneha Reddy", course: "Data Structures", lastMessage: "Why is QuickSort preferred over MergeSort?", time: "2 days ago", replies: 4, unread: 0 },
];

const SAMPLE_MESSAGES = [
  { id: 1, sender: "student", name: "Rahul Sharma", text: "Can you explain HashMap vs TreeMap?", time: "2:30 PM" },
  { id: 2, sender: "teacher", name: "You", text: "Sure! HashMap uses a hash table for O(1) access, while TreeMap uses a Red-Black tree for O(log n) access but keeps keys sorted.", time: "2:35 PM" },
  { id: 3, sender: "student", name: "Rahul Sharma", text: "So when should I use TreeMap?", time: "2:38 PM" },
  { id: 4, sender: "teacher", name: "You", text: "Use TreeMap when you need keys in sorted order, like for range queries. For general-purpose key-value storage, HashMap is usually better.", time: "2:42 PM" },
];

export default function InstructorDiscussions() {
  const [threads] = useState(SAMPLE_THREADS);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages] = useState(SAMPLE_MESSAGES);
  const [reply, setReply] = useState("");

  return (
    <InstructorPage icon="💬" title="Messages & Discussions" subtitle="Communicate with students and answer their questions">
      <div className="inst-content">
        <div className="inst-discussions-layout">
          {/* Thread List */}
          <div className="inst-thread-list">
            <div className="inst-thread-search">
              <input type="text" placeholder="Search discussions..." className="inst-input" />
            </div>
            {threads.map((t) => (
              <div
                key={t.id}
                className={`inst-thread-item ${selectedThread?.id === t.id ? "active" : ""}`}
                onClick={() => setSelectedThread(t)}
              >
                <div className="inst-thread-info">
                  <strong>{t.title}</strong>
                  <small>{t.student} • {t.course}</small>
                  <p>{t.lastMessage}</p>
                </div>
                <div className="inst-thread-meta">
                  <span className="inst-thread-time">{t.time}</span>
                  {t.unread > 0 && <span className="inst-unread-badge">{t.unread}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Message View */}
          <div className="inst-message-view">
            {selectedThread ? (
              <>
                <div className="inst-message-header">
                  <div>
                    <strong>{selectedThread.title}</strong>
                    <small>{selectedThread.student} • {selectedThread.course}</small>
                  </div>
                </div>
                <div className="inst-messages">
                  {messages.map((m) => (
                    <div key={m.id} className={`inst-message ${m.sender}`}>
                      <div className="inst-message-bubble">
                        <p>{m.text}</p>
                        <span className="inst-message-time">{m.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="inst-message-input">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="inst-input"
                  />
                  <button className="inst-btn inst-btn-primary">Send</button>
                </div>
              </>
            ) : (
              <div className="inst-empty">
                <div className="inst-empty-icon">💬</div>
                <h3>Select a Discussion</h3>
                <p>Choose a thread from the left to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </InstructorPage>
  );
}
