import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Box,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Select,
  Checkbox,
  Grid,
} from "@mui/material";
import { styled } from "@mui/system";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import * as d3 from "d3";
import "../cssStyle/comparsion.css";

// مكون Select مُخصص مع تحسينات تصميم
const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.dark,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    borderWidth: "2px",
  },
}));

// مكون Checkbox مُخصص لتحسين التصميم مع حجم مناسب واستجابة
const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.primary.main,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 24, // حجم ثابت ومناسب للأيقونة
  },
}));

// مكون Radio مُخصص لتحسين التصميم
const StyledRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.primary.main,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

const Comparison = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [dateType, setDateType] = useState("year");
  const [chartType, setChartType] = useState("bar");
  const [showRevenues, setShowRevenues] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    fetchBudget();
  }, []);

  const token = sessionStorage.getItem("jwt");

  // جلب البيانات من الخادم
  const fetchBudget = async () => {
    try {
      const response = await axios.get(
        "https://fin-tracker-ncbx.onrender.com/api/getUserBudget",
        {
          headers: {
            Auth: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setBudgetItems(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching budget", error);
      setLoading(false);
    }
  };

  // تجميع البيانات بحسب التاريخ مع التحقق من وجود بيانات CategoriesId
  const groupByDate = (items) => {
    const groupedData = {};
    items.forEach((item) => {
      if (!item.CategoriesId || !item.CategoriesId.categoryType) return;
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const categoryType = item.CategoriesId.categoryType;
      let key;
      if (dateType === "year") {
        key = year;
      } else if (dateType === "month") {
        key = `${year}-${month}`;
      } else if (dateType === "day") {
        key = `${year}-${month}-${day}`;
      }
      if (!groupedData[key]) {
        groupedData[key] = { Revenues: 0, Expenses: 0 };
      }
      groupedData[key][categoryType] += parseFloat(item.valueitem);
    });
    // ترتيب المفاتيح بحيث يكون الأحدث أولاً
    const sortedKeys = Object.keys(groupedData).sort(
      (a, b) => new Date(b) - new Date(a)
    );
    const sortedData = {};
    sortedKeys.forEach((key) => {
      sortedData[key] = groupedData[key];
    });
    return sortedData;
  };

  // تصفية البيانات بناءً على اختيارات المستخدم للتاريخ
  const filterItems = (items) => {
    let filteredItems = items.filter(
      (item) => item.CategoriesId && item.CategoriesId.categoryType
    );

    if (dateType === "year" && selectedYear.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const year = new Date(item.date).getFullYear();
        return selectedYear.includes(year);
      });
    } else if (
      dateType === "month" &&
      selectedYear.length > 0 &&
      selectedMonths.length > 0
    ) {
      filteredItems = filteredItems.filter((item) => {
        const date = new Date(item.date);
        return (
          selectedYear.includes(date.getFullYear()) &&
          selectedMonths.includes(date.getMonth() + 1)
        );
      });
    } else if (
      dateType === "day" &&
      selectedYear.length > 0 &&
      selectedMonths.length > 0 &&
      selectedDays.length > 0
    ) {
      filteredItems = filteredItems.filter((item) => {
        const date = new Date(item.date);
        const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        return (
          selectedYear.includes(date.getFullYear()) &&
          selectedMonths.includes(date.getMonth() + 1) &&
          selectedDays.includes(dayKey)
        );
      });
    }
    const groupedData = groupByDate(filteredItems);
    const result = {};
    Object.keys(groupedData).forEach((key) => {
      result[key] = {};
      if (showRevenues) result[key].Revenues = groupedData[key].Revenues || 0;
      if (showExpenses) result[key].Expenses = groupedData[key].Expenses || 0;
    });
    return result;
  };

  const filteredItems = filterItems(budgetItems);

  // إعادة رسم الرسم البياني عند تغيير البيانات أو نوع الرسم أو ظهور الأصناف
  useEffect(() => {
    if (Object.keys(filteredItems).length > 0) {
      if (chartType === "bar") {
        drawBarChart(filteredItems);
      } else if (chartType === "line") {
        drawLineChart(filteredItems);
      }
    } else {
      d3.select(svgRef.current).selectAll("*").remove();
    }
  }, [filteredItems, chartType, showRevenues, showExpenses]);

  // دالة رسم الرسم البياني الشريطي (Bar Chart)
  const drawBarChart = (data) => {
    const width = 900;
    const height = 500;
    const margin = { top: 80, right: 100, bottom: 90, left: 80 };

    d3.select(svgRef.current).selectAll("*").remove();

    // استخدام viewBox لجعل الرسم متجاوباً
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // إضافة تدرج خلفية حديث
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "chartGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#f5f7fa");
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#c3cfe2");

    // إضافة تأثير ظل للنصوص (عنوان)
    const titleShadow = defs.append("filter").attr("id", "titleShadow");
    titleShadow
      .append("feDropShadow")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("stdDeviation", 3)
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.3);

    // تأثير ظل للوسيلة الإيضاح (Legend)
    const legendShadow = defs.append("filter").attr("id", "legendShadow");
    legendShadow
      .append("feDropShadow")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("stdDeviation", 2)
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.2);

    // تأثير ظل حديث للأعمدة
    const filter = defs
      .append("filter")
      .attr("id", "dropShadow")
      .attr("height", "130%");
    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "blur");
    filter
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // مجموعة الرسم الأساسية مع خلفية ذات حواف دائرية
    const chartGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    chartGroup
      .append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "url(#chartGradient)")
      .attr("rx", 10)
      .attr("ry", 10);

    const dates = Object.keys(data);
    const categories = [];
    if (showRevenues) categories.push("Revenues");
    if (showExpenses) categories.push("Expenses");

    const colorMapping = {
      Revenues: "#2ecc71",
      Expenses: "#e74c3c",
    };

    const x0 = d3.scaleBand().domain(dates).range([0, chartWidth]).padding(0.2);

    const x1 = d3
      .scaleBand()
      .domain(categories)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const maxVal = d3.max(Object.values(data), (d) =>
      d3.max(categories.map((cat) => d[cat] || 0))
    );
    const y = d3.scaleLinear().domain([0, maxVal]).nice().range([chartHeight, 0]);

    const color = d3
      .scaleOrdinal()
      .domain(categories)
      .range(categories.map((cat) => colorMapping[cat]));

    // خطوط شبكة خفيفة للمحور الرأسي
    chartGroup
      .append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-chartWidth).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-dasharray", "3 3");

    const barGroups = chartGroup
      .selectAll(".bar-group")
      .data(dates)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", (d) => `translate(${x0(d)},0)`);

    barGroups
      .selectAll("rect")
      .data((d) =>
        categories.map((cat) => ({ category: cat, value: data[d][cat] || 0 }))
      )
      .enter()
      .append("rect")
      .attr("x", (d) => x1(d.category))
      .attr("y", chartHeight)
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("fill", (d) => color(d.category))
      .attr("rx", 5) // إضافة حواف دائرية للأعمدة
      .attr("ry", 5)
      .attr("filter", "url(#dropShadow)")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.8);
        d3.select(tooltipRef.current)
          .style("opacity", 1)
          .html(`<strong>${d.category}</strong>: ${d.value}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        d3.select(tooltipRef.current).style("opacity", 0);
      })
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => chartHeight - y(d.value));

    // رسم المحور الأفقي مع تدوير النصوص
    const xAxis = d3.axisBottom(x0).tickSize(0).tickPadding(10);

    chartGroup
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#616161")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // رسم المحور الرأسي
    const yAxis = d3.axisLeft(y).ticks(6).tickSize(0).tickPadding(10);

    chartGroup
      .append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#616161")
      .style("font-size", "14px")
      .style("font-weight", "500");
    chartGroup.selectAll(".domain").attr("stroke", "#e0e0e0");

    // عنوان الرسم البياني مع تأثير ظل للنص
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "28px")
      .style("font-family", "sans-serif")
      .style("fill", "#424242")
      .style("font-weight", "bold")
      .attr("filter", "url(#titleShadow)")
      .text("Budget Comparison");

    // إضافة وتنسيق وسيلة الإيضاح (Legend)
    const legendGap = 20;
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${margin.top - 60 - legendGap})`
      );
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 130)
      .attr("height", categories.length * 30 + 10)
      .attr("fill", "#f9f9f9")
      .attr("stroke", "#ccc")
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("filter", "url(#legendShadow)");

    categories.forEach((cat, i) => {
      legend
        .append("rect")
        .attr("x", 10)
        .attr("y", i * 30 + 5)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", colorMapping[cat]);
      legend
        .append("text")
        .attr("x", 40)
        .attr("y", i * 30 + 20)
        .text(cat)
        .style("font-size", "16px")
        .style("fill", "#424242")
        .style("font-weight", "500");
    });
  };

  // دالة رسم الرسم البياني الخطي (Line Chart)
  const drawLineChart = (data) => {
    const width = 900;
    const height = 500;
    const margin = { top: 80, right: 100, bottom: 90, left: 80 };

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const defs = svg.append("defs");
    // تدرج خلفية الرسم البياني
    const bgGradient = defs
      .append("linearGradient")
      .attr("id", "lineChartGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    bgGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#f5f7fa");
    bgGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#c3cfe2");

    // إضافة تأثير ظل للنصوص (عنوان)
    const titleShadow = defs.append("filter").attr("id", "titleShadow");
    titleShadow
      .append("feDropShadow")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("stdDeviation", 3)
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.3);

    // تأثير ظل للوسيلة الإيضاح (Legend)
    const legendShadow = defs.append("filter").attr("id", "legendShadow");
    legendShadow
      .append("feDropShadow")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("stdDeviation", 2)
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.2);

    const chartGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    chartGroup
      .append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "url(#lineChartGradient)")
      .attr("rx", 10)
      .attr("ry", 10);

    const dates = Object.keys(data);
    const categories = [];
    if (showRevenues) categories.push("Revenues");
    if (showExpenses) categories.push("Expenses");

    const colorMapping = {
      Revenues: "#2ecc71",
      Expenses: "#e74c3c",
    };

    const x = d3
      .scalePoint()
      .domain(dates)
      .range([0, chartWidth])
      .padding(0.5);

    const maxVal = d3.max(Object.values(data), (d) =>
      d3.max(categories.map((cat) => d[cat] || 0))
    );
    const y = d3.scaleLinear().domain([0, maxVal]).nice().range([chartHeight, 0]);

    const color = d3
      .scaleOrdinal()
      .domain(categories)
      .range(categories.map((cat) => colorMapping[cat]));

    // خطوط شبكة خفيفة
    chartGroup
      .append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-chartWidth).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-dasharray", "3 3");

    // تأثير ظل حديث للخطوط
    const filter = defs
      .append("filter")
      .attr("id", "lineShadow")
      .attr("height", "130%");
    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "blur");
    filter
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // دالة رسم خط ناعم
    const lineGenerator = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    categories.forEach((category) => {
      const categoryData = dates.map((date) => ({
        date,
        value: data[date][category] || 0,
      }));
      const path = chartGroup
        .append("path")
        .datum(categoryData)
        .attr("fill", "none")
        .attr("stroke", colorMapping[category])
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round")
        .attr("filter", "url(#lineShadow)")
        .attr("d", lineGenerator);
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);
      chartGroup
        .selectAll(`.dot-${category}`)
        .data(categoryData)
        .enter()
        .append("circle")
        .attr("class", `dot-${category}`)
        .attr("cx", (d) => x(d.date))
        .attr("cy", (d) => y(d.value))
        .attr("r", 6)
        .attr("fill", colorMapping[category])
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .on("mouseover", function (event, d) {
          d3.select(this).transition().duration(200).attr("r", 8);
          d3.select(tooltipRef.current)
            .style("opacity", 1)
            .html(`<strong>${category}</strong>: ${d.value}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", function () {
          d3.select(this).transition().duration(200).attr("r", 6);
          d3.select(tooltipRef.current).style("opacity", 0);
        });
    });

    const xAxis = d3.axisBottom(x).tickSize(0).tickPadding(10);
    chartGroup
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#616161")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
    const yAxis = d3.axisLeft(y).ticks(6).tickSize(0).tickPadding(10);
    chartGroup
      .append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#616161")
      .style("font-size", "14px")
      .style("font-weight", "500");
    chartGroup.selectAll(".domain").attr("stroke", "#e0e0e0");

    // عنوان الرسم البياني مع تأثير ظل للنص
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "28px")
      .style("font-family", "sans-serif")
      .style("fill", "#424242")
      .style("font-weight", "bold")
      .attr("filter", "url(#titleShadow)")
      .text("Budget Comparison");

    // إضافة وتنسيق وسيلة الإيضاح (Legend)
    const legendGap = 20;
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${margin.top - 60 - legendGap})`
      );
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 130)
      .attr("height", categories.length * 30 + 10)
      .attr("fill", "#f9f9f9")
      .attr("stroke", "#ccc")
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("filter", "url(#legendShadow)");

    categories.forEach((cat, i) => {
      legend
        .append("rect")
        .attr("x", 10)
        .attr("y", i * 30 + 5)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", colorMapping[cat]);
      legend
        .append("text")
        .attr("x", 40)
        .attr("y", i * 30 + 20)
        .text(cat)
        .style("font-size", "16px")
        .style("fill", "#424242")
        .style("font-weight", "500");
    });
  };

  // المتغيرات الخاصة بالتواريخ المتاحة حسب البيانات
  const availableYears = [
    ...new Set(budgetItems.map((item) => new Date(item.date).getFullYear())),
  ];

  const availableMonths =
    selectedYear.length > 0
      ? [
          ...new Set(
            budgetItems
              .filter(
                (item) =>
                  selectedYear.includes(new Date(item.date).getFullYear())
              )
              .map((item) => new Date(item.date).getMonth() + 1)
          ),
        ]
      : [];

  const availableDays =
    selectedYear.length > 0 && selectedMonths.length > 0
      ? [
          ...new Set(
            budgetItems
              .filter((item) => {
                const date = new Date(item.date);
                return (
                  selectedYear.includes(date.getFullYear()) &&
                  selectedMonths.includes(date.getMonth() + 1)
                );
              })
              .map((item) => {
                const date = new Date(item.date);
                return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
              })
          ),
        ]
      : [];

  const handleYearChange = (year) => {
    setSelectedYear((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
    setSelectedMonths([]);
    setSelectedDays([]);
  };

  const handleMonthChange = (month) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
    setSelectedDays([]);
  };

  const handleDayChange = (day) => {
    setSelectedDays((prevSelectedDays) =>
      prevSelectedDays.includes(day)
        ? prevSelectedDays.filter((d) => d !== day)
        : [...prevSelectedDays, day]
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        id="main-container"
        sx={{
          padding: { xs: 2, md: 3 },
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease",
          maxWidth: "1200px",
          margin: "20px auto",
        }}
      >
        <Box
          id="controls-container"
          sx={{
            marginBottom: 2,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FormControl
            id="date-type-select"
            sx={{
              minWidth: 150,
            }}
          >
            <InputLabel>Date Type</InputLabel>
            <StyledSelect
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              label="Date Type"
            >
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="day">Day</MenuItem>
            </StyledSelect>
          </FormControl>
          <RadioGroup
            row
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            <FormControlLabel
              value="bar"
              control={<StyledRadio />}
              label="Bar Chart"
            />
            <FormControlLabel
              value="line"
              control={<StyledRadio />}
              label="Line Chart"
            />
          </RadioGroup>
          <FormControlLabel
            control={
              <StyledCheckbox
                checked={showRevenues}
                onChange={(e) => setShowRevenues(e.target.checked)}
              />
            }
            label="Show Revenues"
          />
          <FormControlLabel
            control={
              <StyledCheckbox
                checked={showExpenses}
                onChange={(e) => setShowExpenses(e.target.checked)}
              />
            }
            label="Show Expenses"
          />
        </Box>

        <Box id="date-selection-container" sx={{ marginBottom: 2 }}>
          {dateType === "year" && (
            <Grid container spacing={2}>
              {availableYears.map((year) => (
                <Grid item xs={6} sm={4} md={3} key={year}>
                  <FormControlLabel
                    control={
                      <StyledCheckbox
                        checked={selectedYear.includes(year)}
                        onChange={() => handleYearChange(year)}
                      />
                    }
                    label={year}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {dateType === "month" && selectedYear.length > 0 && (
            <Grid container spacing={2}>
              {availableMonths.map((month) => (
                <Grid item xs={6} sm={4} md={3} key={month}>
                  <FormControlLabel
                    control={
                      <StyledCheckbox
                        checked={selectedMonths.includes(month)}
                        onChange={() => handleMonthChange(month)}
                      />
                    }
                    label={`Month ${month}`}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {dateType === "day" &&
            selectedYear.length > 0 &&
            selectedMonths.length > 0 && (
              <Box id="day-selection">
                {availableDays.length > 0 && (
                  <>
                    {Object.entries(
                      availableDays.reduce((acc, day) => {
                        const [year, month] = day.split("-").slice(0, 2);
                        const key = `${year}-${month}`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(day);
                        return acc;
                      }, {})
                    ).map(([key, days]) => {
                      const [year, month] = key.split("-");
                      return (
                        <Box
                          key={key}
                          sx={{
                            marginBottom: 2,
                            padding: 2,
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            backgroundColor: "#f9f9f9",
                          }}
                        >
                          <Typography variant="h6">{`الشهر ${month.padStart(
                            2,
                            "0"
                          )} (${year})`}</Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                            }}
                          >
                            {days.map((day) => (
                              <FormControlLabel
                                key={day}
                                control={
                                  <StyledCheckbox
                                    checked={selectedDays.includes(day)}
                                    onChange={() => handleDayChange(day)}
                                  />
                                }
                                label={day}
                              />
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </>
                )}
              </Box>
            )}
        </Box>

        {loading ? (
          <Box
            id="loading-container"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
            }}
          >
            <CircularProgress size={60} />
          </Box>
        ) : Object.keys(filteredItems).length === 0 ? (
          <Box
            id="no-items-container"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
            }}
          >
            <Typography variant="h4" color="textSecondary">
              No Items
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              id="chart-container"
              sx={{
                width: "100%",
                overflow: "hidden",
                textAlign: "center",
              }}
            >
              <svg
                ref={svgRef}
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "900px",
                  maxHeight: "500px",
                }}
              ></svg>
            </Box>
            <div
              id="tooltip"
              ref={tooltipRef}
              style={{
                position: "absolute",
                opacity: 0,
                background: "#fff",
                border: "1px solid #ccc",
                padding: "8px",
                borderRadius: "8px",
                pointerEvents: "none",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                transition: "opacity 0.3s ease",
              }}
            ></div>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Comparison;