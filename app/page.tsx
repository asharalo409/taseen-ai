
"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Link2,
  Settings,
  ShieldCheck,
  Activity,
  Send,
  Sparkles,
  Github,
  Globe,
  Menu
} from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState("বাংলা");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "স্বাগতম! আমি TASEEN AI। তোমার Personal AI Agent Dashboard প্রস্তুত।"
    }
  ]);
  const [active, setActive] = useState("Dashboard");

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "AI Assistant", icon: Bot },
    { name: "Messages", icon: MessageSquare },
    { name: "Connections", icon: Link2 },
    { name: "Activity", icon: Activity },
    { name: "Approvals", icon: ShieldCheck },
    { name: "Settings", icon: Settings }
  ];

  function sendMessage() {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      { role: "user", text: message.trim() },
      {
        role: "ai",
        text: "আমি তোমার বার্তা পেয়েছি। AI API সংযুক্ত হলে আমি বুদ্ধিমান উত্তর দিতে পারব।"
      }
    ]);
    setMessage("");
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="logo">TASEEN<span> AI</span></div>

        <div>
          <div className="side-label">MAIN MENU</div>
          <nav className="nav">
            {menu.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  className={active === item.name ? "active" : ""}
                  onClick={() => setActive(item.name)}
                >
                  <Icon size={17} style={{ verticalAlign: "middle", marginRight: 9 }} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="profile">
          <strong>Personal Agent</strong>
          <br />
          <small>Approval required for important actions</small>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <h1>{active}</h1>
            <p className="muted">Your Personal AI Agent</p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: "#101522",
                color: "white",
                padding: 10,
                borderRadius: 9,
                border: "1px solid #30384a"
              }}
            >
              <option>বাংলা</option>
              <option>English</option>
              <option>العربية</option>
            </select>
            <span className="status">● SYSTEM READY</span>
          </div>
        </header>

        {active === "Dashboard" && (
          <>
            <div className="hero">
              <div className="neon">PERSONAL AI INTELLIGENCE</div>
              <h2>Welcome to <span className="neon">TASEEN AI</span></h2>
              <p>
                তোমার নিজস্ব AI Agent। এক জায়গা থেকে কাজ, সংযোগ,
                বার্তা এবং গুরুত্বপূর্ণ কাজের অনুমোদন পরিচালনা করো।
              </p>
              <button className="action" onClick={() => setActive("AI Assistant")}>
                <Sparkles size={15} style={{ verticalAlign: "middle" }} /> Open AI Assistant
              </button>
            </div>

            <div className="grid">
              <div className="panel">
                <h3>AI AGENT</h3>
                <div className="metric neon">READY</div>
                <p className="muted">Dashboard active</p>
              </div>
              <div className="panel">
                <h3>CONNECTED APPS</h3>
                <div className="metric">0</div>
                <p className="muted">No accounts connected</p>
              </div>
              <div className="panel">
                <h3>PENDING APPROVALS</h3>
                <div className="metric">0</div>
                <p className="muted">Awaiting your approval</p>
              </div>
              <div className="panel">
                <h3>AUTOMATION</h3>
                <div className="metric">OFF</div>
                <p className="muted">Not configured yet</p>
              </div>
            </div>

            <div className="content-grid">
              <div className="panel">
                <h3><Activity size={16} style={{ verticalAlign: "middle" }} /> SYSTEM ACTIVITY</h3>
                <p>● Dashboard initialized</p>
                <p>● User approval mode enabled</p>
                <p>● External integrations not connected</p>
                <p className="muted">Real activity will appear here after setup.</p>
              </div>

              <div className="panel">
                <h3><Link2 size={16} style={{ verticalAlign: "middle" }} /> CONNECT YOUR APPS</h3>
                <p className="muted">Connect services after secure authorization setup.</p>
                <p><Github size={16} style={{ verticalAlign: "middle" }} /> GitHub — Not connected</p>
                <p><Globe size={16} style={{ verticalAlign: "middle" }} /> Other apps — Not connected</p>
                <button className="action" onClick={() => setActive("Connections")}>
                  Manage connections
                </button>
              </div>
            </div>
          </>
        )}

        {active === "AI Assistant" && (
          <div className="panel">
            <h2><Bot className="neon" /> AI Assistant</h2>
            <p className="muted">Demo chat interface — AI API এখনো সংযুক্ত নয়।</p>
            <div style={{ minHeight: 250, margin: "25px 0" }}>
              {messages.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: 13,
                    margin: "10px 0",
                    borderRadius: 10,
                    background: item.role === "user" ? "#17243a" : "#101d2a",
                    border: "1px solid #263448"
                  }}
                >
                  <strong className="neon">{item.role === "user" ? "YOU" : "TASEEN AI"}</strong>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Write your message..."
              />
              <button className="action" onClick={sendMessage}>
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {active === "Connections" && (
          <div className="panel">
            <h2>App Connections</h2>
            <p className="muted">নিরাপদ OAuth সংযোগ পরবর্তী ধাপে তৈরি হবে।</p>
            {["GitHub", "WhatsApp", "Facebook", "Messenger", "YouTube"].map((name) => (
              <div key={name} style={{ padding: 15, borderBottom: "1px solid #30384a" }}>
                <strong>{name}</strong>
                <span style={{ float: "right", color: "#e8b45c" }}>Not connected</span>
              </div>
            ))}
          </div>
        )}

        {active === "Approvals" && (
          <div className="panel">
            <h2>Approval Center</h2>
            <p>গুরুত্বপূর্ণ কাজ করার আগে তোমার অনুমতি নেওয়া হবে।</p>
            <p className="muted">এখন কোনো pending approval নেই।</p>
          </div>
        )}

        {active === "Messages" && (
          <div className="panel">
            <h2>Messages</h2>
            <p className="muted">অ্যাকাউন্ট সংযুক্ত হলে বার্তা পরিচালনার সুবিধা এখানে আসবে।</p>
          </div>
        )}

        {active === "Activity" && (
          <div className="panel">
            <h2>Activity Log</h2>
            <p>Dashboard initialized successfully.</p>
            <p className="muted">External actions are not active.</p>
          </div>
        )}

        {active === "Settings" && (
          <div className="panel">
            <h2>Settings</h2>
            <p>Agent mode: Approval required</p>
            <p>Budget: Zero-cost setup target</p>
            <p>Languages: বাংলা / English / العربية</p>
            <p className="muted">API keys and account permissions will be configured securely on the server.</p>
          </div>
        )}

        <footer className="footer">
          TASEEN AI © 2026 · Your Personal AI Agent
        </footer>
      </section>
    </main>
  );
}
