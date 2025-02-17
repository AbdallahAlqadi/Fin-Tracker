import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
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

// بطاقة الفئة مع تأثير hover أكثر نعومة وحداثة وإضافة مؤشر "pointer"
const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(2),
  borderRadius: "12px",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  backgroundColor: "#fff",
  width: "200px",
  height: "230px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
  },
}));

// تنسيق قائمة الاختيارات مع تأثيرات مخصصة
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

// بطاقة إجماليات مخصصة مع تأثيرات حديثة دون تغيير حجمها
// تم استخدام shouldForwardProp لمنع تمرير الخاصية bgColor إلى DOM
const TotalCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "bgColor",
})(({ theme, bgColor }) => ({
  minWidth: 200,
  textAlign: "center",
  color: "#fff",
  borderRadius: "12px",
  padding: theme.spacing(2),
  background: bgColor,
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
  transition: "box-shadow 0.3s ease",
  "&:hover": {
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
  },
}));

const Graph = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date());
  // إفتراضيًا يتم اختيار الإيرادات، ويمكن اختيار "ALL" لعرض الكل
  const [filterType, setFilterType] = useState("Revenues");
  const [dateType, setDateType] = useState("month");
  const svgRef = useRef();

  // حالات النافذة المنبثقة لعرض التفاصيل
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

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
      // الحصول على اسم الفئة أو تعيين "Unknown" إذا لم يكن موجودًا
      const categoryName = item.CategoriesId?.categoryName || "Unknown";
      if (!acc[categoryName]) {
        acc[categoryName] = { ...item, valueitem: 0 };
      }
      acc[categoryName].valueitem += parseFloat(item.valueitem);
      return acc;
    }, {});
  };

  // تصفية العناصر بناءً على التاريخ والنوع واستبعاد العناصر غير المعروفة
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

    // إذا كان النوع المحدد ليس "ALL" يتم تصفية العناصر بناءً على النوع
    if (filterType !== "ALL") {
      filteredItems = filteredItems.filter(
        (item) => item.CategoriesId?.categoryType === filterType
      );
    }

    // تجميع العناصر ثم استبعاد العناصر التي تحمل اسم "Unknown"
    const grouped = groupByCategory(filteredItems);
    const groupedArray = Object.values(grouped).filter(
      (item) =>
        item.CategoriesId?.categoryName && item.CategoriesId?.categoryName !== "Unknown"
    );
    return groupedArray;
  };

  const filteredItems = filterItems(budgetItems);

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

  const totals = calculateTotals(filteredItems);
  const balance = totals.Revenues - totals.Expenses;

  // دالة التعامل مع النقر على عنصر الفئة (بطاقة أو جزء من الرسم)
  const handleItemClick = (item) => {
    setSelectedCategory(item);
    setModalOpen(true);
  };

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
      .on("click", function (event, d) {
        // عند النقر على جزء من الرسم البياني يتم عرض نافذة التفاصيل
        handleItemClick(d.data);
      })
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
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
      <>
        {/* شريط التنقل */}
        <AppBar position="static" color="primary" elevation={4}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: "30px" }}>
              Budget board
            </Typography>
          </Toolbar>
        </AppBar>

        {/* تغليف المحتوى في حاوية مركزية */}
        <Container
          maxWidth="lg"
          sx={{
            py: 4,
            backgroundColor: "#f5f5f5",
            minHeight: "100vh",
          }}
        >
          {/* عناصر التصفية */}
          <Paper
            sx={{
              p: 2,
              mb: 4,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 2,
              justifyContent: "center",
              borderRadius: 2,
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
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
              renderInput={(params) => <TextField {...params} sx={{ minWidth: 180 }} />}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <StyledSelect
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                {/* إضافة خيار ALL إلى جانب Revenues و Expenses */}
                <MenuItem value="ALL">ALL</MenuItem>
                <MenuItem value="Revenues">Revenues</MenuItem>
                <MenuItem value="Expenses">Expenses</MenuItem>
              </StyledSelect>
            </FormControl>
          </Paper>

          {/* بطاقات الإجماليات */}
          <Box
            sx={{
              mb: 4,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: { xs: 2, md: 4 },
            }}
          >
            <TotalCard bgColor="linear-gradient(135deg, #66BB6A, #43A047)">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Revenues
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {totals.Revenues.toFixed(2)}
                </Typography>
              </CardContent>
            </TotalCard>

            <TotalCard bgColor="linear-gradient(135deg, #EF5350, #E53935)">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Expenses
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {totals.Expenses.toFixed(2)}
                </Typography>
              </CardContent>
            </TotalCard>

            <TotalCard
              bgColor={
                balance >= 0
                  ? "linear-gradient(135deg, #66BB6A, #43A047)"
                  : "linear-gradient(135deg, #EF5350, #E53935)"
              }
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Balance
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {balance.toFixed(2)}
                </Typography>
              </CardContent>
            </TotalCard>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
              <CircularProgress size={60} />
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
              <Typography variant="h4" color="textSecondary">
                No Items
              </Typography>
            </Box>
          ) : (
            <>
              {/* الرسم البياني والوسيلة التوضيحية */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 4,
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: { xs: "100%", md: "700px" },
                    height: { xs: "auto", md: "500px" },
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
                </Box>
                <List
                  sx={{
                    ml: { md: "20px", xs: 0 },
                    width: "300px",
                    mt: { xs: "20px", md: 0 },
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  {filteredItems.map((item, index) => (
                    <ListItem
                      key={index}
                      onClick={() => handleItemClick(item)}
                      sx={{
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                        "&:hover": { backgroundColor: "#f0f0f0" },
                      }}
                    >
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
                          (item.valueitem /
                            d3.sum(filteredItems.map((i) => i.valueitem)) *
                            100) || 0
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
                    <StyledCard onClick={() => handleItemClick(item)}>
                      <ImageContainer>
                        <StyledImage
                          src={getImageUrl(item.CategoriesId?.image)}
                          alt="Category"
                        />
                      </ImageContainer>
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: "bold", color: "#1976d2" }}
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
        </Container>

        {/* نافذة منبثقة (Modal) لعرض تفاصيل الفئة - بتنسيق وحجم أصغر */}
        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 2, padding: 1,width:"20%" } }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#1976d2",
              color: "#fff",
              fontSize: "18px",
              fontWeight: "bold",
              padding: "12px",
            }}
          >
            تفاصيل الفئة
          </DialogTitle>
          <DialogContent sx={{ padding: 2 }}>
            {selectedCategory && (
              <>
                <Box display="flex" alignItems="center" mb={2}>
                  <ImageContainer sx={{ width: 60, height: 60, marginTop:"5px",mr: 6 }}>
                    <StyledImage
                      src={getImageUrl(selectedCategory.CategoriesId?.image)}
                      alt="Category"
                    />
                  </ImageContainer>
                  <Typography variant="h6">
                    {selectedCategory.CategoriesId?.categoryName || "Unknown"}
                  </Typography>
                </Box>
                <DialogContentText sx={{ mb: 1 }}>
                  النوع: {selectedCategory.CategoriesId?.categoryType || "Unknown"}
                </DialogContentText>
                <DialogContentText sx={{ mb: 1 }}>
                  القيمة: {parseFloat(selectedCategory.valueitem).toFixed(2)}
                </DialogContentText>
                <DialogContentText>
                  النسبة:{" "}
                  {selectedCategory &&
                  totals[selectedCategory.CategoriesId?.categoryType]
                    ? (
                        (selectedCategory.valueitem /
                          totals[selectedCategory.CategoriesId.categoryType]) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </DialogContentText>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: "8px" }}>
            <Button onClick={() => setModalOpen(false)} variant="contained" color="primary">
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>
      </>
    </LocalizationProvider>
  );
};

export default Graph;
