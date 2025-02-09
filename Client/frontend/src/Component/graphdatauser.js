import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { styled } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as d3 from "d3";
import { schemeSet3, schemeTableau10 } from "d3-scale-chromatic";

// تعريف مكوّن لتنسيق الصورة بحيث تكون بأبعاد ثابتة وتغطي الحاوية
const StyledImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

// تعديل ImageContainer ليحتوي على خصائص Flex-center لضمان تمركز الصورة
const ImageContainer = styled("div")({
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  overflow: "hidden",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  marginBottom: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e0e0e0",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  background: "linear-gradient(145deg, #ffffff, #f9f9f9)",
  width: "200px",
  height: "250px",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    borderColor: "#007BFF",
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#007BFF",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0056b3",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#007BFF",
    borderWidth: "2px",
  },
}));

const Graph = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState("Revenues"); // افتراضيًا الإيرادات
  const [dateType, setDateType] = useState("month");
  const svgRef = useRef();

  // إنشاء مقياس لوني باستخدام أكثر من 40 لونًا مختلفًا
  const colorScale = d3.scaleOrdinal([...schemeSet3, ...schemeTableau10]);

  useEffect(() => {
    fetchBudget();
  }, []);

  const token = sessionStorage.getItem("jwt");

  const fetchBudget = async () => {
    try {
      const response = await axios.get("https://fin-tracker-ncbx.onrender.com/api/getUserBudget", {
        headers: {
          Auth: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setBudgetItems(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching budget", error);
      setLoading(false);
    }
  };

  // تجميع العناصر حسب التصنيف والتاريخ مع التأكد من وجود البيانات
  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const categoryName = item.CategoriesId?.categoryName || "Unknown";
      const date = new Date(item.date);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`; // تنسيق التاريخ بصيغة DD/MM/YYYY
      const key = `${categoryName}-${formattedDate}`; // مفتاح فريد لكل مجموعة من التصنيف والتاريخ
      if (!acc[key]) {
        acc[key] = { ...item, valueitem: 0 };
      }
      acc[key].valueitem += parseFloat(item.valueitem);
      return acc;
    }, {});
  };

  const filterItems = (items) => {
    let filteredItems = items;

    if (filterDate) {
      const selectedDate = new Date(filterDate);
      filteredItems = filteredItems.filter((item) => {
        const itemDate = new Date(item.date);
        if (dateType === "month") {
          return (
            selectedDate.getMonth() === itemDate.getMonth() &&
            selectedDate.getFullYear() === itemDate.getFullYear()
          );
        } else if (dateType === "year") {
          return selectedDate.getFullYear() === itemDate.getFullYear();
        } else {
          const formattedSelectedDate = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
          const formattedItemDate = `${itemDate.getDate()}/${itemDate.getMonth() + 1}/${itemDate.getFullYear()}`;
          return formattedSelectedDate === formattedItemDate;
        }
      });
    }

    // التصفية حسب النوع (إيرادات أو مصروفات)
    if (filterType !== "All") {
      filteredItems = filteredItems.filter(
        (item) => item.CategoriesId?.categoryType === filterType
      );
    }

    return Object.values(groupByCategory(filteredItems));
  };

  const calculateTotals = (items) => {
    const totals = { Revenues: 0, Expenses: 0 };

    items.forEach((item) => {
      const value = parseFloat(item.valueitem);
      if (item.CategoriesId?.categoryType === "Revenues") {
        totals.Revenues += value;
      } else if (item.CategoriesId?.categoryType === "Expenses") {
        totals.Expenses += value;
      }
    });

    return totals;
  };

  const filteredItems = filterItems(budgetItems);
  const totals = calculateTotals(filteredItems);
  const balance = totals.Revenues - totals.Expenses;

  useEffect(() => {
    if (filteredItems.length > 0) {
      drawPieChart(filteredItems);
    }
  }, [filteredItems]);

  const drawPieChart = (data) => {
    // تعديل الأبعاد لتكبير الرسم البياني
    const width = 700;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 50;

    // إزالة المحتوى السابق داخل الـ SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // إنشاء تلميح (tooltip) إذا لم يكن موجودًا مسبقاً
    let tooltip = d3.select("#tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("text-align", "center")
        .style("padding", "8px")
        .style("background", "rgba(0, 0, 0, 0.6)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);
    }

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie()
      .value((d) => parseFloat(d.valueitem))
      .sort(null);

    // إنشاء مخطط دونات (donut chart)
    const arc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    // تكبير الشريحة عند المرور بالفأرة
    const arcHover = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius + 10);

    const arcs = svg
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => colorScale(i))
      .attr("stroke", "#fff")
      .style("stroke-width", "2px")
      .each(function (d) {
        this._current = d;
      })
      .on("mouseover", function (event, d) {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(
            `${d.data.CategoriesId?.categoryName || "Unknown"}: ${parseFloat(
              d.data.valueitem
            ).toFixed(2)}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover);
      })
      .on("mousemove", function (event, d) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function (event, d) {
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc);
      })
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        let i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(i(t));
        };
      });

    // إضافة نص في منتصف المخطط لإظهار الإجمالي
    const totalValue = d3.sum(data, (d) => parseFloat(d.valueitem));
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text(totalValue.toFixed(2));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: 4, background: "#f5f5f5", minHeight: "100vh" }}>
        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Date Type</InputLabel>
            <StyledSelect value={dateType} onChange={(e) => setDateType(e.target.value)}>
              <MenuItem value="full">Full Date</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </StyledSelect>
          </FormControl>
          <DatePicker
            label={
              dateType === "month"
                ? "Select Month"
                : dateType === "year"
                ? "Select Year"
                : "Select Date"
            }
            views={
              dateType === "month"
                ? ["year", "month"]
                : dateType === "year"
                ? ["year"]
                : ["year", "month", "day"]
            }
            value={filterDate}
            onChange={(newValue) => setFilterDate(newValue)}
            renderInput={(params) => <TextField {...params} sx={{ minWidth: 180 }} />}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <StyledSelect value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="Revenues">Revenues</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </StyledSelect>
          </FormControl>
        </Box>

        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 4 }}>
          <Card sx={{ minWidth: 200, textAlign: "center", background: "#4CAF50", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Revenues
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totals.Revenues.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200, textAlign: "center", background: "#F44336", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totals.Expenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              minWidth: 200,
              textAlign: "center",
              background: balance >= 0 ? "#4CAF50" : "#F44336",
              color: "#fff",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {balance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress size={60} />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <Typography variant="h4" color="textSecondary">
              No Items
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <svg ref={svgRef}></svg>
              <List sx={{ marginLeft: "20px", width: "300px", marginTop: "120px" }}>
                {filteredItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: colorScale(index),
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.CategoriesId?.categoryName || "Unknown"} (${(
                        (item.valueitem / d3.sum(filteredItems.map((i) => i.valueitem))) *
                        100
                      ).toFixed(2)}%)`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Grid container spacing={3} justifyContent="center">
              {filteredItems.map((item, index) => (
                <Grid item key={index}>
                  <StyledCard>
                    <ImageContainer>
                      <StyledImage
                        src={`https://fin-tracker-ncbx.onrender.com/${
                          item.CategoriesId?.image || "fallback-image.png"
                        }`}
                        alt="Category"
                      />
                    </ImageContainer>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#007BFF" }}>
                        {item.CategoriesId?.categoryName || "Unknown"}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: item.CategoriesId?.categoryType === "Revenues" ? "#4CAF50" : "#F44336",
                        }}
                      >
                        {item.CategoriesId?.categoryType === "Expenses"
                          ? `-${item.valueitem}`
                          : item.valueitem}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        {item.CategoriesId?.categoryType &&
                        totals[item.CategoriesId.categoryType]
                          ? ((item.valueitem / totals[item.CategoriesId.categoryType]) * 100).toFixed(2)
                          : "0.00"}
                        %
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        Date: {new Date(item.date).toLocaleDateString("en-GB")}
                      </Typography>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Graph;
