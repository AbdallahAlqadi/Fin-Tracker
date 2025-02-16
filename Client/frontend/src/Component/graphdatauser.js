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

// دالة مساعدة لبناء رابط الصورة بشكل صحيح
const getImageUrl = (image) => {
  if (!image) return "fallback-image.png"; // في حال عدم وجود صورة يمكن استبدالها بصورة بديلة محلياً
  return image.startsWith("data:") ? image : `http://127.0.0.1:5004/${image}`;
};

// صورة متجاوبة داخل الحاوية الدائرية
const StyledImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

// حاوية الصورة بشكل دائري
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

// بطاقة الفئة مع حجم ثابت وتأثير hover
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
  height: "230px", // ارتفاع ثابت بدون سطر التاريخ
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    borderColor: "#007BFF",
  },
}));

// تنسيق قائمة الاختيارات مع تأثيرات مخصصة
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
  const [filterType, setFilterType] = useState("Revenues"); // إفتراضيًا الإيرادات
  const [dateType, setDateType] = useState("month");
  const svgRef = useRef();

  // مقياس لوني باستخدام مجموعة ألوان من d3
  const colorScale = d3.scaleOrdinal([...schemeSet3, ...schemeTableau10]);

  useEffect(() => {
    fetchBudget();
  }, []);

  const token = sessionStorage.getItem("jwt");

  const fetchBudget = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:5004/api/getUserBudget",
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

  // تجميع العناصر حسب التصنيف (دمج العناصر المكررة)
  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const categoryName = item.CategoriesId?.categoryName || "Unknown";
      if (!acc[categoryName]) {
        acc[categoryName] = { ...item, valueitem: 0 };
      }
      acc[categoryName].valueitem += parseFloat(item.valueitem);
      return acc;
    }, {});
  };

  // تصفية العناصر بناءً على التاريخ والنوع
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
          return true;
        }
      });
    }

    if (filterType !== "All") {
      filteredItems = filteredItems.filter(
        (item) => item.CategoriesId?.categoryType === filterType
      );
    }

    return Object.values(groupByCategory(filteredItems));
  };

  // حساب المجاميع الإجمالية لكل نوع
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

  // تحديث الرسم البياني عند تغيير البيانات المفلترة
  useEffect(() => {
    if (filteredItems.length > 0) {
      drawPieChart(filteredItems);
    } else {
      // حذف محتويات SVG في حالة عدم وجود بيانات
      d3.select(svgRef.current).selectAll("*").remove();
    }
  }, [filteredItems]);

  // دالة إنشاء رسم بياني (مخطط دونات) باستخدام d3
  const drawPieChart = (data) => {
    const width = 700;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 50;

    // إعداد عنصر SVG مع viewBox لتجاوب أفضل
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // حذف أي عناصر سابقة داخل الـ SVG
    svg.selectAll("*").remove();

    // إنشاء تلميح (tooltip)
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

    // إنشاء مجموعة (group) مع تموضع مركزي
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie()
      .value((d) => parseFloat(d.valueitem))
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const arcHover = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius + 10);

    const arcs = g
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
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc);
      })
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate(
          { startAngle: 0, endAngle: 0 },
          d
        );
        return function (t) {
          return arc(interpolate(t));
        };
      });

    // إضافة نص في منتصف الرسم لإظهار الإجمالي
    const totalValue = d3.sum(data, (d) => parseFloat(d.valueitem));
    g
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text(totalValue.toFixed(2));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          padding: { xs: 2, sm: 4 },
          background: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        {/* عناصر التصفية */}
        <Box
          sx={{
            marginBottom: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            gap: 2,
            justifyContent: "center",
          }}
        >
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Date Type</InputLabel>
            <StyledSelect
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              label="Date Type"
            >
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
            renderInput={(params) => (
              <TextField {...params} sx={{ minWidth: 180 }} />
            )}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <StyledSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Type"
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Revenues">Revenues</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </StyledSelect>
          </FormControl>
        </Box>

        {/* بطاقات الإجماليات */}
        <Box
          sx={{
            marginBottom: 4,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: { xs: 2, md: 4 },
          }}
        >
          <Card
            sx={{
              minWidth: 200,
              textAlign: "center",
              background: "#4CAF50",
              color: "#fff",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Revenues
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totals.Revenues.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              minWidth: 200,
              textAlign: "center",
              background: "#F44336",
              color: "#fff",
            }}
          >
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
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="80vh"
          >
            <CircularProgress size={60} />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="80vh"
          >
            <Typography variant="h4" color="textSecondary">
              No Items
            </Typography>
          </Box>
        ) : (
          <>
            {/* الرسم البياني والوسيلة التوضيحية (Legend) */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: { xs: "100%", md: "700px" },
                  height: { xs: "auto", md: "500px" },
                  overflow: "hidden",
                }}
              >
                <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
              </Box>
              <List
                sx={{
                  marginLeft: { md: "20px", xs: 0 },
                  width: "300px",
                  marginTop: { xs: "20px", md: 0 },
                }}
              >
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
                        (item.valueitem / d3.sum(
                          filteredItems.map((i) => i.valueitem)
                        )) *
                        100
                      ).toFixed(2)}%)`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* شبكة بطاقات الفئات */}
            <Grid container spacing={2} justifyContent="center">
              {filteredItems.map((item, index) => (
                <Grid
                  item
                  key={index}
                  xs={6}
                  sm={6}
                  md={4}
                  lg={3}
                  xl={2}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <StyledCard>
                    <ImageContainer>
                      <StyledImage
                        src={getImageUrl(item.CategoriesId?.image)}
                        alt="Category"
                      />
                    </ImageContainer>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", color: "#007BFF" }}
                      >
                        {item.CategoriesId?.categoryName || "Unknown"}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color:
                            item.CategoriesId?.categoryType === "Revenues"
                              ? "#4CAF50"
                              : "#F44336",
                        }}
                      >
                        {item.CategoriesId?.categoryType === "Expenses"
                          ? `-${item.valueitem}`
                          : item.valueitem}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        {item.CategoriesId?.categoryType &&
                        totals[item.CategoriesId.categoryType]
                          ? (
                              (item.valueitem /
                                totals[item.CategoriesId.categoryType]) *
                              100
                            ).toFixed(2)
                          : "0.00"}
                        %
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
