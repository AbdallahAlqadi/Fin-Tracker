import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../cssStyle/poot.css';

function Poot() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
      time: getCurrentTime(),
      formatted: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }

  function getCurrentTime() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedMessage = input.trim();
    if (!trimmedMessage) return;

    const userMsg = {
      sender: 'user',
      text: trimmedMessage,
      time: getCurrentTime(),
      formatted: false
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const botResponse = await getBotResponse(trimmedMessage);
      const botMsg = {
        sender: 'bot',
        text: botResponse,
        time: getCurrentTime(),
        formatted: true
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMsg = {
        sender: 'bot',
        text: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى لاحقاً.',
        time: getCurrentTime(),
        formatted: false
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  async function getBotResponse(message) {
    const GEMINI_API_KEY = 'AIzaSyB-Ib9v9X1Jzv4hEloKk1oIOQO8ClVaM_w';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const prompt = `
أنت مساعد ذكي يتحدث العربية الفصحى. يجب عليك:
1. تقديم إجابات واضحة ومنظمة
2. استخدام تنسيق Markdown للتنظيم (العناوين، النقاط، الترميز)
3. تقسيم الإجابات الطويلة إلى فقرات
4. استخدام النقاط المرقمة عند تقديم خطوات أو قوائم
5. وضع الكود المصدري بين علامات \`\`\` إذا لزم الأمر

السؤال: ${message}
    `.trim();

    const res = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 1500,
          topP: 0.9,
          topK: 40
        }
      })
    });

    if (!res.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  function renderMessageContent(message) {
    if (message.formatted) {
      return (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 style={{fontSize: '1.3em', margin: '10px 0'}} {...props} />,
            h2: ({node, ...props}) => <h2 style={{fontSize: '1.2em', margin: '8px 0'}} {...props} />,
            h3: ({node, ...props}) => <h3 style={{fontSize: '1.1em', margin: '6px 0'}} {...props} />,
            p: ({node, ...props}) => <p style={{margin: '4px 0', lineHeight: '1.5'}} {...props} />,
            ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', margin: '6px 0'}} {...props} />,
            ol: ({node, ...props}) => <ol style={{paddingLeft: '20px', margin: '6px 0'}} {...props} />,
            li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />,
            code: ({node, inline, ...props}) => inline 
              ? <code style={{background: '#f0f0f0', padding: '2px 4px', borderRadius: '3px'}} {...props} /> 
              : <pre style={{
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  overflowX: 'auto',
                  margin: '10px 0'
                }} {...props} />,
            blockquote: ({node, ...props}) => <blockquote style={{
              borderLeft: '3px solid #4361ee',
              paddingLeft: '10px',
              margin: '10px 0',
              color: '#555'
            }} {...props} />
          }}
        >
          {message.text}
        </ReactMarkdown>
      );
    }
    return <p>{message.text}</p>;
  }

  return (
    <div className="poot-container">
      <header>
        <h1>بوت الدردشة الذكي</h1>
        <p>اسأل أي سؤال وسأقدم لك إجابة مفصلة ومنظمة</p>
      </header>
      <main className="chat-container">
        <div className="chat-messages-wrapper">
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender}`}>
                <div className="avatar">
                  <i className={`fas ${msg.sender === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {renderMessageContent(msg)}
                  </div>
                  <span className="time">{msg.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="avatar">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="chat-input">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="اكتب سؤالك هنا..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <button type="submit" disabled={!input.trim()}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </main>
      <footer>
        <p>تم تطويره بواسطة Manus &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default Poot;