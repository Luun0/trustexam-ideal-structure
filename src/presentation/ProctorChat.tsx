import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '@shared/chat';
import { socket } from '../infrastructure/socketClient';

interface ChatState {
  name: string;
  messages: ChatMessage[];
}

interface ProctorChatProps {
  proctorName: string;
  onNewMessage?: () => void;
}

export default function ProctorChat({ proctorName, onNewMessage }: ProctorChatProps) {
  const [chats, setChats] = useState<Record<string, ChatState>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput]         = useState('');
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (msg: ChatMessage) => {
      if (msg.role !== 'student') return;
      const sid = msg.from;
      onNewMessage?.();
      setChats(prev => {
        const existing = prev[sid] || { name: msg.fromName || sid, messages: [] };
        return {
          ...prev,
          [sid]: { ...existing, messages: [...existing.messages, msg] },
        };
      });
      setUnreadMap(prev => {
        if (activeId === sid) return prev;
        return { ...prev, [sid]: (prev[sid] || 0) + 1 };
      });
    };
    socket.on('chat_message', handler);
    return () => { socket.off('chat_message', handler); };
  }, [activeId, onNewMessage]);

  useEffect(() => {
    if (activeId) {
      setUnreadMap(prev => ({ ...prev, [activeId]: 0 }));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [activeId, chats]);

  function send() {
    if (!input.trim() || !activeId) return;
    const msg: ChatMessage = {
      from: 'proctor',
      fromName: proctorName || 'Проктор',
      to: activeId,
      text: input.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      role: 'proctor',
    };
    socket.emit('chat_message', msg);
    setChats(prev => {
      const existing = prev[activeId] || { name: activeId, messages: [] };
      return {
        ...prev,
        [activeId]: { ...existing, messages: [...existing.messages, msg] },
      };
    });
    setInput('');
  }

  const studentList = Object.entries(chats);
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);
  const activeChat = activeId ? chats[activeId] : null;

  return (
    <div style={S.wrap}>
      {/* Left: student list */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          💬 Чаты
          {totalUnread > 0 && <span style={S.badge}>{totalUnread}</span>}
        </div>
        {studentList.length === 0 && (
          <div style={S.empty}>Сообщений нет</div>
        )}
        {studentList.map(([sid, chat]) => {
          const last = chat.messages[chat.messages.length - 1];
          const unread = unreadMap[sid] || 0;
          return (
            <div
              key={sid}
              onClick={() => setActiveId(sid)}
              style={{ ...S.studentRow, ...(activeId === sid ? S.studentRowActive : {}) }}
            >
              <div style={S.avatar}>{chat.name[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.studentName}>{chat.name}</div>
                {last && (
                  <div style={S.lastMsg}>
                    {last.role === 'proctor' ? '← ' : ''}{last.text}
                  </div>
                )}
              </div>
              {unread > 0 && <span style={S.badge}>{unread}</span>}
            </div>
          );
        })}
      </div>

      {/* Right: messages */}
      <div style={S.main}>
        {!activeChat ? (
          <div style={S.noChat}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div>Выберите студента слева</div>
          </div>
        ) : (
          <>
            <div style={S.chatHeader}>
              {activeChat.name}
            </div>
            <div style={S.messages}>
              {activeChat.messages.map((m, i) => {
                const isMe = m.role === 'proctor';
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
                placeholder={`Ответить ${activeChat.name}...`}
                style={S.input}
                autoFocus
              />
              <button onClick={send} style={S.sendBtn}>Отправить</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', flex: 1, overflow: 'hidden',
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: '#F1F5F9',
  },
  sidebar: {
    width: 240, borderRight: '1px solid #1E293B',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '14px 16px', fontSize: 13, fontWeight: 700,
    color: '#475569', textTransform: 'uppercase', letterSpacing: 1,
    borderBottom: '1px solid #1E293B',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  badge: {
    background: '#EF4444', color: '#fff', borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    padding: '1px 7px', minWidth: 18, textAlign: 'center',
  },
  empty: { padding: 24, color: '#475569', fontSize: 13, textAlign: 'center' },
  studentRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', cursor: 'pointer',
    borderBottom: '1px solid #1E293B',
  },
  studentRowActive: { background: '#1E293B' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: '#1D4ED8', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  studentName: { fontSize: 13, fontWeight: 600 },
  lastMsg: {
    fontSize: 11, color: '#64748B',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    maxWidth: 130,
  },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  noChat: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: '#334155', fontSize: 14,
  },
  chatHeader: {
    padding: '14px 20px', borderBottom: '1px solid #1E293B',
    fontSize: 15, fontWeight: 600,
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  bubble: {
    maxWidth: '75%', padding: '8px 12px', borderRadius: 10,
    fontSize: 13, lineHeight: 1.5,
  },
  bubbleMe: {
    alignSelf: 'flex-end', background: '#1D4ED8', color: '#fff',
    borderBottomRightRadius: 3,
  },
  bubbleThem: {
    alignSelf: 'flex-start', background: '#0F172A', color: '#F1F5F9',
    border: '1px solid #334155', borderBottomLeftRadius: 3,
  },
  bubbleText: { wordBreak: 'break-word' },
  bubbleTime: { fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' },
  inputRow: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderTop: '1px solid #1E293B',
  },
  input: {
    flex: 1, background: '#1E293B', border: '1px solid #334155',
    borderRadius: 8, color: '#F1F5F9', fontSize: 13,
    padding: '9px 12px', outline: 'none',
  },
  sendBtn: {
    background: '#2563EB', border: 'none', borderRadius: 8,
    color: '#fff', fontSize: 13, fontWeight: 600,
    padding: '0 18px', cursor: 'pointer',
  },
};