import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  FaUserCircle,
  FaRobot,
  FaPaperclip,
  FaPaperPlane,
  FaCopy,
  FaCheck,
  FaComments,
  FaGlobe,
  FaTimes, // For modal close button
  FaExternalLinkAlt // For a button to open report in modal
} from 'react-icons/fa';
import '../cssStyle/poot.css';

function ClarityChat() {
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
  const fileInputRef = useRef(null);

  const [budgetItems, setBudgetItems] = useState([]);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [dateType, setDateType] = useState('month');
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState('All');

  // State for Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalContent, setReportModalContent] = useState('');
  const [reportModalTitle, setReportModalTitle] = useState('');

  const token = sessionStorage.getItem('jwt');
  const BUDGET_API = 'http://127.0.0.1:5004/api/getUserBudget';
  const GEMINI_API_KEY = 'AIzaSyB-Ib9v9X1Jzv4hEloKk1oIOQO8ClVaM_w';
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  useEffect(() => {
    fetchBudget();
  }, []);

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Add/remove class to body when modal opens/closes to prevent background scroll
    if (isReportModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function to restore scroll on component unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isReportModalOpen]);

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

  async function getReportContent(items) { // Renamed from getReport to avoid confusion
    if (items.length === 0) {
      return responseLanguage === 'ar' ? 'لا توجد بيانات كافية لإنشاء تقرير مفصل.' : 'Insufficient data to generate a detailed report.';
    }
    const languageSpecificInstructions = responseLanguage === 'ar' ? 
      `الرجاء تقديم تقرير مالي مفصل للغاية ومنظم وجذاب بصريًا باللغة العربية بناءً على البيانات التالية. يجب أن يتضمن التقرير:
1.  **📊 عنوان رئيسي للتقرير واضح وجذاب** (مثال: "تحليل الأداء المالي لشهر [الشهر] [السنة] 📈")
2.  **✨ مقدمة موجزة ومشوقة**: تلخيص لأهمية التقرير والفترة التي يغطيها، مع استخدام رمز تعبيري مناسب.
3.  **🔍 تحليل شامل ومفصل**: 
    *   لكل فئة رئيسية، استخدم عنوانًا فرعيًا (H3) مع رمز تعبيري ذي صلة (مثال: 💰 الإيرادات، 💸 المصروفات).
    *   تحليل عميق لكل بند ضمن الفئة، مع إبراز الاتجاهات الرئيسية، والمقارنات (إذا أمكن)، وأي نقاط قوة (✅) أو ضعف (⚠️) ملحوظة.
    *   استخدم فقرات قصيرة ومنظمة.
4.  **💡 رؤى قابلة للتنفيذ**: 
    *   تقديم رؤى واضحة ومحددة مستخلصة من البيانات، معنونة بـ "🎯 أهم الرؤى والاستنتاجات".
    *   استخدم قائمة نقطية (bullet points) مع رموز تعبيرية لكل نقطة (مثال: •️⃣, 💡, 🔑).
5.  **🚀 حلول عملية ومبتكرة**: 
    *   اقتراح ما لا يقل عن 3-5 حلول عملية ومبتكرة لمعالجة أي تحديات تم تحديدها أو لتحسين الوضع المالي، معنونة بـ "🛠️ توصيات وحلول مقترحة".
    *   يجب أن تكون الحلول مفصلة وقابلة للتطبيق، مع استخدام قائمة مرقمة وربما رموز تعبيرية لتوضيح كل حل.
6.  **🔮 توقعات مستقبلية (إذا أمكن)**: 
    *   بناءً على البيانات، قدم توقعات موجزة أو سيناريوهات محتملة، معنونة بـ "🔭 نظرة مستقبلية".
    *   استخدم فقرة واضحة مع رمز تعبيري مناسب.
7.  **🏁 خاتمة قوية**: 
    *   ملخص لأهم النقاط والتوصيات الرئيسية، معنونة بـ "📌 الخلاصة والتوصيات النهائية".
    *   استخدم فقرة ختامية مشجعة.
8.  **🎨 تنسيق احترافي وجذاب**: 
    *   استخدم تنسيق Markdown بشكل مكثف لجعل التقرير جذابًا وسهل القراءة.
    *   استخدم العناوين (H1, H2, H3, H4)، والقوائم النقطية والرقمية، والنص الغامق والمائل.
    *   تأكد من وجود مسافات بيضاء كافية بين الفقرات والأقسام لسهولة القراءة.
    *   يجب أن يكون التقرير منظمًا بشكل جيد وقويًا في عرضه البصري والمحتوى.
` :
      `Please provide a highly detailed, well-organized, and visually engaging financial report in English based on the following data. The report must include:
1.  **📊 Clear and Engaging Main Report Title** (e.g., "Financial Performance Analysis for [Month] [Year] 📈")
2.  **✨ Brief and Engaging Introduction**: Summarizing the report's importance and the period it covers, using a relevant emoji.
3.  **🔍 Comprehensive and Detailed Analysis**: 
    *   For each main category, use a subheading (H3) with a relevant emoji (e.g., 💰 Revenues, 💸 Expenses).
    *   In-depth analysis of each item within the category, highlighting key trends, comparisons (if possible), and any notable strengths (✅) or weaknesses (⚠️).
    *   Use short, well-structured paragraphs.
4.  **💡 Actionable Insights**: 
    *   Present clear and specific insights derived from the data, titled "🎯 Key Insights and Conclusions".
    *   Use bullet points with emojis for each point (e.g., •️⃣, 💡, 🔑).
5.  **🚀 Practical and Innovative Solutions**: 
    *   Propose at least 3-5 practical and innovative solutions to address any identified challenges or to improve the financial situation, titled "🛠️ Recommendations and Proposed Solutions".
    *   Solutions should be detailed and actionable, using a numbered list and perhaps emojis to illustrate each solution.
6.  **🔮 Future Outlook (if applicable)**: 
    *   Based on the data, provide a brief outlook or potential scenarios, titled "🔭 Future Outlook".
    *   Use a clear paragraph with a relevant emoji.
7.  **🏁 Strong Conclusion**: 
    *   Summary of the main points and key recommendations, titled "📌 Summary and Final Recommendations".
    *   Use an encouraging concluding paragraph.
8.  **🎨 Professional and Attractive Formatting**: 
    *   Utilize Markdown extensively to make the report engaging and easy to read.
    *   Use headings (H1, H2, H3, H4), bulleted and numbered lists, bold and italic text.
    *   Ensure sufficient white space between paragraphs and sections for readability.
    *   The report should be well-structured and strong in its visual presentation and content.
`;

    const prompt = `${languageSpecificInstructions}
البيانات:
Data:
${JSON.stringify(items, null, 2)}
    `.trim();

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 3500, topP: 0.9, topK: 40 } // Adjusted temp, increased max tokens for richer content
      })
    });
    if (!res.ok) {
        const errorBody = await res.text();
        console.error('Error from API:', res.status, errorBody);
        throw new Error('Failed to get report from API');
    }
    const data = await res.json();
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
    } else {
        console.error('Unexpected API response structure:', data);
        return responseLanguage === 'ar' ? 'تم استلام رد غير متوقع من خدمة إنشاء التقارير.' : 'Received an unexpected response from the report generation service.';
    }
  }

  async function handleGenerateReport() {
    const items = filteredItems;
    if (items.length === 0) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: responseLanguage === 'ar' ? 'لا توجد بيانات كافية لإنشاء تقرير.' : 'Not enough data to generate a report.', time: getCurrentTime(), formatted: false }
      ]);
      return;
    }
    setIsTyping(true);
    try {
      const reportText = await getReportContent(items);
      const locale = responseLanguage === 'ar' ? 'ar-EG' : 'en-US';
      let dateStr;
      if (dateType === 'full') {
        dateStr = filterDate.toLocaleDateString(locale);
      } else if (dateType === 'month') {
        dateStr = filterDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      } else {
        dateStr = filterDate.toLocaleDateString(locale, { year: 'numeric' });
      }
      const title = responseLanguage === 'ar'
        ? `التقرير المالي لـ ${filterType === "All" ? "جميع الأنواع" : filterType} في ${dateStr}`
        : `Financial Report for ${filterType === "All" ? "All Types" : filterType} in ${dateStr}`;
      
      setReportModalTitle(title);
      setReportModalContent(reportText); // The report text already includes its own H1 from the prompt
      setIsReportModalOpen(true);

      // Add a message to chat indicating report is ready and can be viewed
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: responseLanguage === 'ar' ? `تم إنشاء تقريرك بنجاح. يمكنك عرضه الآن.` : `Your report has been generated successfully. You can view it now.`,
          time: getCurrentTime(),
          formatted: false, // Keep it simple, or make it a button-like text
          isReportNotification: true, // Custom flag to potentially style it differently or add action
          reportTitleForModal: title, // Pass title and content for re-opening
          reportContentForModal: reportText
        }
      ]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: responseLanguage === 'ar' ? 'عذراً، لم أتمكن من جلب التقرير.' : 'Sorry, I couldn\'t retrieve the report.', time: getCurrentTime(), formatted: false }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
      <div className="clarity-chat-copyable-code">
        <SyntaxHighlighter 
          language={language} 
          style={tomorrow} 
          customStyle={{ 
            borderRadius: '6px', 
            padding: '12px', 
            fontSize: '0.8em',
            backgroundColor: '#F7FAFC',
            color: '#2D3748',
          }}
          showLineNumbers={false}
        >
          {code}
        </SyntaxHighlighter>
        <button onClick={copy} className="clarity-chat-copy-code-button">
          {copied ? <><FaCheck style={{ marginRight: 3 }} />{responseLanguage === 'ar' ? 'تم النسخ' : 'Copied'}</> : <><FaCopy style={{ marginRight: 3 }} />{responseLanguage === 'ar' ? 'نسخ الكود' : 'Copy Code'}</>}
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
      <button onClick={copy} className="clarity-chat-copy-text-button">
        {copied ? <FaCheck /> : <FaCopy />}
      </button>
    );
  }

  // Component for Report Modal
  const ReportModal = ({ isOpen, onClose, title, content }) => {
    if (!isOpen) return null;

    return (
      <div className={`clarity-chat-report-modal-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose}>
        <div className="clarity-chat-report-modal" onClick={e => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
          <div className="clarity-chat-report-modal-header">
            <h2>{title}</h2>
            <button onClick={onClose} className="clarity-chat-report-modal-close-btn">
              <FaTimes />
            </button>
          </div>
          <div className="clarity-chat-report-modal-content">
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
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  function renderMessageContent(message) {
    if (message.isReportNotification) {
        return (
            <p>
                {message.text} 
                <button 
                    className="clarity-chat-view-report-btn" 
                    onClick={() => {
                        setReportModalTitle(message.reportTitleForModal);
                        setReportModalContent(message.reportContentForModal);
                        setIsReportModalOpen(true);
                    }}
                >
                    <FaExternalLinkAlt style={{ marginRight: '5px' }} /> 
                    {responseLanguage === 'ar' ? 'عرض التقرير' : 'View Report'}
                </button>
            </p>
        );
    }
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
    <div className="clarity-chat-container">
      <header className="clarity-chat-header">
        <div className="clarity-chat-header-top">
          <h1>
            <span className="app-icon"><FaComments /></span>
            Clarity Chat
          </h1>
          <div>
            <button onClick={clearChatHistory} className="clarity-chat-new-chat-btn">
              {responseLanguage === 'ar' ? 'محادثة جديدة' : 'New Chat'}
            </button>
          </div>
        </div>
      </header>

      <section className="clarity-chat-filter-panel">
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

      <main className="clarity-chat-main-container" ref={chatMessagesRef}>
        <div className="clarity-chat-messages-wrapper">
          {messages.map((msg, i) => (
            <div key={i} className={`clarity-chat-message ${msg.sender}${msg.isReportNotification ? ' report-notification' : ''}`}>
              <div className="avatar">
                {msg.sender === 'user' ? <FaUserCircle /> : <FaRobot />}
              </div>
              <div className="clarity-chat-message-content-wrapper">
                <div className="clarity-chat-message-content">
                  {renderMessageContent(msg)}
                  <span className="time">{msg.time}</span>
                  {msg.text && !msg.isReportNotification && <CopyButton text={msg.text} />}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="clarity-chat-message bot typing">
              <div className="avatar"><FaRobot /></div>
              <div className="clarity-chat-message-content-wrapper">
                <div className="clarity-chat-message-content"> 
                  <div className="clarity-chat-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <form className="clarity-chat-form" onSubmit={handleSubmit}>
        <label htmlFor="file-upload" className="clarity-chat-file-attach-label">
          <FaPaperclip />
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
        <div className="clarity-chat-form-controls">
            <div className="clarity-chat-language-selector-wrapper">
                <FaGlobe />
                <select value={responseLanguage} onChange={e => setResponseLanguage(e.target.value)}>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                </select>
            </div>
            <button type="submit" className="clarity-chat-send-btn" disabled={(!input.trim() && !attachedFile) || isTyping}>
              <FaPaperPlane />
            </button>
        </div>
      </form>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        title={reportModalTitle}
        content={reportModalContent} 
      />
    </div>
  );
}

export default ClarityChat;

