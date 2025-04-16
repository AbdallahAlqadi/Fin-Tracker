import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
// استيراد SyntaxHighlighter واختيار ثيم معين (يمكنك اختيار ثيمات أخرى مثل atomOneDark أو غيره)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../cssStyle/poot.css';

function Poot() {
  // الرسالة الابتدائية الخاصة بالبوت
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

  // دالة إعادة بدء محادثة جديدة
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

  // التعامل مع رفع ملف Excel باستخدام مكتبة XLSX
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

  // مكون فرعي لعرض كتل الكود مع تلوينها باستخدام SyntaxHighlighter وزر نسخ الكود
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
            background: '#4361ee',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          {copied ? '✔' : 'نسخ الكود'}
        </button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedMessage = input.trim();
    // يجب أن يكون هنالك سؤال أو ملف مرفق
    if (!trimmedMessage && !attachedFileData) return; 

    // إرسال رسالة المستخدم
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
      // تمرير بيانات الملف إذا وُجد
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
      // إعادة تعيين الملف بعد المعالجة
      setAttachedFile(null);
      setAttachedFileData(null);
    }
  }

  // دالة getBotResponse تأخذ رسالة المستخدم وبيانات الملف إن وُجد، وتُجهز prompt مناسب للإجابة
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

  // دالة لتحليل عرض المحتوى بحيث يتم اكتشاف وجود كتلة كود وعرضها باستخدام CopyableCode
  function renderMessageContent(message) {
    if (message.formatted) {
      // التعبير النمطي للبحث عن كتلة كود بصيغة Markdown (مع إمكانية تحديد لغة)
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
      const match = message.text.match(codeBlockRegex);

      if (match) {
        // استخراج الشرح والكود واللغة إن وُجدت
        const explanation = message.text.replace(match[0], '').trim();
        const code = match[2].trim();
        const language = match[1] || '';
        return (
          <div>
            {explanation && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            )}
            <CopyableCode code={code} language={language} />
          </div>
        );
      } else {
        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>;
      }
    }
    return <p>{message.text}</p>;
  }

  return (
    <div className="poot-container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>
            <i className="fas fa-robot" style={{ marginRight: '8px' }}></i>
          </h1>
          <button 
            onClick={handleNewChat} 
            style={{
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            New Chat
          </button>
        </div>
        <p>اسأل أي سؤال أو أرفق ملف Excel ليتم تحليله وإرجاع شرح مفصل</p>
      </header>
      <main className="chat-container">
        <div className="chat-messages-wrapper">
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender}`}>
                <div className="avatar">
                  {msg.sender === 'user' ? (
                    <i className="fas fa-user-circle"></i>
                  ) : (
                    <i className="fas fa-robot"></i>
                  )}
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
          {/* قسم رفع الملف */}
          <div className="file-upload" style={{ marginBottom: '10px' }}>
            <label htmlFor="file-input" style={{ cursor: 'pointer', color: '#4361ee' }}>
              <i className="fas fa-file-excel" style={{ marginRight: '4px' }}></i>
              إرفاق ملف Excel
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            {attachedFile && <span style={{ marginLeft: '10px' }}>{attachedFile.name}</span>}
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="اكتب سؤالك هنا..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <button type="submit" disabled={!input.trim() && !attachedFileData}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </main>
      <footer>
        <p>Manus &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default Poot;
