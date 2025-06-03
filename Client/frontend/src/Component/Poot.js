import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Choose a suitable style, e.g., vscDarkPlus or customize
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
  FaEye,
  FaSpinner, // For loading state
  FaExclamationTriangle // For error state
} from 'react-icons/fa';
// Import the improved CSS file
import './pasted_content_improved.css';

// --- Enhanced Markdown Components --- 
const markdownComponents = {
  h1: ({node, ...props}) => <h1 className="report-h1" {...props} />,
  h2: ({node, ...props}) => <h2 className="report-h2" {...props} />,
  h3: ({node, ...props}) => <h3 className="report-h3" {...props} />,
  h4: ({node, ...props}) => <h4 className="report-h4" {...props} />,
  p: ({node, ...props}) => <p className="report-paragraph" {...props} />,
  ul: ({node, ...props}) => <ul className="report-list" {...props} />,
  ol: ({node, ...props}) => <ol className="report-ordered-list" {...props} />,
  li: ({node, ...props}) => <li className="report-list-item" {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="report-blockquote" {...props} />,
  table: ({node, ...props}) => <div style={{overflowX: 'auto'}}><table className="report-table" {...props} /></div>,
  th: ({node, ...props}) => <th className="report-th" {...props} />,
  td: ({node, ...props}) => <td className="report-td" {...props} />,
  pre: ({node, children, ...props}) => {
    const match = /language-(\w+)/.exec(children[0]?.props?.className || '');
    const codeContent = String(children[0]?.props?.children).replace(/\n$/, '');
    return (
      <pre className="report-code-block" {...props}>
        <SyntaxHighlighter
          style={vscDarkPlus} // Use imported style
          language={match ? match[1] : null}
          PreTag="div"
        >
          {codeContent}
        </SyntaxHighlighter>
      </pre>
    );
  },
  code: ({node, inline, className, children, ...props}) => {
    if (inline) {
      return <code className="report-inline-code" {...props}>{children}</code>;
    }
    // Code block content is handled by `pre` component
    return null; 
  },
  hr: ({node, ...props}) => <hr className="report-hr" {...props} />,
};

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
  const [reportError, setReportError] = useState(null); // Added error state
  const [reportHistory, setReportHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkedReports, setBookmarkedReports] = useState([]);
  const [reportFeedback, setReportFeedback] = useState({});
  const [activeReportId, setActiveReportId] = useState(null);
  
  // State for collapsible sections (if needed, managed via Markdown structure)
  // const [collapsedSections, setCollapsedSections] = useState({});
  
  // State for language
  const [responseLanguage, setResponseLanguage] = useState('en');
  
  // References
  const reportContentRef = useRef(null);
  
  // API configuration
  const token = sessionStorage.getItem('jwt');
  const BUDGET_API = 'http://127.0.0.1:5004/api/getUserBudget';
  // IMPORTANT: Replace with your actual API key securely (e.g., environment variable)
  const GEMINI_API_KEY = 'YOUR_API_KEY'; // Replace placeholder
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Fetch budget data on component mount
  useEffect(() => {
    fetchBudget();
  }, []);

  // Scroll to top when report content changes
  useEffect(() => {
    if (reportContentRef.current && (reportContent || reportError)) {
      reportContentRef.current.scrollTop = 0;
    }
  }, [reportContent, reportError]);

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
      // Improved error feedback (consider using a notification system)
      const message = responseLanguage === 'ar' 
        ? (err.response?.status === 401 ? 'غير مصرح. يرجى تسجيل الدخول مرة أخرى.' : 'خطأ في جلب بيانات الميزانية. حاول لاحقًا.')
        : (err.response?.status === 401 ? 'Unauthorized. Please log in again.' : 'Error fetching budget data. Please try again later.');
      alert(message); // Replace with better UI feedback if possible
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
      // Ensure valueitem is treated as a number
      acc[cat].valueitem += parseFloat(item.valueitem) || 0;
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
        // Assumes 'full' date type otherwise
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
    // Ensure filtering logic is correct and robust
    return Object.values(grouped).filter(i => i.CategoriesId?.categoryName && i.CategoriesId.categoryName !== 'Unknown');
  }

  // --- Enhanced Report Generation Prompt --- 
  async function getReportContent(items) {
    if (items.length === 0) {
      return responseLanguage === 'ar' ? 'لا توجد بيانات متاحة للفترة أو الفلتر المحدد لإنشاء تقرير.' : 'No data available for the selected period or filter to generate a report.';
    }
    
    const languageSpecificInstructions = responseLanguage === 'ar' ? 
      `**مهم:** قم بإنشاء تقرير مالي احترافي ومفصل للغاية باللغة **العربية** باستخدام تنسيق Markdown المحسن. يجب أن يكون التقرير شاملاً ومنظمًا منطقياً وجذابًا بصريًا.

**الهيكل المطلوب:**

1.  **# 📊 عنوان التقرير الرئيسي:** عنوان واضح وجذاب يلخص محتوى التقرير والفترة الزمنية (مثال: "# 📊 تحليل الأداء المالي لشهر يونيو 2025").
2.  **## ✨ مقدمة تنفيذية:** فقرة موجزة (3-4 جمل) تلخص أهم النتائج والرؤى الرئيسية للتقرير.
3.  **## 🔍 تحليل تفصيلي حسب الفئة:**
    *   لكل فئة رئيسية (مثل الإيرادات، المصروفات التشغيلية)، استخدم عنوانًا فرعيًا `###` مع رمز تعبيري مناسب (مثال: "### 💰 الإيرادات").
    *   ضمن كل فئة، قدم تحليلاً معمقًا للبند (أو البنود) باستخدام فقرات واضحة (`<p>`).
    *   استخدم **النص الغامق** لإبراز الأرقام أو النقاط الهامة.
    *   اذكر الاتجاهات الملحوظة، المقارنات (إذا كانت البيانات تسمح)، وأي نقاط قوة (✅) أو ضعف (⚠️).
    *   استخدم القوائم النقطية (`<ul><li>`) أو المرقمة (`<ol><li>`) لعرض التفاصيل أو الخطوات بشكل منظم.
4.  **## 🎯 أهم الرؤى والاستنتاجات:**
    *   قسم مخصص يلخص أهم الاستنتاجات المستخلصة من التحليل.
    *   استخدم قائمة نقطية واضحة (`<ul><li>`) مع رموز تعبيرية مناسبة (💡, 🔑,📈, 📉) لكل رؤية.
5.  **## 🛠️ توصيات وحلول مقترحة:**
    *   قسم يقدم ما لا يقل عن 3 توصيات عملية وقابلة للتنفيذ بناءً على الرؤى.
    *   استخدم قائمة مرقمة (`<ol><li>`) لكل توصية، مع شرح موجز لكيفية تنفيذها.
6.  **## 🔭 نظرة مستقبلية (اختياري):**
    *   إذا كانت البيانات تسمح، قدم فقرة موجزة حول التوقعات أو الاعتبارات المستقبلية.
7.  **## 📌 الخلاصة:**
    *   فقرة ختامية تلخص بإيجاز النقاط الرئيسية للتقرير.

**تنسيق Markdown:**
*   استخدم مستويات العناوين (`#`, `##`, `###`) بشكل صحيح للهيكلة.
*   استخدم الفقرات (`<p>`) للفصل بين الأفكار.
*   استخدم القوائم النقطية (`-` أو `*`) والمرقمة (`1.`).
*   استخدم **النص الغامق** و *النص المائل* بشكل مناسب.
*   استخدم فواصل أفقية (`---`) للفصل بين الأقسام الرئيسية إذا لزم الأمر.
*   تجنب استخدام الجداول إلا إذا كانت ضرورية للغاية لعرض بيانات معقدة.
*   تأكد من أن التقرير يتدفق بشكل منطقي وسهل القراءة.
` :
      `**Important:** Generate a highly professional and detailed financial report in **English** using enhanced Markdown formatting. The report must be comprehensive, logically structured, and visually engaging.

**Required Structure:**

1.  **# 📊 Main Report Title:** A clear, engaging title summarizing the report content and period (e.g., "# 📊 Financial Performance Analysis for June 2025").
2.  **## ✨ Executive Summary:** A concise paragraph (3-4 sentences) summarizing the key findings and insights of the report.
3.  **## 🔍 Detailed Analysis by Category:**
    *   For each major category (e.g., Revenue, Operating Expenses), use an `###` subheading with a relevant emoji (e.g., "### 💰 Revenue").
    *   Within each category, provide in-depth analysis of the item(s) using clear paragraphs (`<p>`).
    *   Use **bold text** to highlight key figures or points.
    *   Mention notable trends, comparisons (if data allows), and any strengths (✅) or weaknesses (⚠️).
    *   Use bulleted (`<ul><li>`) or numbered (`<ol><li>`) lists for structured details or steps.
4.  **## 🎯 Key Insights and Conclusions:**
    *   A dedicated section summarizing the most important conclusions drawn from the analysis.
    *   Use a clear bulleted list (`<ul><li>`) with appropriate emojis (💡, 🔑, 📈, 📉) for each insight.
5.  **## 🛠️ Recommendations and Proposed Solutions:**
    *   A section providing at least 3 actionable and practical recommendations based on the insights.
    *   Use a numbered list (`<ol><li>`) for each recommendation, briefly explaining its implementation.
6.  **## 🔭 Future Outlook (Optional):**
    *   If data allows, provide a brief paragraph on future expectations or considerations.
7.  **## 📌 Summary:**
    *   A concluding paragraph briefly summarizing the report's main points.

**Markdown Formatting:**
*   Use heading levels (`#`, `##`, `###`) correctly for structure.
*   Use paragraphs (`<p>`) to separate ideas.
*   Use bullet points (`-` or `*`) and numbered lists (`1.`).
*   Use **bold** and *italic* text appropriately.
*   Use horizontal rules (`---`) to separate major sections if needed.
*   Avoid tables unless absolutely necessary for complex data presentation.
*   Ensure the report flows logically and is easy to read.
`;

    // Prepare data for the prompt, ensuring numbers are formatted reasonably
    const formattedItems = items.map(item => ({
      category: item.CategoriesId?.categoryName,
      type: item.CategoriesId?.categoryType,
      // Format value to 2 decimal places for currency
      value: parseFloat(item.valueitem || 0).toFixed(2) 
    }));

    const prompt = `${languageSpecificInstructions}

**البيانات المتاحة للتحليل (Data Available for Analysis):**
${JSON.stringify(formattedItems, null, 2)}

**الرجاء إنشاء التقرير الآن.**
**Please generate the report now.**
    `.trim();

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.6, // Slightly lower temp for more factual reports
            maxOutputTokens: 4096, // Increased token limit for detail
            topP: 0.95,
            topK: 40 
          }
        })
      });

      if (!res.ok) {
          const errorBody = await res.text();
          console.error('Error from Gemini API:', res.status, errorBody);
          // Try to parse error details if JSON
          let detail = errorBody;
          try { detail = JSON.parse(errorBody).error.message; } catch(e) {}
          throw new Error(`API Error ${res.status}: ${detail}`);
      }

      const data = await res.json();
      
      // Add robust checking for API response structure
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts?.length > 0) {
          // Check for safety ratings or finish reasons if needed
          if (data.candidates[0].finishReason && data.candidates[0].finishReason !== 'STOP') {
             console.warn('Report generation finished with reason:', data.candidates[0].finishReason);
             // Potentially handle partial or blocked content
          }
          return data.candidates[0].content.parts[0].text;
      } else if (data.promptFeedback?.blockReason) {
          console.error('Report generation blocked:', data.promptFeedback.blockReason);
          throw new Error(`Report generation blocked due to: ${data.promptFeedback.blockReason}`);
      } else {
          console.error('Unexpected API response structure:', data);
          throw new Error('Unexpected response from report generation service.');
      }
    } catch (error) {
        console.error('Error during report generation fetch:', error);
        // Return a user-friendly error message in the correct language
        const message = responseLanguage === 'ar' 
          ? `حدث خطأ أثناء إنشاء التقرير: ${error.message}`
          : `An error occurred while generating the report: ${error.message}`;
        // We throw the error here so it can be caught by handleGenerateReport
        throw new Error(message); 
    }
  }

  // Handle report generation
  async function handleGenerateReport() {
    const items = filteredItems;
    if (items.length === 0) {
      // Use the improved empty state message directly
      setReportTitle(responseLanguage === 'ar' ? 'لا توجد بيانات' : 'No Data');
      setReportContent(''); // Clear content
      setReportError(null); // Clear errors
      setActiveReportId(null);
      // No need for alert, the empty state will show
      return;
    }
    
    setIsGeneratingReport(true);
    setReportError(null); // Clear previous errors
    setReportContent(''); // Clear previous content
    setActiveReportId(null);
    
    try {
      const reportText = await getReportContent(items);
      const locale = responseLanguage === 'ar' ? 'ar-EG' : 'en-US';
      let dateStr;
      
      const currentDate = filterDate instanceof Date ? filterDate : new Date(); // Ensure filterDate is a Date

      if (dateType === 'full') {
        dateStr = currentDate.toLocaleDateString(locale);
      } else if (dateType === 'month') {
        dateStr = currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      } else { // year
        dateStr = currentDate.toLocaleDateString(locale, { year: 'numeric' });
      }
      
      // Generate a more descriptive title based on the prompt's request
      // Extract H1 from reportText if possible, otherwise use default
      let generatedTitle = '';
      const titleMatch = reportText.match(/^#\s*(.*)/);
      if (titleMatch && titleMatch[1]) {
        generatedTitle = titleMatch[1].trim();
        // Remove the H1 line from the content itself
        // setReportContent(reportText.substring(titleMatch[0].length).trim());
      } else {
         generatedTitle = responseLanguage === 'ar'
          ? `التقرير المالي لـ ${filterType === "All" ? "جميع الأنواع" : filterType} في ${dateStr}`
          : `Financial Report for ${filterType === "All" ? "All Types" : filterType} in ${dateStr}`;
         // setReportContent(reportText); // Use full content if no H1 found
      }
      
      setReportTitle(generatedTitle);
      setReportContent(reportText); // Keep H1 in content for ReactMarkdown to handle
      
      // Add to report history
      const newReport = {
        id: Date.now(),
        title: generatedTitle, // Use the potentially extracted title
        content: reportText,
        date: new Date().toLocaleString(locale),
        filters: {
          dateType,
          date: dateStr,
          type: filterType
        }
      };
      
      setReportHistory(prev => [newReport, ...prev.slice(0, 9)]); // Keep history size limited
      setActiveReportId(newReport.id);
      
    } catch (err) {
      console.error('Failed to generate report:', err);
      setReportError(err.message || (responseLanguage === 'ar' ? 'عذراً، لم نتمكن من إنشاء التقرير. يرجى المحاولة مرة أخرى.' : 'Sorry, we couldn\'t generate the report. Please try again.'));
      setReportTitle(responseLanguage === 'ar' ? 'خطأ في إنشاء التقرير' : 'Report Generation Error');
      setReportContent(''); // Clear content on error
    } finally {
      setIsGeneratingReport(false);
    }
  }

  // Toggle section collapse - No longer needed if relying on Markdown structure
  // function toggleSection(sectionId) { ... }

  // --- Print Function (Improved Styling) --- 
  function handlePrintReport() {
    if (!reportContent) return; // Don't print empty report

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(responseLanguage === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.' : 'Please allow pop-ups to print the report.');
      return;
    }

    // Use ReactMarkdown to render content to HTML for printing
    // This requires rendering the component to a string, which is complex client-side.
    // Alternative: Basic HTML conversion + CSS link (less accurate rendering)
    // Or, use a library like html2canvas + jsPDF for better results (added complexity)

    // Simple approach: Basic HTML structure + link to improved CSS
    // Note: Markdown rendering might not be perfect this way.
    const printHtml = `
      <!DOCTYPE html>
      <html dir="${responseLanguage === 'ar' ? 'rtl' : 'ltr'}" lang="${responseLanguage}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
        <link rel="stylesheet" href="./pasted_content_improved.css"> 
        <style>
          body { padding: 20px; background-color: #fff; }
          .modern-report-dashboard, .dashboard-header, .dashboard-sidebar, .dashboard-main > *:not(.report-display), .report-header, .report-feedback, .report-actions { display: none; } /* Hide non-report elements */
          .report-display { border: none; box-shadow: none; min-height: auto; }
          .report-content { overflow-y: visible; height: auto; padding: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            /* Add any print-specific overrides */
          }
        </style>
      </head>
      <body>
        <div class="report-display">
          <div class="report-content" id="print-content">
            </div>
        </div>
        <script>
          // Inject rendered markdown (requires a way to render Markdown outside React component)
          // This is tricky. A server-side rendering or a dedicated print view might be better.
          // Fallback: Approximate rendering by replacing newlines (less ideal)
          document.getElementById('print-content').innerHTML = 
            '<h1>${reportTitle.replace(/'/g, "\'")}</h1>' + 
            '${reportContent.replace(/\n/g, '<br>').replace(/'/g, "\'")}'; // Basic conversion
          
          // Wait for potential CSS loading
          setTimeout(() => {
            window.print();
            // window.close(); // Optional: close after printing
          }, 500); 
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }

  // --- Placeholder Functions (Keep as is) --- 
  function handleDownloadReport() {
    alert(responseLanguage === 'ar' ? 'سيتم تنفيذ وظيفة تنزيل PDF في الإصدار النهائي.' : 'PDF download functionality will be implemented in the final version.');
  }
  function handleExportToExcel() {
    alert(responseLanguage === 'ar' ? 'سيتم تنفيذ وظيفة تصدير Excel في الإصدار النهائي.' : 'Excel export functionality will be implemented in the final version.');
  }
  function handleShareReport() {
    alert(responseLanguage === 'ar' ? 'سيتم تنفيذ وظيفة المشاركة في الإصدار النهائي.' : 'Sharing functionality will be implemented in the final version.');
  }

  // Format date for display
  function formatDate(date, type) {
    const locale = responseLanguage === 'ar' ? 'ar-EG' : 'en-US';
    // Ensure date is a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date'; // Handle invalid dates
    
    try {
      if (type === 'full') {
        return dateObj.toLocaleDateString(locale);
      } else if (type === 'month') {
        return dateObj.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      } else { // year
        return dateObj.toLocaleDateString(locale, { year: 'numeric' });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  }

  // Load a report from history
  function loadReportFromHistory(report) {
    setReportTitle(report.title);
    setReportContent(report.content);
    setActiveReportId(report.id);
    setReportError(null); // Clear error when loading from history
    setIsGeneratingReport(false); // Ensure loading state is off
    // Optionally restore filters (might be complex)
    // setDateType(report.filters.dateType);
    // setFilterDate(new Date(report.filters.date)); // Needs parsing
    // setFilterType(report.filters.type);
  }

  // Toggle bookmark status
  function toggleBookmark(reportId, reportTitle) {
    setBookmarkedReports(prev => {
      const isBookmarked = prev.some(b => b.id === reportId);
      if (isBookmarked) {
        return prev.filter(b => b.id !== reportId);
      } else {
        // Find the full report from history to bookmark
        const reportToBookmark = reportHistory.find(r => r.id === reportId);
        if (reportToBookmark) {
          return [...prev, { id: reportId, title: reportToBookmark.title }];
        }
        // Fallback if not in history (e.g., currently displayed but not saved yet)
        if (reportId === activeReportId) {
           return [...prev, { id: reportId, title: reportTitle }];
        }
        return prev; // Should not happen if called correctly
      }
    });
  }

  // Handle feedback
  function handleFeedback(reportId, feedbackType) {
    setReportFeedback(prev => ({
      ...prev,
      [reportId]: feedbackType
    }));
    // Here you would typically send this feedback to your backend/analytics
    console.log(`Feedback for report ${reportId}: ${feedbackType}`);
  }

  // Filtered history based on search term
  const filteredHistory = useMemo(() => {
    if (!searchTerm) return reportHistory;
    return reportHistory.filter(report => 
      report.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportHistory, searchTerm]);

  // --- JSX Structure --- 
  return (
    <div className="modern-report-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1><FaRegFileAlt /> {responseLanguage === 'ar' ? 'لوحة تحكم التقارير الحديثة' : 'Modern Report Dashboard'}</h1>
          <div className="header-actions">
            {/* Add language toggle or other actions if needed */}
             <select 
                value={responseLanguage}
                onChange={(e) => setResponseLanguage(e.target.value)}
                style={{ /* Basic styling for select */
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white', 
                    border: '1px solid rgba(255, 255, 255, 0.3)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                }}
             >
                <option value="en">English</option>
                <option value="ar">العربية</option>
             </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Report History Section */}
          <section className="sidebar-section">
            <h3><FaHistory /> {responseLanguage === 'ar' ? 'سجل التقارير' : 'Report History'}</h3>
            <div className="search-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input 
                  type="text"
                  placeholder={responseLanguage === 'ar' ? 'ابحث في السجل...' : 'Search history...'}
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm('')} title={responseLanguage === 'ar' ? 'مسح البحث' : 'Clear search'}>
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
                    className={`history-item ${report.id === activeReportId ? 'active' : ''}`}
                    onClick={() => loadReportFromHistory(report)}
                  >
                    <FaFileAlt className="history-icon" />
                    <div className="history-item-details">
                      <h4>{report.title}</h4>
                      <span>{report.date}</span>
                    </div>
                    <div className="history-item-actions">
                      <button 
                         className={`bookmark-button ${bookmarkedReports.some(b => b.id === report.id) ? 'bookmarked' : ''}`}
                         onClick={(e) => { e.stopPropagation(); toggleBookmark(report.id, report.title); }}
                         title={responseLanguage === 'ar' ? 'إشارة مرجعية' : 'Bookmark'}
                      >
                        <FaBookmark />
                      </button>
                      {/* <button className="view-button" title="View"><FaEye /></button> */}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-history">{responseLanguage === 'ar' ? 'لا يوجد سجل تقارير حتى الآن.' : 'No report history yet.'}</p>
              )}
            </div>
          </section>

          {/* Bookmarked Reports Section */}
          {bookmarkedReports.length > 0 && (
            <section className="sidebar-section">
               <h3><FaBookmark /> {responseLanguage === 'ar' ? 'التقارير المرجعية' : 'Bookmarked Reports'}</h3>
               <div className="bookmarked-section">
                 {/* <h4><FaBookmark /> Bookmarked</h4> */} 
                 <div className="bookmarked-list">
                   {bookmarkedReports.map(bookmark => (
                     <div 
                       key={bookmark.id} 
                       className="bookmarked-item" 
                       onClick={() => {
                         const report = reportHistory.find(r => r.id === bookmark.id);
                         if (report) loadReportFromHistory(report);
                       }}
                     >
                       <FaFileAlt />
                       <span>{bookmark.title}</span>
                     </div>
                   ))}
                 </div>
               </div>
            </section>
          )}
        </aside>

        {/* Main Panel */}
        <main className="dashboard-main">
          {/* Filter Panel */}
          <section className="filter-panel">
            <h2><FaFilter /> {responseLanguage === 'ar' ? 'تصفية البيانات' : 'Filter Data'}</h2>
            <div className="filter-controls">
              <div className="filter-group">
                <label htmlFor="dateType"><FaCalendarAlt /> {responseLanguage === 'ar' ? 'نوع التاريخ' : 'Date Type'}</label>
                <select id="dateType" value={dateType} onChange={(e) => setDateType(e.target.value)}>
                  <option value="month">{responseLanguage === 'ar' ? 'شهري' : 'Month'}</option>
                  <option value="year">{responseLanguage === 'ar' ? 'سنوي' : 'Year'}</option>
                  <option value="full">{responseLanguage === 'ar' ? 'يوم محدد' : 'Specific Day'}</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="filterDate"><FaCalendarAlt /> {responseLanguage === 'ar' ? 'التاريخ المحدد' : 'Select Date'}</label>
                <input 
                  type={dateType === 'month' ? 'month' : (dateType === 'year' ? 'number' : 'date')}
                  id="filterDate"
                  value={dateType === 'month' ? filterDate.toISOString().substring(0, 7) : (dateType === 'year' ? filterDate.getFullYear() : filterDate.toISOString().substring(0, 10))}
                  onChange={(e) => {
                      if (dateType === 'year') {
                          const year = parseInt(e.target.value, 10);
                          if (!isNaN(year)) {
                              setFilterDate(new Date(year, 0, 1)); // Set to Jan 1st of the year
                          }
                      } else {
                          setFilterDate(new Date(e.target.value + (dateType === 'month' ? '-01T00:00:00Z' : 'T00:00:00Z'))); // Adjust for month/date input
                      }
                  }}
                  // Add min/max for year input if desired
                  {...(dateType === 'year' ? { placeholder: 'YYYY', min: '1970', max: new Date().getFullYear() + 5 } : {})}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="filterType"><FaListUl /> {responseLanguage === 'ar' ? 'نوع الفئة' : 'Category Type'}</label>
                <select id="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="All">{responseLanguage === 'ar' ? 'الكل' : 'All'}</option>
                  {/* Dynamically populate types from data if possible */}
                  {/* Example: */} 
                  {[...new Set(budgetItems.map(item => item.CategoriesId?.categoryType))]
                    .filter(Boolean) // Remove null/undefined types
                    .map(type => <option key={type} value={type}>{type}</option>)
                  }
                </select>
              </div>
              <button 
                className="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || loadingBudget}
              >
                {isGeneratingReport ? <FaSpinner className="fa-spin" /> : <FaRegFileAlt />}
                {isGeneratingReport ? (responseLanguage === 'ar' ? 'جاري الإنشاء...' : 'Generating...') : (responseLanguage === 'ar' ? 'إنشاء التقرير' : 'Generate Report')}
              </button>
            </div>
          </section>

          {/* Report Display */}
          <section className="report-display">
            <header className="report-header">
              <h2>{reportTitle || (responseLanguage === 'ar' ? 'عرض التقرير' : 'Report View')}</h2>
              {reportContent && !reportError && (
                <div className="report-actions">
                  <button onClick={handlePrintReport} title={responseLanguage === 'ar' ? 'طباعة' : 'Print'}><FaPrint /></button>
                  <button onClick={handleDownloadReport} title={responseLanguage === 'ar' ? 'تنزيل PDF' : 'Download PDF'}><FaDownload /></button>
                  {/* <button onClick={handleExportToExcel} title="Export Excel"><FaFileExcel /></button> */}
                  <button onClick={handleShareReport} title={responseLanguage === 'ar' ? 'مشاركة' : 'Share'}><FaShare /></button>
                </div>
              )}
            </header>

            {/* Conditional Rendering for Loading, Error, Empty, Content */} 
            {isGeneratingReport ? (
              <div className="report-loading">
                <FaSpinner className="fa-spin" />
                <p>{responseLanguage === 'ar' ? 'جاري إنشاء التقرير، يرجى الانتظار...' : 'Generating report, please wait...'}</p>
              </div>
            ) : reportError ? (
              <div className="report-error">
                <FaExclamationTriangle />
                <p>{reportError}</p>
                {/* Optionally add a retry button */}
                {/* <button onClick={handleGenerateReport}>Retry</button> */} 
              </div>
            ) : reportContent ? (
              <> 
                {/* Feedback Section (Only if content exists) */}
                <div className="report-feedback">
                  <span className="feedback-question">{responseLanguage === 'ar' ? 'هل كان هذا التقرير مفيدًا؟' : 'Was this report helpful?'}</span>
                  <div className="feedback-buttons">
                    <button 
                      className={`feedback-button ${reportFeedback[activeReportId] === 'helpful' ? 'active' : ''}`}
                      onClick={() => handleFeedback(activeReportId, 'helpful')}
                    >
                      <FaThumbsUp /> {responseLanguage === 'ar' ? 'مفيد' : 'Helpful'}
                    </button>
                    <button 
                      className={`feedback-button ${reportFeedback[activeReportId] === 'not_helpful' ? 'active' : ''}`}
                      onClick={() => handleFeedback(activeReportId, 'not_helpful')}
                    >
                      <FaThumbsDown /> {responseLanguage === 'ar' ? 'غير مفيد' : 'Not Helpful'}
                    </button>
                  </div>
                  <div className="report-tags">
                    {/* Add relevant tags if available/generated */}
                    {/* <FaTag /> <span className="tag">Monthly</span> <span className="tag">Expenses</span> */} 
                  </div>
                  <button 
                     className={`bookmark-button-large ${bookmarkedReports.some(b => b.id === activeReportId) ? 'bookmarked' : ''}`}
                     onClick={() => toggleBookmark(activeReportId, reportTitle)}
                     title={responseLanguage === 'ar' ? 'إشارة مرجعية' : 'Bookmark'}
                  >
                    <FaBookmark /> {bookmarkedReports.some(b => b.id === activeReportId) ? (responseLanguage === 'ar' ? 'تم الحفظ' : 'Bookmarked') : (responseLanguage === 'ar' ? 'حفظ مرجعي' : 'Bookmark')}
                  </button>
                </div>
                {/* Report Content Area */}
                <div className="report-content" ref={reportContentRef}>
                  <ReactMarkdown
                    children={reportContent}
                    remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown (tables, etc.)
                    components={markdownComponents} // Use custom components for styling
                  />
                </div>
              </>
            ) : (
              // Initial/Empty State
              <div className="empty-report-state">
                <FaInfoCircle className="empty-icon" />
                <h3>{responseLanguage === 'ar' ? 'جاهز لإنشاء تقريرك' : 'Ready to Generate Your Report'}</h3>
                <p>{responseLanguage === 'ar' ? 'حدد الفلاتر أعلاه وانقر على 
