import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Keep for code content styling
import {
  FaUserCircle,
  FaRobot,
  FaFileExcel, // Will be used for file attach icon
  FaPaperPlane,
  FaCopy,
  FaCheck,
  FaComments, // App icon
  FaGlobe,
  FaMoon, // Example for a potential new icon for Aurora Flow
} from 'react-icons/fa';
import '../cssStyle/poot.css';

function AuroraFlowChat() { // Renamed component
  const initialBotMessage = {
    sender: 'bot',
    text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
    time: getCurrentTime(),
    formatted: true
  };
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [initialBotMessage];
  });
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileData, setAttachedFileData] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [responseLanguage, setResponseLanguage] = useState('ar');
  const chatMessagesRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for file input

  const [budgetItems, setBudgetItems] = useState([]);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [dateType, setDateType] = useState('month');
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState('All');

  const token = sessionStorage.getItem('jwt');
  const BUDGET_API = 'https://fin-tracker-ncbx.onrender.com/api/getUserBudget';
  const GEMINI_API_KEY = 'AIzaSyB-Ib9v9X1Jzv4hEloKk1oIOQO8ClVaM_w'; // Keep as is from original code
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  useEffect(() => {
    fetchBudget();
  }, []);

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('chatHistory', JSON.stringify(messages));
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
      if (err.response) {
        if (err.response.status === 401) {
          alert('غير مصرح. يرجى تسجيل الدخول مرة أخرى.');
        } else {
          alert('خطأ في جلب بيانات الميزانية. حاول لاحقًا.');
        }
      } else {
        alert('خطأ في الشبكة. تحقق من اتصالك.');
      }
    } finally {
      setLoadingBudget(false);
    }
  }

  const groupedBudgetItems = useMemo(() => groupByCategory(budgetItems), [budgetItems]);
  const filteredItems = useMemo(() => filterItems(budgetItems), [budgetItems, filterDate, dateType, filterType]);

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
    if (filterType && filterType !== "All") {
      filtered = filtered.filter(item => item.CategoriesId?.categoryType === filterType);
    }
    const grouped = groupByCategory(filtered);
    return Object.values(grouped).filter(i => i.CategoriesId?.categoryName && i.CategoriesId.categoryName !== 'Unknown');
  }

  async function getReport(items) {
    if (items.length === 0) {
      return responseLanguage === 'ar' ? 'لا توجد بيانات.' : 'No data found.';
    }
    const prompt = `
Please provide a detailed report and practical solutions for the following data in ${responseLanguage === 'en' ? 'English' : 'Arabic'}, using Markdown formatting for headings and lists:
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
    const items = filteredItems;
    if (items.length === 0) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: responseLanguage === 'ar' ? 'لا توجد بيانات.' : 'No data found.', time: getCurrentTime(), formatted: false }
      ]);
      return;
    }
    setIsTyping(true);
    try {
      const report = await getReport(items);
      const locale = responseLanguage === 'ar' ? 'ar-EG' : 'en-US';
      let dateStr;
      if (dateType === 'full') {
        dateStr = filterDate.toLocaleDateString(locale);
      } else if (dateType === 'month') {
        dateStr = filterDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      } else {
        dateStr = filterDate.toLocaleDateString(locale, { year: 'numeric' });
      }
      const header = responseLanguage === 'ar'
        ? `### تقرير لـ ${filterType === "All" ? "جميع الأنواع" : filterType} في ${dateStr}\n\n`
        : `### Report for ${filterType === "All" ? "All Types" : filterType} in ${dateStr}\n\n`;
      const reportWithHeader = header + report;
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: reportWithHeader, time: getCurrentTime(), formatted: true, type: 'report' }
      ]);
    } catch (err) {
      console.error(err);
      if (err.message.includes('Network error')) {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: responseLanguage === 'ar' ? 'خطأ في الشبكة. تحقق من اتصالك.' : 'Network error. Check your connection.', time: getCurrentTime(), formatted: false }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: responseLanguage === 'ar' ? 'عذراً، لم أتمكن من جلب التقرير.' : 'Sorry, I couldn\'t retrieve the report.', time: getCurrentTime(), formatted: false }
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert(responseLanguage === 'ar' ? 'الملف كبير جدًا. الحد الأقصى 5 ميجابايت.' : 'File is too large. Maximum size is 5MB.');
      return;
    }
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      alert(responseLanguage === 'ar' ? 'مسموح فقط بملفات Excel وCSV.' : 'Only Excel and CSV files are allowed.');
      return;
    }
    setAttachedFile(file);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        if (file.name.endsWith('.csv')) {
          const text = evt.target.result;
          const rows = text.split('\n').map(row => row.split(','));
          setAttachedFileData(rows);
        } else {
          const wb = XLSX.read(evt.target.result, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
          setAttachedFileData(json);
        }
      } catch (err) {
        console.error('Error reading file:', err);
        alert(responseLanguage === 'ar' ? 'خطأ في قراءة الملف. حاول مرة أخرى.' : 'Error reading file. Please try again.');
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
    // Clear the file input after selection so the same file can be re-uploaded
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  async function getBotResponse(message, fileData = null, language = 'ar') {
    const prompt = fileData
      ? `Attached file (${attachedFile.name.endsWith('.csv') ? 'CSV' : 'Excel'}) contains the following data:\n${JSON.stringify(fileData)}\nQuestion: ${message}\nPlease respond in ${language === 'en' ? 'English' : 'Arabic'}, using Markdown formatting where necessary.`
      : `Question: ${message}\nPlease respond in ${language === 'en' ? 'English' : 'Arabic'}, using Markdown formatting where necessary.`;
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
      { sender: 'user', text: msg || (attachedFile ? attachedFile.name : 'File attached'), time: getCurrentTime(), formatted: false }
    ]);
    setInput(''); setIsTyping(true);
    try {
      const reply = await getBotResponse(msg, attachedFileData, responseLanguage);
      setMessages(prev => [...prev, { sender: 'bot', text: reply, time: getCurrentTime(), formatted: true }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: responseLanguage === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.', time: getCurrentTime(), formatted: false }]);
    } finally {
      setIsTyping(false);
      setAttachedFile(null);
      setAttachedFileData(null);
    }
  }

  function clearChatHistory() {
    setMessages([initialBotMessage]);
    localStorage.removeItem('chatHistory');
  }

  function CopyableCode({ code, language = '' }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <div className="aurora-copyable-code"> {/* Updated class */}
        <SyntaxHighlighter 
          language={language} 
          style={tomorrow} 
          customStyle={{ 
            borderRadius: '8px', 
            padding: '15px', 
            fontSize: '0.85em', 
            direction: 'ltr', 
            textAlign: 'left',
            backgroundColor: '#0D121C', // Match CSS for pre background
          }}
          showLineNumbers={false} // Optional: to match common styles
        >
          {code}
        </SyntaxHighlighter>
        <button onClick={copy} className="aurora-copy-code-button"> {/* Updated class */}
          {copied ? <><FaCheck style={{ marginRight: 4 }} />{responseLanguage === 'ar' ? 'تم النسخ' : 'Copied'}</> : <><FaCopy style={{ marginRight: 4 }} />{responseLanguage === 'ar' ? 'نسخ الكود' : 'Copy Code'}</>}
        </button>
      </div>
    );
  }

  function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <button onClick={copy} className="aurora-copy-text-button"> {/* Updated class */}
        {copied ? <FaCheck /> : <FaCopy />}
      </button>
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
    <div className="aurora-flow-container"> {/* Updated class */}
      <header className="aurora-header"> {/* Updated class */}
        <div className="aurora-header-top"> {/* Updated class */}
          <h1>
            <span className="aurora-icon"><FaMoon /></span> {/* Using FaMoon as an example icon */}
            Aurora Flow {/* Updated App Name */}
          </h1>
          <div>
            <button onClick={clearChatHistory} className="aurora-new-chat-btn"> {/* Updated class */}
              {responseLanguage === 'ar' ? 'محادثة جديدة' : 'New Chat'}
            </button>
          </div>
        </div>
      </header>

      <section className="aurora-filter-panel"> {/* Updated class */}
        <label>{responseLanguage === 'ar' ? 'نوع التاريخ:' : 'Date Type:'}</label>
        <select value={dateType} onChange={e => setDateType(e.target.value)}>
          <option value="full">{responseLanguage === 'ar' ? 'تاريخ كامل' : 'Full Date'}</option>
          <option value="month">{responseLanguage === 'ar' ? 'شهر' : 'Month'}</option>
          <option value="year">{responseLanguage === 'ar' ? 'سنة' : 'Year'}</option>
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

        <label>{responseLanguage === 'ar' ? 'النوع:' : 'Type:'}</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">{responseLanguage === 'ar' ? 'الكل' : 'All'}</option>
          <option value="Revenues">{responseLanguage === 'ar' ? 'الإيرادات' : 'Revenues'}</option>
          <option value="Expenses">{responseLanguage === 'ar' ? 'المصروفات' : 'Expenses'}</option>
        </select>

        <button onClick={handleGenerateReport} disabled={loadingBudget || filteredItems.length === 0}>
          {loadingBudget ? (responseLanguage === 'ar' ? 'تحميل...' : 'Loading...') : (responseLanguage === 'ar' ? 'توليد التقرير' : 'Generate Report')}
        </button>
      </section>

      <main className="aurora-chat-container" ref={chatMessagesRef}> {/* Updated class & ref moved here*/}
        <div className="aurora-chat-messages-wrapper"> {/* Updated class */}
          {messages.map((msg, i) => (
            <div key={i} className={`aurora-message ${msg.sender}${msg.type === 'report' ? ' report' : ''}`}> {/* Updated class */}
              <div className="avatar">
                {msg.sender === 'user' ? <FaUserCircle /> : <FaRobot />}
              </div>
              <div className="aurora-message-content-wrapper">
                <div className="aurora-message-content"> {/* Updated class */}
                  {renderMessageContent(msg)}
                  <span className="time">{msg.time}</span>
                  {msg.text && <CopyButton text={msg.text} />} {/* Conditionally render copy button */}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="aurora-message bot typing"> {/* Updated class for typing */}
              <div className="avatar"><FaRobot /></div>
              <div className="aurora-message-content-wrapper">
                <div className="aurora-message-content"> 
                  <div className="aurora-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <form className="aurora-chat-form" onSubmit={handleSubmit}> {/* Updated class */}
        <label htmlFor="file-upload" className="aurora-file-attach-label"> {/* Updated class */}
          <FaFileExcel />
        </label>
        <input id="file-upload" type="file" onChange={handleFileUpload} ref={fileInputRef} />
        
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={responseLanguage === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
          onKeyPress={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="aurora-form-controls">
            <div className="aurora-language-selector-wrapper"> {/* Updated class */}
                <FaGlobe />
                <select value={responseLanguage} onChange={e => setResponseLanguage(e.target.value)}>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                </select>
            </div>
            <button type="submit" className="aurora-send-btn" disabled={(!input.trim() && !attachedFile) || isTyping}> {/* Updated class */}
              <FaPaperPlane />
            </button>
        </div>
      </form>
    </div>
  );
}

export default AuroraFlowChat; // Exporting the component

