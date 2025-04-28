import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  FaUserCircle,
  FaRobot,
  FaFileExcel,
  FaPaperPlane,
  FaCopy,
  FaCheck,
  FaComments,
  FaGlobe,
  FaFilePdf
} from 'react-icons/fa';
import jsPDF from 'jspdf';
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
  const [responseLanguage, setResponseLanguage] = useState('ar');
  const chatMessagesRef = useRef(null);

  const [budgetItems, setBudgetItems] = useState([]);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [dateType, setDateType] = useState('month');
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState('Revenues');

  const token = sessionStorage.getItem('jwt');
  const BUDGET_API = 'https://fin-tracker-ncbx.onrender.com/api/getUserBudget';
  const GEMINI_API_KEY = 'AIzaSyB-Ib9v9X1Jzv4hEloKk1oIOQO8ClVaM_w';
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  useEffect(() => {
    fetchBudget();
  }, []);

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
    let h = now.getHours(), m = now.getMinutes();
    if (h < 10) h = '0' + h; if (m < 10) m = '0' + m;
    return `${h}:${m}`;
  }

  async function fetchBudget() {
    setLoadingBudget(true);
    try {
      const res = await axios.get(BUDGET_API, {
        headers: { Auth: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      setBudgetItems(res.data.products || []);
    } catch (err) {
      console.error('Error fetching budget:', err);
    } finally {
      setLoadingBudget(false);
    }
  }

  function groupByCategory(items) {
    return items.reduce((acc, item) => {
      const cat = item.CategoriesId?.categoryName || 'Unknown';
      if (!acc[cat]) acc[cat] = { ...item, valueitem: 0 };
      acc[cat].valueitem += parseFloat(item.valueitem);
      return acc;
    }, {});
  }

  function filterItems(items) {
    let filtered = items;
    if (filterDate) {
      const sel = new Date(filterDate);
      filtered = filtered.filter(item => {
        const d = new Date(item.date);
        if (dateType === 'month') {
          return d.getMonth() === sel.getMonth() && d.getFullYear() === sel.getFullYear();
        }
        if (dateType === 'year') {
          return d.getFullYear() === sel.getFullYear();
        }
        return (
          d.getFullYear() === sel.getFullYear() &&
          d.getMonth() === sel.getMonth() &&
          d.getDate() === sel.getDate()
        );
      });
    }
    if (filterType) {
      filtered = filtered.filter(item => item.CategoriesId?.categoryType === filterType);
    }
    const grouped = groupByCategory(filtered);
    return Object.values(grouped).filter(i => i.CategoriesId?.categoryName && i.CategoriesId.categoryName !== 'Unknown');
  }

  async function getReport(items) {
    const prompt = `
الرجاء تقديم تقرير مُفصّل وحلول عملية للبيانات التالية باللغة ${responseLanguage === 'en' ? 'الإنجليزية' : 'العربية'}:
${JSON.stringify(items, null, 2)}
    `.trim();
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500, topP: 0.9, topK: 40 }
      })
    });
    if (!res.ok) throw new Error('Failed to get report');
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  async function handleGenerateReport() {
    const items = filterItems(budgetItems);
    setIsTyping(true);
    try {
      const report = await getReport(items);
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: report, time: getCurrentTime(), formatted: true }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'عذراً، لم أتمكن من جلب التقرير.', time: getCurrentTime(), formatted: false }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function exportReportAsPDF(reportText) {
    const doc = new jsPDF();
    doc.setFont("Amiri", "normal");
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(reportText, 180);
    doc.text(splitText, 10, 10);
    doc.save('report.pdf');
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        setAttachedFileData(json);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    };
    reader.readAsBinaryString(file);
  }

  async function getBotResponse(message, fileData = null, language = 'ar') {
    const prompt = fileData
      ? `تم إرفاق ملف Excel يحتوي على البيانات التالية:\n${JSON.stringify(fileData)}\nالسؤال: ${message}\nيرجى الرد باللغة ${language === 'en' ? 'الإنجليزية' : 'العربية'}.`
      : `السؤال: ${message}\nيرجى الرد باللغة ${language === 'en' ? 'الإنجليزية' : 'العربية'}.`;
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500, topP: 0.9, topK: 40 }
      })
    });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg && !attachedFileData) return;
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: msg || attachedFile.name, time: getCurrentTime(), formatted: false }
    ]);
    setInput(''); setIsTyping(true);
    try {
      const reply = await getBotResponse(msg, attachedFileData, responseLanguage);
      setMessages(prev => [...prev, { sender: 'bot', text: reply, time: getCurrentTime(), formatted: true }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'حدث خطأ. حاول مرة أخرى.', time: getCurrentTime(), formatted: false }]);
    } finally {
      setIsTyping(false);
      setAttachedFile(null);
      setAttachedFileData(null);
    }
  }

  function CopyableCode({ code, language = '' }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <div style={{ position: 'relative', marginTop: 10 }}>
        <SyntaxHighlighter language={language} style={tomorrow} customStyle={{ borderRadius: 8, padding: 15, fontSize: '0.9em', direction: 'ltr', textAlign: 'left' }}>
          {code}
        </SyntaxHighlighter>
        <button onClick={copy} style={{ position: 'absolute', top: 10, right: 10, background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 14 }}>
          {copied ? <><FaCheck style={{ marginRight: 5 }} />تم النسخ</> : <><FaCopy style={{ marginRight: 5 }} />نسخ الكود</>}
        </button>
      </div>
    );
  }

  function renderMessageContent(message) {
    if (message.formatted) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <CopyableCode code={String(children).replace(/\n$/, '')} language={match[1]} />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
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
      <header className="poot-header">
        <div className="header-top">
          <h1 style={{ display: 'flex', alignItems: 'center' }}>
            <FaComments style={{ marginRight: 8 }} /> Poot Chat
          </h1>
          <button onClick={() => window.location.reload()} className="new-chat-btn">New Chat</button>
        </div>
        <p className="header-subtitle">اسأل أي سؤال أو أرفق ملف Excel ليتم تحليله وإرجاع شرح مفصل</p>
      </header>

      <section className="filter-panel">
        <label>نوع التاريخ:</label>
        <select value={dateType} onChange={e => setDateType(e.target.value)}>
          <option value="full">تاريخ كامل</option>
          <option value="month">شهر</option>
          <option value="year">سنة</option>
        </select>

        {dateType === 'full' && (
          <input 
            type="date" 
            value={filterDate.toISOString().split('T')[0]} 
            onChange={e => setFilterDate(new Date(e.target.value))} 
          />
        )}
        {dateType === 'month' && (
          <input 
            type="month" 
            value={`${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, '0')}`} 
            onChange={e => {
              const [year, month] = e.target.value.split('-');
              setFilterDate(new Date(year, month - 1, 1));
            }} 
          />
        )}
        {dateType === 'year' && (
          <input 
            type="number" 
            min="2000" 
            max="2100" 
            value={filterDate.getFullYear()} 
            onChange={e => setFilterDate(new Date(e.target.value, 0, 1))} 
            placeholder="YYYY" 
          />
        )}

        <label>النوع:</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="Revenues">Revenues</option>
          <option value="Expenses">Expenses</option>
        </select>

        <button onClick={handleGenerateReport} disabled={loadingBudget}>
          {loadingBudget ? 'تحميل...' : 'توليد التقرير'}
        </button>
        <button onClick={() => exportReportAsPDF(messages.find(msg => msg.sender === 'bot' && msg.formatted)?.text || 'لا يوجد تقرير')}>
          <FaFilePdf style={{ marginRight: 4 }} /> تصدير التقرير ك PDF
        </button>
      </section>

      <main className="chat-container">
        <div className="chat-messages-wrapper" ref={chatMessagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              <div className="avatar">
                {msg.sender === 'user' ? <FaUserCircle size={30} /> : <FaRobot size={30} />}
              </div>
              <div className="message-content">
                {renderMessageContent(msg)}
                <span className="time">{msg.time}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message bot">
              <div className="avatar"><FaRobot size={30} /></div>
              <div className="message-content">
                <div className="typing-indicator"><span/><span/><span/></div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input">
          <div className="file-upload">
            <label htmlFor="file-input" className="file-upload-label">
              <FaFileExcel style={{ marginRight: 4 }} /> إرفاق ملف Excel
            </label>
            <input id="file-input" type="file" accept=".xlsx,.xls" onChange={handleFileUpload} hidden />
            {attachedFile && <span className="file-name">{attachedFile.name}</span>}
          </div>

          <div className="language-selection">
            <FaGlobe style={{ marginRight: 4 }} />
            <label htmlFor="language">لغة الرد:</label>
            <select id="language" value={responseLanguage} onChange={e => setResponseLanguage(e.target.value)}>
              <option value="ar">العربية</option>
              <option value="en">الإنجليزية</option>
            </select>
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
              <FaPaperPlane size={18} />
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