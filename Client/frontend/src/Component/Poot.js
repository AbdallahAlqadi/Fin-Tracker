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
      `**مهم جداً: يرجى الالتزام الصارم بالتنسيق والهيكل المطلوبين أدناه لضمان الوضوح والفائدة.**

الرجاء إنشاء تقرير مالي احترافي ومفصل باللغة العربية، مع التركيز على تقديم رؤى قابلة للتنفيذ وحلول عملية بناءً على بيانات الميزانية المرفقة. استخدم تنسيق Markdown بشكل فعال لجعله جذابًا وسهل القراءة. يجب أن يتضمن التقرير الأقسام التالية بالترتيب:

1.  **📊 عنوان رئيسي واضح للتقرير:** يعكس بدقة محتوى التقرير والفترة الزمنية (مثال: "التحليل المالي المفصل لـ [نوع الفلتر] لشهر [الشهر] [السنة] 📈" أو "ملخص الأداء المالي السنوي لـ [السنة] 🗓️").

2.  **✨ ملخص تنفيذي (مقدمة):** فقرة موجزة (3-4 جمل) تسلط الضوء على أهم النتائج والاستنتاجات الرئيسية في التقرير والفترة التي يغطيها.

3.  **🔍 تحليل مفصل وعرض جدولي:**
    *   **أولاً: عرض البيانات في جداول:**
        *   إذا كانت هناك بيانات **إيرادات (Income)**، قم بإنشاء **جدول Markdown** لها بعنوان "💰 جدول الإيرادات". يجب أن يحتوي الجدول على عمودين: **الفئة** و **المبلغ**. أضف صفًا للإجمالي في نهاية الجدول.
        *   إذا كانت هناك بيانات **مصروفات (Expense)**، قم بإنشاء **جدول Markdown** منفصل لها بعنوان "💸 جدول المصروفات". يجب أن يحتوي الجدول على عمودين: **الفئة** و **المبلغ**. أضف صفًا للإجمالي في نهاية الجدول.
        *   مثال للجدول:
            | الفئة          | المبلغ |
            | -------------- | ------: |
            | فئة الدخل 1   | 1500   |
            | فئة الدخل 2   | 2000   |
            | **الإجمالي** | **3500** |
    *   **ثانياً: تحليل نصي موجز:**
        *   بعد الجداول، قدم تحليلاً نصيًا موجزًا للأداء العام (فقرة أو اثنتين). سلط الضوء على أهم الفئات (الأكبر مبلغًا، أو ذات التغير الملحوظ إن أمكن المقارنة).
        *   **للتقارير الشهرية:** ركز على مقارنة أداء الشهر الحالي بالشهر السابق (إذا كانت البيانات تسمح بذلك ضمنيًا) أو أبرز النقاط الرئيسية للشهر.
        *   **للتقارير السنوية:** قدم نظرة عامة على أداء الفئات على مدار العام.

4.  **🎯 أهم الرؤى والاستنتاجات:**
    *   قسم مخصص بعنوان "🎯 أهم الرؤى والاستنتاجات".
    *   استخدم قائمة نقطية (bullet points) لتقديم 3-5 رؤى واضحة ومحددة مستمدة *مباشرة* من تحليل البيانات والجداول المقدمة. تجنب التعميمات.
    *   مثال: "•️⃣ شكلت [اسم الفئة] النسبة الأكبر من المصروفات هذا الشهر بقيمة [المبلغ]."

5.  **💡 توصيات وحلول عملية:**
    *   قسم مخصص بعنوان "💡 توصيات وحلول عملية".
    *   قدم 2-4 توصيات **محددة جداً، قابلة للتطبيق فوراً، ومرتبطة بشكل مباشر** بالرؤى المذكورة في القسم السابق أو بملاحظات محددة من الجداول. **يجب أن تكون كل توصية نتيجة مباشرة لتحليل البيانات المقدمة.**
    *   **تجنب تماماً النصائح العامة أو البديهية.** ركز على خطوات عملية يمكن للمستخدم اتخاذها.
    *   اذكر بوضوح **لماذا** هذه التوصية مهمة (اربطها بالرؤية/البيانات) و **ما هو الإجراء المقترح** بشكل ملموس.
    *   مثال: "1. **الرؤية المرتبطة:** شكلت مصروفات [اسم الفئة] نسبة X% من الإجمالي. **التوصية:** قم بمراجعة تفصيلية لفواتير [اسم الفئة] للشهر الماضي لتحديد البنود غير الضرورية التي يمكن إلغاؤها أو تقليلها، بهدف خفض هذا البند بنسبة Y% الشهر القادم."
    *   مثال آخر: "2. **الرؤية المرتبطة:** انخفاض إيرادات [اسم الفئة] مقارنة بـ [فترة سابقة/متوسط]. **التوصية:** تحليل أسباب انخفاض إيرادات [اسم الفئة] عبر [إجراء محدد، مثلاً: التواصل مع العملاء الرئيسيين/مراجعة استراتيجية التسعير] واقتراح خطة لمعالجة ذلك خلال الأسبوعين القادمين."

6.  **🏁 خاتمة:**
    *   فقرة قصيرة تلخص النقاط الرئيسية وتؤكد على أهمية متابعة التوصيات.

**تنسيق إضافي:**
*   استخدم **النص الغامق** للعناوين الرئيسية والفرعية والمصطلحات الهامة.
*   استخدم الرموز التعبيرية (emojis) بشكل مناسب لزيادة الجاذبية البصرية ولكن باعتدال.
*   تأكد من وجود فواصل واضحة بين الأقسام باستخدام سطور فارغة.
*   **مهم للتقارير الشهرية:** تأكد من أن التقرير يعكس ملخصًا واضحًا للشهر المحدد، وأن الجداول والتوصيات تركز على بيانات الشهر.
` :
      `**Very Important: Please strictly adhere to the requested format and structure below to ensure clarity and usefulness.**

Please generate a professional and detailed financial report in English, focusing on actionable insights and practical solutions based on the provided budget data. Use Markdown formatting effectively for visual appeal and readability. The report must include the following sections in order:

1.  **📊 Clear Main Report Title:** Accurately reflecting the report's content and time period (e.g., "Detailed Financial Analysis for [Filter Type] for [Month] [Year] 📈" or "Annual Financial Performance Summary for [Year] 🗓️").

2.  **✨ Executive Summary (Introduction):** A concise paragraph (3-4 sentences) highlighting the most critical findings and key takeaways from the report and the period covered.

3.  **🔍 Detailed Analysis and Tabular Display:**
    *   **First: Display Data in Tables:**
        *   If **Income** data exists, create a **Markdown table** for it titled "💰 Income Table". The table should have two columns: **Category** and **Amount**. Add a total row at the bottom.
        *   If **Expense** data exists, create a separate **Markdown table** for it titled "💸 Expense Table". The table should have two columns: **Category** and **Amount**. Add a total row at the bottom.
        *   Example Table:
            | Category      | Amount |
            | ------------- | -----: |
            | Income Cat 1  | 1500   |
            | Income Cat 2  | 2000   |
            | **Total**     | **3500** |
    *   **Second: Brief Textual Analysis:**
        *   Following the tables, provide a brief textual analysis of the overall performance (1-2 paragraphs). Highlight the most significant categories (largest amounts, or notable changes if comparison is possible).
        *   **For Monthly Reports:** Focus on comparing the current month's performance to the previous month (if implicitly possible from data) or highlight key points for the month.
        *   **For Yearly Reports:** Provide an overview of category performance throughout the year.

4.  **🎯 Key Insights and Conclusions:**
    *   A dedicated section titled "🎯 Key Insights and Conclusions".
    *   Use bullet points to present 3-5 clear, specific insights derived *directly* from the analysis of the provided data and tables. Avoid generalizations.
    *   Example: "•️⃣ [Category Name] constituted the largest portion of expenses this month at [Amount]."

5.  **💡 Practical Recommendations and Solutions:**
    *   A dedicated section titled "💡 Practical Recommendations and Solutions".
    *   Provide 2-4 recommendations that are **extremely specific, immediately actionable, and directly linked** to the insights mentioned in the previous section or specific observations from the tables. **Each recommendation must be a direct consequence of analyzing the provided data.**
    *   **Strictly avoid generic or obvious advice.** Focus on practical steps the user can take.
    *   Clearly state **why** the recommendation is important (link to insight/data) and **what the proposed action** is concretely.
    *   Example: "1. **Linked Insight:** Expenses in [Category Name] constituted X% of the total. **Recommendation:** Conduct a detailed review of last month's invoices for [Category Name] to identify non-essential items that can be eliminated or reduced, aiming for a Y% reduction in this category next month."
    *   Another Example: "2. **Linked Insight:** Revenue from [Category Name] decreased compared to [previous period/average]. **Recommendation:** Analyze the reasons for the revenue drop in [Category Name] by [specific action, e.g., contacting key clients/reviewing pricing strategy] and propose a plan to address it within the next two weeks."

6.  **🏁 Conclusion:**
    *   A brief paragraph summarizing the main points and emphasizing the importance of following up on recommendations.

**Additional Formatting:**
*   Use **bold text** for main and subheadings and important terms.
*   Use emojis appropriately to enhance visual appeal, but sparingly.
*   Ensure clear separation between sections using blank lines.
*   **Important for Monthly Reports:** Ensure the report reflects a clear summary for the specific month, with tables and recommendations focused on that month's data.
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
