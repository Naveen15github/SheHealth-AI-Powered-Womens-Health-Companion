import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendChat } from '../services/apiService';
import Navbar from '../components/Navbar';
import ErrorMessage from '../components/ErrorMessage';
import './ChatPage.css';

const STORAGE_KEY = 'shehealth-chat-history';

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Markdown renderer ──────────────────────────────────────

function renderMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.match(/^[\*\-•]\s+/) || line.match(/^\d+\.\s+/)) {
      const listItems = [];
      while (i < lines.length && (lines[i].match(/^[\*\-•]\s+/) || lines[i].match(/^\d+\.\s+/))) {
        const itemText = lines[i].replace(/^[\*\-•]\s+/, '').replace(/^\d+\.\s+/, '');
        listItems.push(<li key={i}>{renderInline(itemText)}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="chat-list">{listItems}</ul>);
      continue;
    }
    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />);
    } else {
      elements.push(<p key={`p-${i}`} className="chat-para">{renderInline(line)}</p>);
    }
    i++;
  }
  return elements;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={idx}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={idx}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// ── Bubble components ──────────────────────────────────────

function UserBubble({ content }) {
  return <div className="chat-bubble-row--user"><div className="chat-bubble--user">{content}</div></div>;
}

function AssistantBubble({ content, isStreaming }) {
  return (
    <div className="chat-bubble-row--assistant">
      <div className="chat-bubble--assistant">
        {renderMarkdown(content)}
        {isStreaming && <span className="chat-cursor">▋</span>}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-typing">
      <div className="chat-typing__bubble">
        SheHealth AI Assistant is thinking
        <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────

function ChatSidebar({ history, activeId, onSelect, onNew, onClearAll, collapsed, onToggle }) {
  return (
    <>
      {/* Overlay for mobile */}
      {!collapsed && <div className="chat-sidebar-overlay" onClick={onToggle} aria-hidden="true" />}

      <aside className={`chat-sidebar${collapsed ? ' chat-sidebar--collapsed' : ''}`} aria-label="Conversation history">
        <div className="chat-sidebar__header">
          <span className="chat-sidebar__title">Conversations</span>
          <button className="chat-sidebar__close" onClick={onToggle} aria-label="Close sidebar">✕</button>
        </div>

        <button className="chat-sidebar__new-btn" onClick={onNew}>
          <span aria-hidden="true">＋</span> New Chat
        </button>

        <div className="chat-sidebar__list" role="list">
          {history.length === 0 && (
            <p className="chat-sidebar__empty">No conversations yet</p>
          )}
          {history.map((conv) => (
            <button
              key={conv.id}
              className={`chat-sidebar__item${conv.id === activeId ? ' chat-sidebar__item--active' : ''}`}
              onClick={() => onSelect(conv.id)}
              role="listitem"
            >
              <div className="chat-sidebar__item-title">{conv.title || 'New Chat'}</div>
              <div className="chat-sidebar__item-time">{formatTime(conv.timestamp)}</div>
            </button>
          ))}
        </div>

        <div className="chat-sidebar__footer">
          <button className="chat-sidebar__clear-btn" onClick={onClearAll}>
            🗑 Clear All History
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Main ChatPage ──────────────────────────────────────────

function ChatPage() {
  const navigate = useNavigate();

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [history, setHistory] = useState(loadHistory);
  const [activeConvId, setActiveConvId] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  const conversationId = useRef(crypto.randomUUID());
  const bottomRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const savedForConv = useRef(false); // track if current conv was saved

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isStreaming]);

  useEffect(() => {
    return () => { if (streamIntervalRef.current) clearInterval(streamIntervalRef.current); };
  }, []);

  // Persist messages to history whenever they change (after first user message)
  useEffect(() => {
    if (messages.length === 0) return;
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser) return;

    const title = firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? '…' : '');
    const convId = conversationId.current;

    setHistory(prev => {
      const existing = prev.find(c => c.id === convId);
      let updated;
      if (existing) {
        updated = prev.map(c => c.id === convId ? { ...c, messages, title, timestamp: Date.now() } : c);
      } else {
        updated = [{ id: convId, title, messages, timestamp: Date.now() }, ...prev];
      }
      saveHistory(updated);
      return updated;
    });
    setActiveConvId(convId);
  }, [messages]);

  function handleNew() {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    setMessages([]);
    setError('');
    setIsStreaming(false);
    conversationId.current = crypto.randomUUID();
    setActiveConvId(null);
    savedForConv.current = false;
    if (window.innerWidth < 768) setSidebarCollapsed(true);
  }

  function handleSelect(id) {
    const conv = history.find(c => c.id === id);
    if (!conv) return;
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    setMessages(conv.messages || []);
    setError('');
    setIsStreaming(false);
    conversationId.current = id;
    setActiveConvId(id);
    if (window.innerWidth < 768) setSidebarCollapsed(true);
  }

  function handleClearAll() {
    saveHistory([]);
    setHistory([]);
    handleNew();
  }

  function handleClear() {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    setMessages([]);
    setError('');
    setIsStreaming(false);
    conversationId.current = crypto.randomUUID();
    setActiveConvId(null);
  }

  function streamText(fullText, onComplete) {
    const tokens = fullText.match(/\S+|\s+/g) || [];
    let currentIndex = 0;
    let displayed = '';
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    streamIntervalRef.current = setInterval(() => {
      if (currentIndex >= tokens.length) {
        clearInterval(streamIntervalRef.current);
        setIsStreaming(false);
        onComplete();
        return;
      }
      const batch = Math.min(2, tokens.length - currentIndex);
      for (let b = 0; b < batch; b++) { displayed += tokens[currentIndex]; currentIndex++; }
      const finalText = displayed;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: finalText };
        return updated;
      });
    }, 20);
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || isLoading || isStreaming) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputText('');
    setError('');
    setIsLoading(true);
    try {
      const res = await sendChat(text, conversationId.current);
      const replyText = res?.data?.reply || 'I could not generate a response right now. Please try again.';
      setIsLoading(false);
      streamText(replyText, () => {});
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
        navigate('/login');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.');
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="chat-page">
      <ChatSidebar
        history={history}
        activeId={activeConvId}
        onSelect={handleSelect}
        onNew={handleNew}
        onClearAll={handleClearAll}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      <div className="chat-main">
        <Navbar />
        <div className="chat-disclaimer">
          SheHealth AI Assistant provides general health information only. Always consult a qualified doctor for medical advice.
        </div>
        <div className="chat-toolbar">
          <button
            className="chat-sidebar__toggle"
            onClick={() => setSidebarCollapsed(p => !p)}
            aria-label="Toggle conversation history"
          >
            ☰
          </button>
          <button className="btn-ghost btn-primary--sm" onClick={handleClear}>Clear Conversation</button>
        </div>

        <div className="chat-body">
          {messages.length === 0 && !isLoading ? (
            <div className="chat-empty">Hi! I'm your SheHealth AI Assistant 🌸 Speak with me about your health — in English, Tamil, or Tanglish!</div>
          ) : (
            messages.map((msg, i) =>
              msg.role === 'user'
                ? <UserBubble key={i} content={msg.content} />
                : <AssistantBubble key={i} content={msg.content} isStreaming={isStreaming && i === messages.length - 1} />
            )
          )}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {error && <div className="chat-error"><ErrorMessage message={error} /></div>}

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              className="chat-input"
              placeholder="Ask me about your health in English, Tamil, or Tanglish..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isStreaming}
              aria-label="Chat input"
              rows={1}
            />
            <div className="chat-input-footer">
              <span className="chat-input-hint">Press Enter to send · Shift+Enter for new line</span>
              <button
                className={`chat-send-btn ${inputText.trim() && !isLoading && !isStreaming ? 'chat-send-btn--active' : 'chat-send-btn--disabled'}`}
                onClick={handleSend}
                disabled={isLoading || isStreaming || !inputText.trim()}
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
