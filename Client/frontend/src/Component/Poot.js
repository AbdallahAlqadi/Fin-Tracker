import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  FaUserCircle, 
  FaRobot, 
  FaFileExcel, 
  FaPaperPlane, 
  FaCopy, 
  FaCheck, 
  FaComments 
} from 'react-icons/fa';
import '../cssStyle/poot.css';

function Poot() {
  const initialBotMessage = {
    sender: 'bot',
    text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
    time: getCurrentTime(),
    formatted: true
  };

  const [messages, setMessages] = useState([initialBotMessage]);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileData, setAttachedFileData] = useState(null);
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

  function handleNewChat() {
    setMessages([{
      sender: 'bot',
      text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
      time: getCurrentTime(),
      formatted: true
    }]);
    setInput('');
    setAttachedFile(null);
    setAttachedFileData(null);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target.result;
        try {
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          setAttachedFileData(jsonData);
        } catch (err) {
          console.error('حدث خطأ في قراءة الملف:', err);
        }
      };
      reader.readAsBinaryString(file);
    }
  }

  function CopyableCode({ code, language = '' }) {
    const [copied, setCopied] = useState(false);
    const copyCode = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('فشل النسخ:', err);
      }
    };

    return (
      <div style={{ position: 'relative', marginTop: '10px' }}>
        <SyntaxHighlighter 
          language={language} 
          style={tomorrow}
          customStyle={{
            borderRadius: '5px',
            padding: '15px',
            fontSize: '0.9em'
          }}
        >
          {code}
        </SyntaxHighlighter>
        <button 
          onClick={copyCode}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}
        >
          {copied ? <><FaCheck style={{ marginRight: '5px' }} />تم النسخ</> : <><FaCopy style={{ marginRight: '5px' }} />نسخ الكود</>}
        </button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedMessage = input.trim();
    if (!trimmedMessage && !attachedFileData) return;

    const userMsg = {
      sender: 'user',
      text: trimmedMessage || (attachedFile ? attachedFile.name : ''),
      time: getCurrentTime(),
      formatted: false
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const botResponse = await getBotResponse(trimmedMessage, attachedFileData);
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
      setAttachedFile(null);
      setAttachedFileData(null);
    }
  }

  async function getBotResponse(message, fileData = null) {
    const GEMINI_API_KEY = 'AIzaSyB-Ib9v9X1Jzv4hEloKk1oIOQO8ClVaM_w';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    let prompt = '';

    if (fileData) {
      prompt = `
تم إرفاق ملف Excel يحتوي على البيانات التالية:
${JSON.stringify(fileData)}
السؤال: ${message || 'برجاء تحليل محتويات الملف'}
يرجى تقديم شرح مفصل وتحليل محتويات الملف بناءً على السؤال المطروح.
      `.trim();
    } else {
      prompt = `
إذا كان السؤال متعلقًا بكود برمجي، قم بما يلي:
1. قدّم شرحاً مفصلاً للكود المطلوب.
2. بعد الشرح، ضع الكود داخل كتلة منفصلة باستخدام تنسيق Markdown مع زر "نسخ الكود".
أما إذا كان السؤال غير ذلك، فقم بتقديم إجابة مفصلة.
السؤال: ${message}
      `.trim();
    }

    const res = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [ { text: prompt } ] }
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
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      const parts = [];
      let match;

      while ((match = codeBlockRegex.exec(message.text)) !== null) {
        const before = message.text.slice(lastIndex, match.index).trim();
        if (before) {
          parts.push(
            <div key={lastIndex} className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {before}
              </ReactMarkdown>
            </div>
          );
        }
        const code = match[2].trim();
        const language = match[1] || '';
        parts.push(
          <CopyableCode key={match.index} code={code} language={language} />
        );
        lastIndex = match.index + match[0].length;
      }

      const after = message.text.slice(lastIndex).trim();
      if (after) {
        parts.push(
          <div key={lastIndex} className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {after}
            </ReactMarkdown>
          </div>
        );
      }

      return parts.length > 0 ? (
        <div className="message-text">{parts}</div>
      ) : (
        <div className="message-text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.text}
          </ReactMarkdown>
        </div>
      );
    }
    return <div className="message-text"><p>{message.text}</p></div>;
  }

  return (
    <div className="poot-container">
      <header className="poot-header">
        <div className="header-top">
          <h1 style={{ display: 'flex', alignItems: 'center' }}>
            <FaComments className="icon" style={{ marginRight: '8px' }} />
            Poot Chat
          </h1>
          <button 
            onClick={handleNewChat} 
            className="new-chat-btn"
          >
            New Chat
          </button>
        </div>
        <p className="header-subtitle">اسأل أي سؤال أو أرفق ملف Excel ليتم تحليله وإرجاع شرح مفصل</p>
      </header>
      <main className="chat-container">
        <div className="chat-messages-wrapper">
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender}`}>
                <div className="avatar">
                  {msg.sender === 'user' ? (
                    <FaUserCircle className="icon" size={30} />
                  ) : (
                    <FaRobot className="icon" size={30} />
                  )}
                </div>
                <div className="message-content">
                  {renderMessageContent(msg)}
                  <span className="time">{msg.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="avatar">
                  <FaRobot className="icon" size={30} />
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
          <div className="file-upload" style={{ marginBottom: '10px' }}>
            <label htmlFor="file-input" className="file-upload-label">
              <FaFileExcel className="icon" style={{ marginRight: '4px' }} />
              إرفاق ملف Excel
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            {attachedFile && <span className="file-name">{attachedFile.name}</span>}
          </div>
          <form onSubmit={handleSubmit} className="message-form">
            <input
              type="text"
              placeholder="اكتب سؤالك هنا..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoComplete="off"
              autoFocus
              className="message-input"
            />
            <button type="submit" disabled={!input.trim() && !attachedFileData} className="send-btn">
              <FaPaperPlane className="icon" size={18} />
            </button>
          </form>
        </div>
      </main>
      <footer className="poot-footer">
        <p>Manus © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default Poot;