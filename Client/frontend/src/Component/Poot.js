import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  FaGlobe,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaFilter,
  FaCalendarAlt,
  FaFileAlt,
  FaListUl,
  FaRegFileAlt,
  FaHistory,
  FaDownload,
  FaPrint,
  FaShare,
  FaSearch,
  FaInfoCircle,
  FaTag,
  FaThumbsUp,
  FaThumbsDown,
  FaBookmark,
  FaEye
} from 'react-icons/fa';
import '../cssStyle/poot.css';

function ModernReportDashboard() {
  // State for budget data
  const [budgetItems, setBudgetItems] = useState([]);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [dateType, setDateType] = useState('month');
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState('All');
  
  // State for Report Display
  const [reportContent, setReportContent] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkedReports, setBookmarkedReports] = useState([]);
  const [reportFeedback, setReportFeedback] = useState({});
  const [activeReportId, setActiveReportId] = useState(null);
  
  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({});
  
  // State for language
  const [responseLanguage, setResponseLanguage] = useState('en');
  
  // References
  const reportContentRef = useRef(null);
  
  // API configuration
  const token = sessionStorage.getItem('jwt');
  const BUDGET_API = 'http://127.0.0.1:5004/api/getUserBudget';
  const GEMINI_API_KEY = 'AIzaSyB-Ib9v9X1Jzv4hEloKk1oIOQO8ClVaM_w';
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Fetch budget data on component mount
  useEffect(() => {
    fetchBudget();
  }, []);

  // Scroll to top when report content changes
  useEffect(() => {
    if (reportContentRef.current && reportContent) {
      reportContentRef.current.scrollTop = 0;
    }
  }, [reportContent]);

  // Fetch budget data from API
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

  // Group budget items by category
  const groupedBudgetItems = useMemo(() => groupByCategory(budgetItems), [budgetItems]);
  
  // Filter budget items based on selected filters
  const filteredItems = useMemo(() => filterItems(budgetItems), [budgetItems, filterDate, dateType, filterType]);

  // Group items by category
  function groupByCategory(items) {
    return items.reduce((acc, item) => {
      const cat = item.CategoriesId?.categoryName || 'Unknown';
      if (!acc[cat]) acc[cat] = { ...item, valueitem: 0 };
      acc[cat].valueitem += parseFloat(item.valueitem);
      return acc;
    }, {});
  }

  // Filter items based on selected filters
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

  // Generate report content
  async function getReportContent(items) {
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
        generationConfig: { temperature: 0.65, maxOutputTokens: 3500, topP: 0.9, topK: 40 }
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

  // Handle report generation
  async function handleGenerateReport() {
    const items = filteredItems;
    if (items.length === 0) {
      alert(responseLanguage === 'ar' ? 'لا توجد بيانات كافية لإنشاء تقرير.' : 'Not enough data to generate a report.');
      return;
    }
    
    setIsGeneratingReport(true);
    
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
      
      setReportTitle(title);
      setReportContent(reportText);
      
      // Reset collapsed sections state when opening a new report
      setCollapsedSections({});
      
      // Add to report history
      const newReport = {
        id: Date.now(),
        title,
        content: reportText,
        date: new Date().toLocaleString(locale),
        filters: {
          dateType,
          date: dateStr,
          type: filterType
        }
      };
      
      setReportHistory(prev => [newReport, ...prev.slice(0, 9)]);
      
    } catch (err) {
      console.error(err);
      alert(responseLanguage === 'ar' ? 'عذراً، لم نتمكن من إنشاء التقرير.' : 'Sorry, we couldn\'t generate the report.');
    } finally {
      setIsGeneratingReport(false);
    }
  }

  // Toggle section collapse
  function toggleSection(sectionId) {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }

  // Handle print report
  function handlePrintReport() {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert(responseLanguage === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.' : 'Please allow pop-ups to print the report.');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${responseLanguage === 'ar' ? 'rtl' : 'ltr'}" lang="${responseLanguage}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1, h2, h3, h4 {
            color: #4169E1;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          h1 {
            text-align: center;
            font-size: 1.8em;
            border-bottom: 2px solid #4169E1;
            padding-bottom: 0.3em;
          }
          ul, ol {
            padding-left: 2em;
          }
          li {
            margin-bottom: 0.5em;
          }
          blockquote {
            border-left: 4px solid #4169E1;
            padding-left: 1em;
            margin-left: 0;
            color: #555;
          }
          @media print {
            body {
              font-size: 12pt;
            }
            h1 {
              font-size: 18pt;
            }
            h2 {
              font-size: 16pt;
            }
            h3 {
              font-size: 14pt;
            }
          }
        </style>
      </head>
      <body>
        <h1>${reportTitle}</h1>
        <div class="report-content">
          ${reportContent.replace(/\n/g, '<br>')}
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      // Close the window after print dialog is closed (optional)
      // printWindow.close();
    }, 500);
  }

  // Handle download report as PDF
  function handleDownloadReport() {
    // This is a placeholder - in a real implementation, you would use a library like jsPDF
    // or make a server request to generate a PDF
    alert(responseLanguage === 'ar' ? 'سيتم تنفيذ وظيفة تنزيل PDF في الإصدار النهائي.' : 'PDF download functionality will be implemented in the final version.');
  }

  // Handle export report as Excel
  function handleExportToExcel() {
    // This is a placeholder - in a real implementation, you would format the data and use XLSX library
    alert(responseLanguage === 'ar' ? 'سيتم تنفيذ وظيفة تصدير Excel في الإصدار النهائي.' : 'Excel export functionality will be implemented in the final version.');
  }

  // Handle share report
  function handleShareReport() {
    // This is a placeholder - in a real implementation, you would implement sharing functionality
    alert(responseLanguage === 'ar' ? 'سيتم تنفيذ وظيفة المشاركة في الإصدار النهائي.' : 'Sharing functionality will be implemented in the final version.');
  }

  // Format date for display
  function formatDate(date, type) {
    const locale = responseLanguage === 'ar' ? 'ar-EG' : 'en-US';
    const dateObj = new Date(date);
    
    if (type === 'full') {
      return dateObj.toLocaleDateString(locale);
    } else if (type === 'month') {
      return dateObj.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    } else {
      return dateObj.toLocaleDateString(locale, { year: 'numeric' });
    }
  }

  // Load a report from history
  function loadReportFromHistory(report) {
    setReportTitle(report.title);
    setReportContent(report.content);
    setCollapsedSections({});
    setActiveReportId(report.id);
  }
  
  // Toggle bookmark for a report
  function toggleBookmark(reportId) {
    if (bookmarkedReports.includes(reportId)) {
      setBookmarkedReports(prev => prev.filter(id => id !== reportId));
    } else {
      setBookmarkedReports(prev => [...prev, reportId]);
    }
  }
  
  // Submit feedback for a report
  function submitFeedback(reportId, isPositive) {
    setReportFeedback(prev => ({
      ...prev,
      [reportId]: isPositive
    }));
    
    // Show feedback confirmation with animation
    const feedbackElement = document.getElementById(`feedback-${isPositive ? 'positive' : 'negative'}`);
    if (feedbackElement) {
      feedbackElement.classList.add('feedback-active');
      setTimeout(() => {
        feedbackElement.classList.remove('feedback-active');
      }, 2000);
    }
  }
  
  // Search in reports
  function searchReports(term) {
    setSearchTerm(term);
  }
  
  // Get filtered history based on search term
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return reportHistory;
    
    return reportHistory.filter(report => 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportHistory, searchTerm]);

  return (
    <div className="modern-report-dashboard" dir={responseLanguage === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1><FaFileAlt /> {responseLanguage === 'ar' ? 'لوحة التقارير المالية' : 'Financial Reports Dashboard'}</h1>
          <div className="header-actions">
            <button className="language-toggle" onClick={() => setResponseLanguage(prev => prev === 'ar' ? 'en' : 'ar')}>
              <FaGlobe /> {responseLanguage === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3><FaHistory /> {responseLanguage === 'ar' ? 'التقارير السابقة' : 'Report History'}</h3>
            <div className="search-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder={responseLanguage === 'ar' ? 'بحث في التقارير...' : 'Search reports...'}
                  value={searchTerm}
                  onChange={(e) => searchReports(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="clear-search" 
                    onClick={() => setSearchTerm('')}
                  >
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
                        className={`bookmark-button ${bookmarkedReports.includes(report.id) ? 'bookmarked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(report.id);
                        }}
                        title={bookmarkedReports.includes(report.id) ? 'Remove bookmark' : 'Bookmark report'}
                      >
                        <FaBookmark />
                      </button>
                      <button 
                        className="view-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadReportFromHistory(report);
                        }}
                        title="View report"
                      >
                        <FaEye />
                      </button>
                    </div>
                  </div>
                ))
              ) : searchTerm ? (
                <p className="no-history">
                  {responseLanguage === 'ar' 
                    ? 'لا توجد نتائج مطابقة لبحثك.' 
                    : 'No matching results for your search.'}
                </p>
              ) : (
                <p className="no-history">
                  {responseLanguage === 'ar' 
                    ? 'لا توجد تقارير سابقة. قم بإنشاء تقرير جديد للبدء.' 
                    : 'No previous reports. Create a new report to get started.'}
                </p>
              )}
            </div>
            {bookmarkedReports.length > 0 && (
              <div className="bookmarked-section">
                <h4><FaBookmark /> {responseLanguage === 'ar' ? 'التقارير المحفوظة' : 'Bookmarked Reports'}</h4>
                <div className="bookmarked-list">
                  {reportHistory
                    .filter(report => bookmarkedReports.includes(report.id))
                    .map(report => (
                      <div 
                        key={`bookmark-${report.id}`} 
                        className="bookmarked-item"
                        onClick={() => loadReportFromHistory(report)}
                      >
                        <FaRegFileAlt />
                        <span>{report.title}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Panel */}
        <main className="dashboard-main">
          {/* Filter Panel */}
          <div className="filter-panel">
            <h2><FaFilter /> {responseLanguage === 'ar' ? 'تصفية البيانات' : 'Filter Data'}</h2>
            <div className="filter-controls">
              <div className="filter-group">
                <label>{responseLanguage === 'ar' ? 'نوع التاريخ:' : 'Date Type:'}</label>
                <select 
                  value={dateType} 
                  onChange={(e) => setDateType(e.target.value)}
                >
                  <option value="full">{responseLanguage === 'ar' ? 'يوم محدد' : 'Specific Day'}</option>
                  <option value="month">{responseLanguage === 'ar' ? 'شهر' : 'Month'}</option>
                  <option value="year">{responseLanguage === 'ar' ? 'سنة' : 'Year'}</option>
                </select>
              </div>

              <div className="filter-group">
                <label><FaCalendarAlt /> {responseLanguage === 'ar' ? 'التاريخ:' : 'Date:'}</label>
                {dateType === 'full' && (
                  <input 
                    type="date" 
                    value={filterDate.toISOString().split('T')[0]} 
                    onChange={(e) => setFilterDate(new Date(e.target.value))}
                  />
                )}
                {dateType === 'month' && (
                  <input 
                    type="month" 
                    value={`${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, '0')}`} 
                    onChange={(e) => setFilterDate(new Date(e.target.value))}
                  />
                )}
                {dateType === 'year' && (
                  <input 
                    type="number" 
                    value={filterDate.getFullYear()} 
                    onChange={(e) => {
                      const newDate = new Date(filterDate);
                      newDate.setFullYear(e.target.value);
                      setFilterDate(newDate);
                    }}
                    min="2000" 
                    max="2100"
                  />
                )}
              </div>

              <div className="filter-group">
                <label><FaListUl /> {responseLanguage === 'ar' ? 'النوع:' : 'Type:'}</label>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="All">{responseLanguage === 'ar' ? 'الكل' : 'All'}</option>
                  <option value="Income">{responseLanguage === 'ar' ? 'دخل' : 'Income'}</option>
                  <option value="Expense">{responseLanguage === 'ar' ? 'مصروف' : 'Expense'}</option>
                </select>
              </div>

              <button 
                className="generate-report-btn" 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || loadingBudget}
              >
                {isGeneratingReport 
                  ? (responseLanguage === 'ar' ? 'جاري الإنشاء...' : 'Generating...') 
                  : (responseLanguage === 'ar' ? 'إنشاء التقرير' : 'Generate Report')}
              </button>
            </div>
          </div>

          {/* Report Display */}
          <div className="report-display">
            {reportContent ? (
              <>
                <div className="report-header">
                  <h2>{reportTitle}</h2>
                  <div className="report-actions">
                    <button onClick={handlePrintReport} title={responseLanguage === 'ar' ? 'طباعة' : 'Print'}>
                      <FaPrint />
                    </button>
                    <button onClick={handleDownloadReport} title={responseLanguage === 'ar' ? 'تنزيل PDF' : 'Download PDF'}>
                      <FaDownload />
                    </button>
                    <button onClick={handleExportToExcel} title={responseLanguage === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel'}>
                      <FaFileAlt />
                    </button>
                    <button onClick={handleShareReport} title={responseLanguage === 'ar' ? 'مشاركة' : 'Share'}>
                      <FaShare />
                    </button>
                  </div>
                </div>
                {reportContent && (
                  <div className="report-feedback">
                    <div className="feedback-question">
                      {responseLanguage === 'ar' ? 'هل كان هذا التقرير مفيداً؟' : 'Was this report helpful?'}
                    </div>
                    <div className="feedback-buttons">
                      <button 
                        className={`feedback-button ${reportFeedback[activeReportId] === true ? 'active' : ''}`}
                        onClick={() => submitFeedback(activeReportId, true)}
                        id="feedback-positive"
                      >
                        <FaThumbsUp /> {responseLanguage === 'ar' ? 'نعم' : 'Yes'}
                      </button>
                      <button 
                        className={`feedback-button ${reportFeedback[activeReportId] === false ? 'active' : ''}`}
                        onClick={() => submitFeedback(activeReportId, false)}
                        id="feedback-negative"
                      >
                        <FaThumbsDown /> {responseLanguage === 'ar' ? 'لا' : 'No'}
                      </button>
                    </div>
                    <div className="report-tags">
                      <FaTag /> 
                      <span className="tag">{filterType === 'All' ? 'All Types' : filterType}</span>
                      <span className="tag">{dateType === 'month' ? 'Monthly' : dateType === 'year' ? 'Yearly' : 'Daily'}</span>
                      <button 
                        className={`bookmark-button-large ${bookmarkedReports.includes(activeReportId) ? 'bookmarked' : ''}`}
                        onClick={() => toggleBookmark(activeReportId)}
                      >
                        <FaBookmark /> {bookmarkedReports.includes(activeReportId) 
                          ? (responseLanguage === 'ar' ? 'إزالة من المحفوظات' : 'Remove Bookmark') 
                          : (responseLanguage === 'ar' ? 'حفظ التقرير' : 'Bookmark Report')}
                      </button>
                    </div>
                  </div>
                )}
                <div className="report-content" ref={reportContentRef}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="report-h1" {...props} />,
                      h2: ({node, ...props}) => <h2 className="report-h2" {...props} />,
                      h3: ({node, children, ...props}) => {
                        // Generate a unique ID for this section based on the heading text
                        const sectionId = children.toString().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                        const isCollapsed = collapsedSections[sectionId];
                        
                        return (
                          <div className="collapsible-section">
                            <h3 
                              className="report-h3 collapsible-header" 
                              onClick={() => toggleSection(sectionId)}
                              {...props}
                            >
                              {children}
                              {isCollapsed ? <FaChevronDown className="collapse-icon" /> : <FaChevronUp className="collapse-icon" />}
                            </h3>
                            <div className={`collapsible-content ${isCollapsed ? 'collapsed' : ''}`}>
                              {/* Content will be rendered here by ReactMarkdown */}
                            </div>
                          </div>
                        );
                      },
                      h4: ({node, ...props}) => <h4 className="report-h4" {...props} />,
                      p: ({node, ...props}) => <p className="report-paragraph" {...props} />,
                      ul: ({node, ...props}) => <ul className="report-list" {...props} />,
                      ol: ({node, ...props}) => <ol className="report-ordered-list" {...props} />,
                      li: ({node, ...props}) => <li className="report-list-item" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="report-blockquote" {...props} />,
                      code: ({node, inline, className, children, ...props}) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="report-code-block">
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="report-inline-code" {...props}>
                            {children}
                          </code>
                        );
                      },
                      table: ({node, ...props}) => <table className="report-table" {...props} />,
                      thead: ({node, ...props}) => <thead className="report-thead" {...props} />,
                      tbody: ({node, ...props}) => <tbody className="report-tbody" {...props} />,
                      tr: ({node, ...props}) => <tr className="report-tr" {...props} />,
                      th: ({node, ...props}) => <th className="report-th" {...props} />,
                      td: ({node, ...props}) => <td className="report-td" {...props} />
                    }}
                  >
                    {reportContent}
                  </ReactMarkdown>
                </div>
              </>
            ) : (
              <div className="empty-report-state">
                <FaFileAlt className="empty-icon" />
                <h3>
                  {responseLanguage === 'ar' 
                    ? 'لم يتم إنشاء أي تقرير بعد' 
                    : 'No Report Generated Yet'}
                </h3>
                <p>
                  {responseLanguage === 'ar'
                    ? 'استخدم لوحة التصفية أعلاه لتحديد المعايير وإنشاء تقرير جديد.'
                    : 'Use the filter panel above to set criteria and generate a new report.'}
                </p>
                <button 
                  className="generate-report-btn" 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || loadingBudget}
                >
                  {responseLanguage === 'ar' ? 'إنشاء تقرير جديد' : 'Generate New Report'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ModernReportDashboard;
