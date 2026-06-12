/**
 * StudentChat — floating support chat widget (bottom-right)
 * Uses existing Socket.IO connection via socketClient
 */

import React, { useState, useEffect, useRef } from 'react';
import { socket } from './infrastructure/socketClient';

export default function StudentChat({ studentId, username }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [unread, setUnread]   = useState(0);
  const bottomRef             = useRef(null);

  useEffect(() => {
    const handler = (msg) => {
      if (msg.to !== studentId && msg.from !== studentId) return;
      setMessages(prev => [...prev, msg]);
      if (!open && msg.from !== studentId) {
        setUnread(n => n + 1);
      }
    };
    socket.on('chat_message', handler);
    return () => socket.off('chat_message', handler);
  }, [studentId, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [open, messages]);

  function send() {
    if (!input.trim()) return;
    const msg = {
      from: studentId,
      fromName: username,
      to: 'proctor',
      text: input.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      role: 'student',
    };
    socket.emit('chat_message', msg);
    setMessages(prev => [...prev, msg]);
    setInput('');
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={S.fab}>
        {open ? '✕' : '💬'}
        {!open && unread > 0 && (
          <span style={S.badge}>{unread}</span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={S.window}>
          <div style={S.header}>
            <span>💬 Поддержка</span>
            <span style={{ fontSize: 11, color: '#64748B' }}>Проктор онлайн</span>
          </div>

          <div style={S.messages}>
            {messages.length === 0 && (
              <div style={S.empty}>Напишите вопрос — проктор ответит</div>
            )}
            {messages.map((m, i) => {
              const isMe = m.from === studentId;
              return (
                <div key={i} style={{ ...S.bubble, ...(isMe ? S.bubbleMe : S.bubbleThem) }}>
                  <div style={S.bubbleText}>{m.text}</div>
                  <div style={S.bubbleTime}>{m.time}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={S.inputRow}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Напишите сообщение..."
              style={S.input}
              autoFocus
            />
            <button onClick={send} style={S.sendBtn}>→</button>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  fab: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 9000,
    width: 52, height: 52, borderRadius: '50%',
    background: '#2563EB', border: 'none', color: '#fff',
    fontSize: 22, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    background: '#EF4444', color: '#fff',
    borderRadius: '50%', width: 18, height: 18,
    fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  window: {
    position: 'fixed', bottom: 88, right: 24, zIndex: 8999,
    width: 320, height: 420,
    background: '#1E293B', border: '1px solid #334155',
    borderRadius: 14, display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    fontFamily: "'IBM Plex Sans', sans-serif",
    overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderBottom: '1px solid #334155',
    fontSize: 14, fontWeight: 600, color: '#F1F5F9',
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '12px 12px 4px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  empty: { color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 40 },
  bubble: {
    maxWidth: '80%', padding: '8px 12px', borderRadius: 10,
    fontSize: 13, lineHeight: 1.5,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    background: '#2563EB', color: '#fff',
    borderBottomRightRadius: 3,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    background: '#0F172A', color: '#F1F5F9',
    border: '1px solid #334155',
    borderBottomLeftRadius: 3,
  },
  bubbleText: { wordBreak: 'break-word' },
  bubbleTime: { fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' },
  inputRow: {
    display: 'flex', gap: 8, padding: '10px 12px',
    borderTop: '1px solid #334155',
  },
  input: {
    flex: 1, background: '#0F172A', border: '1px solid #334155',
    borderRadius: 8, color: '#F1F5F9', fontSize: 13,
    padding: '8px 10px', outline: 'none',
  },
  sendBtn: {
    background: '#2563EB', border: 'none', borderRadius: 8,
    color: '#fff', fontSize: 16, padding: '0 14px', cursor: 'pointer',
  },
};