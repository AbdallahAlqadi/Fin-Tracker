import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  FaTimes, FaFilter, FaCalendarAlt, FaFileAlt, FaListUl,
  FaRegFileAlt, FaHistory, FaDownload, FaPrint, FaShare, FaSearch, FaBookmark,
  FaFileExcel, FaFilePdf, FaWhatsapp, FaFacebook, FaArrowRight,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import '../cssStyle/poot.css';

// --- قائمة العملات ---
const currencies = [
    { code: "JOD", name: "Jordanian Dinar", symbol: "JOD" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
    { code: "AED", name: "UAE Dirham", symbol: "AED" },
    { code: "EGP", name: "Egyptian Pound", symbol: "EGP" },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "KWD" },
    { code: "QAR", name: "Qatari Riyal", symbol: "QAR" },
    { code: "BHD", name: "Bahraini Dinar", symbol: "BHD" },
    { code: "OMR", name: "Omani Rial", symbol: "OMR" },
    { code: "LBP", name: "Lebanese Pound", symbol: "LBP" },
    { code: "SYP", name: "Syrian Pound", symbol: "SYP" },
    { code: "IQD", name: "Iraqi Dinar", symbol: "IQD" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
];

function CollapsibleSection({ title, content, level }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState('0px');

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isCollapsed ? '0px' : `${contentRef.current.scrollHeight}px`);
    }
  }, [isCollapsed, content]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const HeadingTag = `h${level}`;

  return (
    <div className={`collapsible-section section-level-${level}`}>
      <HeadingTag className="collapsible-header" onClick={toggleCollapse}>
        {title}
        <button className="collapse-toggle-button">
          {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
        </button>
      </HeadingTag>
      <div
        className="collapsible-content-wrapper"
        style={{ maxHeight: contentHeight }}
        ref={contentRef}
      >
        <div className="collapsible-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => <h1 className="report-h1" {...props} />,
              h2: ({ node, ...props }) => <h2 className="report-h2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="report-h3" {...props} />,
              p: ({ node, ...props }) => <p className="report-paragraph" {...props} />,
              table: ({ node, ...props }) => <table className="report-table" {...props} />,
              th: ({ node, ...props }) => <th {...props} />,
              td: ({ node, ...props }) => <td {...props} />,
              ul: ({ node, ...props }) => <ul className="report-list" {...props} />,
              ol: ({ node, ...props }) => <ol className="report-ordered-list" {...props} />,
              li: ({ node, ...props }) => <li className="report-list-item" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="report-blockquote" {...props} />,
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="report-inline-code" {...props}>
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
}

function ModernReportDashboard() {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [dateType, setDateType] = useState('month');
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState('All');
  const [reportContent, setReportContent] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkedReports, setBookmarkedReports] = useState([]);
  const [reportFeedback, setReportFeedback] = useState({});
  const [activeReportId, setActiveReportId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const reportContentRef = useRef(null);
  
  // --- START: تعديلات العملة ---
  const [currency, setCurrency] = useState({
    code: "JOD",
    symbol: "JOD",
    rate: 1,
  });
  // --- END: تعديلات العملة ---

  const token = sessionStorage.getItem('jwt');
  const BUDGET_API = 'http://127.0.0.1:5004/api/getUserBudget';
  const GEMINI_API_KEY = 'AIzaSyB-Ib9v9X1Jzv4hEloKk1oIOQO8ClVaM_w'; // IMPORTANT: Keep your key secure
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  useEffect(() => {
    fetchBudget();
  }, []);

  // --- START: خطاف للاستماع لتغييرات العملة ---
  useEffect(() => {
    const updateCurrencyState = () => {
        const savedCurrencyCode = localStorage.getItem("selectedCurrency") || "JOD";
        const cachedRatesData = localStorage.getItem("exchangeRates");
        let rates = {};

        if (cachedRatesData) {
            try {
                rates = JSON.parse(cachedRatesData).rates;
            } catch (error) {
                console.error("Failed to parse exchange rates from localStorage", error);
                rates = {};
            }
        }

        const currencyInfo = currencies.find(c => c.code === savedCurrencyCode) || currencies[0];
        const rate = rates[savedCurrencyCode] || 1;

        setCurrency({
            code: savedCurrencyCode,
            symbol: currencyInfo.symbol,
            rate: rate,
        });
    };

    updateCurrencyState();
    window.addEventListener('currencyChanged', updateCurrencyState);
    return () => {
        window.removeEventListener('currencyChanged', updateCurrencyState);
    };
  }, []);
  // --- END: خطاف للاستماع لتغييرات العملة ---

  useEffect(() => {
    if (reportContentRef.current && reportContent) {
      reportContentRef.current.scrollTop = 0;
    }
  }, [reportContent]);

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
          alert('Unauthorized. Please log in again.');
        } else {
          alert('Error fetching budget data. Please try again later.');
        }
      } else {
        alert('Network error. Please check your connection.');
      }
    } finally {
      setLoadingBudget(false);
    }
  }

  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const cat = item.CategoriesId?.categoryName || 'Unknown';
      if (!acc[cat]) acc[cat] = { ...item, valueitem: 0 };
      acc[cat].valueitem += parseFloat(item.valueitem);
      return acc;
    }, {});
  };

  const groupedBudgetItems = useMemo(() => groupByCategory(budgetItems), [budgetItems]);

  const filterItems = (items) => {
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
  };

  const filteredItems = useMemo(() => filterItems(budgetItems), [budgetItems, filterDate, dateType, filterType]);

  async function getReportContent(items, currentCurrency) {
    if (items.length === 0) {
      return 'Insufficient data to generate a detailed report.';
    }

    const englishInstructions = `
      **Very Important: Please strictly adhere to the requested format and structure below to ensure clarity and usefulness.**
      Please generate a professional and detailed financial report in English, focusing on actionable insights and practical solutions based on the provided budget data.
      The data is presented in ${currentCurrency.code}. Please use the currency symbol "${currentCurrency.symbol}" for all monetary values.
      Use Markdown formatting effectively for visual appeal and readability. The report must include the following sections in order:

      1.  **📊 Clear Main Report Title:** Accurately reflecting the report's content and time period (e.g., "Detailed Financial Analysis for [Filter Type] for [Month] [Year] 📈" or "Annual Financial Performance Summary for [Year] 🗓️").
      2.  **✨ Executive Summary (Introduction):** A concise paragraph (3-4 sentences) highlighting the most critical findings and key takeaways from the report and the period it covers.
      3.  **🔍 Detailed Analysis and Tabular Display:**
          * **First: Display Data in Tables:**
              * If **Income** data exists, create a **Markdown table** for it titled "💰 Income Table". The table should have two columns: **Category** and **Amount**. Add a total row at the bottom.
              * If **Expense** data exists, create a separate **Markdown table** for it titled "💸 Expense Table". The table should have two columns: **Category** and **Amount**. Add a total row at the bottom.
          * **Second: Brief Textual Analysis:**
              * Following the tables, provide a brief textual analysis of the overall performance (1-2 paragraphs). Highlight the most significant categories (largest amounts, or notable changes if comparison is possible).
      4.  **🎯 Key Insights and Conclusions:**
          * A dedicated section titled "🎯 Key Insights and Conclusions".
          * Use bullet points (starting with "•") to present 3-5 clear, specific insights derived *directly* from the analysis of the provided data and tables. Avoid generalizations.

      5.  **💡 Practical Recommendations and Solutions:**
          * A dedicated section titled "💡 Practical Recommendations and Solutions".
          * Provide 2-4 recommendations that are **extremely specific, immediately actionable, and directly linked** to the insights.
          * **Strictly avoid generic advice.** Focus on practical steps the user can take. State **why** the recommendation is important (link to insight/data) and **what the proposed action** is concretely.
          * Example: "1. **Linked Insight:** Expenses in [Category Name] constituted X% of the total. **Recommendation:** Conduct a detailed review of last month's invoices for [Category Name] to identify non-essential items that can be eliminated or reduced, aiming for a Y% reduction in this category next month."
      6.  **🏁 Conclusion:**
          * A brief paragraph summarizing the main points and emphasizing the importance of following up on recommendations.
      **Additional Formatting:**
      * Use **bold text** for main and subheadings and important terms.
      * Use emojis appropriately but sparingly to enhance visual appeal.
      * Ensure clear separation between sections using blank lines.
    `;
    const prompt = `${englishInstructions}\n\nData: ${JSON.stringify(items, null, 2)}`.trim();

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 4096, topP: 0.9, topK: 40 }
      })
    });
    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Error from API:', res.status, errorBody);
      throw new Error('Failed to get report from API');
    }

    const data = await res.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error('Unexpected API response structure:', data);
      return 'Received an unexpected response from the report generation service.';
    }
  }

  const parseMarkdownIntoCollapsibleSections = (markdownText) => {
    const sections = [];
    const lines = markdownText.split('\n');
    let currentSection = null;
    let currentContentLines = [];

    lines.forEach((line, index) => {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection) {
          currentSection.content = currentContentLines.join('\n').trim();
          sections.push(currentSection);
          currentContentLines = [];
        }

        const level = line.startsWith('## ') ? 2 : 3;
        const title = line.substring(level === 2 ? 3 : 4).trim();
        currentSection = {
          id: `section-${sections.length + 1}`,
          title: title,
          level: level,
          content: '',
        };
      } else {
        currentContentLines.push(line);
      }
    });

    if (currentSection) {
      currentSection.content = currentContentLines.join('\n').trim();
      sections.push(currentSection);
    } else if (markdownText.trim().length > 0) {
      sections.push({
        id: 'section-1',
        title: 'Report Content',
        level: 2,
        content: markdownText.trim(),
      });
    }

    return sections;
  };

  const collapsibleSections = useMemo(() => parseMarkdownIntoCollapsibleSections(reportContent), [reportContent]);

  async function handleGenerateReport() {
    const items = filteredItems;
    if (items.length === 0) {
      alert('Not enough data to generate a report.');
      return;
    }

    setIsGeneratingReport(true);
    setReportContent('');
    setReportTitle('Generating your report...');
    try {
      // --- START: تحويل البيانات قبل إرسالها ---
      const itemsForReport = items.map(item => ({
        ...item,
        valueitem: (parseFloat(item.valueitem) * currency.rate).toFixed(2)
      }));
      // --- END: تحويل البيانات قبل إرسالها ---

      const reportText = await getReportContent(itemsForReport, currency);
      const locale = 'en-US';
      let dateStr;
      if (dateType === 'full') {
        dateStr = new Date(filterDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
      } else if (dateType === 'month') {
        dateStr = new Date(filterDate).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      } else {
        dateStr = new Date(filterDate).toLocaleDateString(locale, { year: 'numeric' });
      }

      const title = `Financial Report for ${filterType === "All" ? "All Types" : filterType} in ${dateStr}`;
      
      setReportTitle(title);
      setReportContent(reportText);

      const newReport = {
        id: Date.now(),
        title,
        content: reportText,
        date: new Date().toLocaleString(locale),
        filters: { dateType, date: dateStr, type: filterType }
      };
      setReportHistory(prev => [newReport, ...prev.slice(0, 9)]);
      setActiveReportId(newReport.id);

    } catch (err) {
      console.error(err);
      alert('Sorry, we couldn\'t generate the report.');
      setReportTitle('');
    } finally {
      setIsGeneratingReport(false);
    }
  }

  const searchReports = (term) => setSearchTerm(term);
  const filteredHistory = useMemo(() => {
    if (!searchTerm) return reportHistory;
    return reportHistory.filter(report =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportHistory, searchTerm]);

  const loadReportFromHistory = (report) => {
    setReportTitle(report.title);
    setReportContent(report.content);
    setActiveReportId(report.id);
  };
  
  const toggleBookmark = (reportId) => {
    setBookmarkedReports(prev =>
      prev.includes(reportId) ? prev.filter(id => id !== reportId) : [...prev, reportId]
    );
  };
  
  const submitFeedback = (reportId, isPositive) => {
    setReportFeedback(prev => ({ ...prev, [reportId]: isPositive }));
  };

  const handlePrintReport = () => window.print();
  const handleDownloadReport = async () => {
    if (!reportContentRef.current) return;
    alert('Creating PDF file...');
    try {
      const reportElement = reportContentRef.current;
      const canvas = await html2canvas(reportElement, {
        scale: 2, useCORS: true, logging: false, allowTaint: true, backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const fileName = `${reportTitle.replace(/[^\w\s]/gi, '_')}.pdf`;
      pdf.save(fileName);
      alert('Report downloaded as PDF successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error creating PDF file.');
    }
  };

  const handleExportToExcel = () => {
    try {
        const itemsToExport = filteredItems.map(item => ({
          Category: item.CategoriesId?.categoryName,
          Type: item.CategoriesId?.categoryType,
          Amount: (parseFloat(item.valueitem) * currency.rate).toFixed(2), // تحويل المبلغ
          Currency: currency.code // إضافة رمز العملة
        }));
        const ws = XLSX.utils.json_to_sheet(itemsToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        const fileName = `${reportTitle.replace(/[^\w\s]/gi, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        alert('Report data exported to Excel successfully!');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting report to Excel.');
    }
  };

  const handleShareReport = () => setShowShareModal(true);
  const closeShareModal = () => setShowShareModal(false);
  const shareOnWhatsApp = () => {
    const shareText = `${reportTitle}\n\n${reportContent.substring(0, 200)}...`;
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    closeShareModal();
  };

  const shareOnFacebook = () => {
    const url = window.location.href;
    const quote = reportTitle;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`, '_blank');
    closeShareModal();
  };

  return (
    <div className="modern-report-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1><FaFileAlt /> Financial Intelligence Suite</h1>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3><FaHistory /> Report History</h3>
            <div className="search-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => searchReports(e.target.value)}
                />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm('')}>
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
            <div className="report-history-list">
              {filteredHistory.length > 0 ? (
                filteredHistory.map(report => (
                  <div
                    key={report.id}
                    className={`history-item ${activeReportId === report.id ? 'active' : ''}`}
                    onClick={() => loadReportFromHistory(report)}
                  >
                    <FaRegFileAlt className="history-icon" />
                    <div className="history-item-details">
                      <h4>{report.title}</h4>
                      <span>{report.date}</span>
                    </div>
                    <div className="history-item-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(report.id);
                        }}
                        className={`bookmark-button ${bookmarkedReports.includes(report.id) ? 'bookmarked' : ''}`}
                        title={bookmarkedReports.includes(report.id) ? 'Remove Bookmark' : 'Bookmark Report'}
                      >
                        <FaBookmark />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-history">No reports in history.</p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3><FaBookmark /> Bookmarked Reports</h3>
            <div className="bookmarked-list">
              {bookmarkedReports.length > 0 ? (
                reportHistory.filter(report => bookmarkedReports.includes(report.id)).map(report => (
                  <div
                    key={report.id}
                    className="bookmarked-item"
                    onClick={() => loadReportFromHistory(report)}
                  >
                    <FaRegFileAlt /> {report.title}
                  </div>
                ))
              ) : (
                <p className="no-history">No bookmarked reports.</p>
              )}
            </div>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="filter-panel">
            <div className="panel-header">
              <h2><FaFilter /> Report Filters</h2>
              <p>Select criteria to generate your financial report.</p>
            </div>
            <div className="filter-controls">
              <div className="filter-group">
                <label htmlFor="dateType"><FaCalendarAlt /> Date Type</label>
                <select id="dateType" value={dateType} onChange={(e) => setDateType(e.target.value)}>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="full">Full Date</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="filterDate"><FaCalendarAlt /> Select Date</label>
                <input
                  type={dateType === 'full' ? 'date' : dateType === 'month' ? 'month' : 'number'}
                  value={dateType === 'year' ? filterDate.getFullYear() : filterDate.toISOString().split('T')[0].substring(0, dateType === 'month' ? 7 : 10)}
                  onChange={(e) => {
                    if (dateType === 'year') {
                      setFilterDate(new Date(parseInt(e.target.value), 0, 1));
                    } else {
                      setFilterDate(new Date(e.target.value));
                    }
                  }}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="filterType"><FaListUl /> Category Type</label>
                <select id="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Revenues">Revenues</option>
                  <option value="Expenses">Expenses</option>
                </select>
              </div>
              <button
                className="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || loadingBudget}
              >
                {isGeneratingReport ? 'Generating...' : 'Generate Report'} <FaArrowRight />
              </button>
            </div>
          </div>

          <div className="report-display">
            {isGeneratingReport ? (
              <div className="loading-report-state">
                <div className="spinner"></div>
                <h3>Generating Report...</h3>
                <p>Please wait while we process your financial data.</p>
              </div>
            ) : reportContent ? (
              <>
                <div className="report-header">
                  <h2>{reportTitle}</h2>
                  <div className="report-actions">
                    <button onClick={handleDownloadReport} title="Download PDF"><FaDownload /></button>
                    <button onClick={handlePrintReport} title="Print Report"><FaPrint /></button>
                    <button onClick={handleExportToExcel} title="Export to Excel"><FaFileExcel /></button>
                    <button onClick={handleShareReport} title="Share Report"><FaShare /></button>
                  </div>
                </div>
                {activeReportId && (
                  <div className="report-feedback">
                    <span className="feedback-question">Was this report helpful?</span>
                    <div className="feedback-buttons">
                      <button
                        className={`feedback-button ${reportFeedback[activeReportId] === true ? 'positive' : ''}`}
                        onClick={() => submitFeedback(activeReportId, true)}
                      >
                        Yes
                      </button>
                      <button
                        className={`feedback-button ${reportFeedback[activeReportId] === false ? 'negative' : ''}`}
                        onClick={() => submitFeedback(activeReportId, false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
                <div className="report-content" ref={reportContentRef}>
                  {collapsibleSections.map((section) => (
                    <CollapsibleSection
                      key={section.id}
                      title={section.title}
                      content={section.content}
                      level={section.level}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-report-state">
                <FaFileAlt className="empty-icon" />
                <h3>No Report Generated</h3>
                <p>Use the filters on the left to generate a financial report.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {showShareModal && (
        <div className="share-modal-overlay" onClick={closeShareModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share Report</h3>
              <button className="close-modal" onClick={closeShareModal}><FaTimes /></button>
            </div>
            <div className="share-modal-content">
              <p>Choose how you'd like to share this report:</p>
              <div className="share-buttons">
                <button className="share-button whatsapp" onClick={shareOnWhatsApp}>
                  <FaWhatsapp /> WhatsApp
                </button>
                <button className="share-button facebook" onClick={shareOnFacebook}>
                  <FaFacebook /> Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModernReportDashboard;
