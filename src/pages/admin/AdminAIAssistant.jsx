import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Page } from "../../ui";

export default function AdminAIAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;
    try {
      setLoading(true);
      const result = await api.studyAssistant(question);
      const answerText = typeof result === "string" ? result : result?.answer || result?.response || JSON.stringify(result);
      setAnswer(answerText);
      setHistory((prev) => [{ q: question, a: answerText }, ...prev]);
      setQuestion("");
    } catch (e) {
      setAnswer("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="🤖 AI Assistant" subtitle="Ask questions and get AI-powered answers.">
      <div className="admin-quick-links" style={{ marginBottom: 20 }}>
        <Link className="primary button-link" to="/admin">← Back to Dashboard</Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleAsk}>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question... e.g. What is polymorphism in Java?"
              style={{ flex: 1 }}
            />
            <button className="primary" type="submit" disabled={loading || !question.trim()}>
              {loading ? "Thinking..." : "Ask AI"}
            </button>
          </div>
        </form>
      </div>

      {answer && (
        <div className="card" style={{ marginBottom: 20, borderLeft: "3px solid #2563eb" }}>
          <h3 style={{ margin: "0 0 8px" }}>💡 Latest Answer</h3>
          <p style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{answer}</p>
        </div>
      )}

      {history.length > 1 && (
        <div className="card">
          <h3 style={{ margin: "0 0 12px" }}>History</h3>
          {history.slice(1).map((item, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: i < history.length - 2 ? "1px solid #e2e8f0" : "none" }}>
              <strong style={{ fontSize: 13, color: "#2563eb" }}>Q: {item.q}</strong>
              <p style={{ margin: "4px 0 0", fontSize: 13, whiteSpace: "pre-wrap" }}>{item.a}</p>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
