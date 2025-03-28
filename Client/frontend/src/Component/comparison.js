import React, { useEffect, useState } from "react";
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
  Paper,
} from "@mui/material";
import { styled } from "@mui/system";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../cssStyle/comparsion.css";

// تسجيل المكونات اللازمة لمكتبة Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// مكون Select مُخصص مع تحسينات تصميم
const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "10px",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
  backgroundColor: "#fafafa",
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

// مكون Checkbox مُخصص
const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.primary.main,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 26,
  },
}));

// مكون Radio مُخصص
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

  // جلب البيانات من الخادم
  useEffect(() => {
    fetchBudget();
  }, []);

  const token = sessionStorage.getItem("jwt");

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
      (a, b) => new Date(a) - new Date(b)
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

  // إعداد بيانات الرسم البياني لـ Chart.js بناءً على البيانات المفلترة
  const getChartData = () => {
    const labels = Object.keys(filteredItems);
    const datasets = [];
    if (showRevenues) {
      datasets.push({
        label: "Revenues",
        data: labels.map((label) => filteredItems[label].Revenues || 0),
        backgroundColor: "rgba(46, 204, 113, 0.6)",
        borderColor: "rgba(46, 204, 113, 1)",
        borderWidth: 1,
        fill: chartType === "line" ? false : true,
      });
    }
    if (showExpenses) {
      datasets.push({
        label: "Expenses",
        data: labels.map((label) => filteredItems[label].Expenses || 0),
        backgroundColor: "rgba(231, 76, 60, 0.6)",
        borderColor: "rgba(231, 76, 60, 1)",
        borderWidth: 1,
        fill: chartType === "line" ? false : true,
      });
    }
    return {
      labels,
      datasets,
    };
  };

  // خيارات الرسم البياني العامة
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Budget Comparison",
        font: {
          size: 24,
        },
      },
    },
    maintainAspectRatio: false,
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
          padding: { xs: 2, sm: 3, md: 4 },
          background: "linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)",
          borderRadius: "16px",
          boxShadow: "0 6px 30px rgba(0, 0, 0, 0.15)",
          transition: "all 0.3s ease",
          maxWidth: { xs: "95%", sm: "90%", md: "1200px" },
          margin: "20px auto",
        }}
      >
        <Paper
          id="controls-container"
          elevation={4}
          sx={{
            marginBottom: 3,
            padding: { xs: 2, sm: 3 },
            borderRadius: "12px",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm="auto">
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
            </Grid>
            <Grid item xs={12} sm="auto">
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
            </Grid>
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <StyledCheckbox
                    checked={showRevenues}
                    onChange={(e) => setShowRevenues(e.target.checked)}
                  />
                }
                label="Show Revenues"
              />
            </Grid>
            <Grid item xs={12} sm="auto">
              <FormControlLabel
                control={
                  <StyledCheckbox
                    checked={showExpenses}
                    onChange={(e) => setShowExpenses(e.target.checked)}
                  />
                }
                label="Show Expenses"
              />
            </Grid>
          </Grid>
        </Paper>

        <Box id="date-selection-container" sx={{ marginBottom: 3 }}>
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
                            padding: { xs: 1, sm: 2 },
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
              height: { xs: "250px", sm: "300px" },
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
              height: { xs: "250px", sm: "300px" },
            }}
          >
            <Typography variant="h4" color="textSecondary">
              No Items
            </Typography>
          </Box>
        ) : (
          <Box
            id="chart-container"
            sx={{
              width: "100%",
              height: { xs: "400px", sm: "500px" },
              position: "relative",
            }}
          >
            {chartType === "bar" ? (
              <Bar data={getChartData()} options={chartOptions} />
            ) : (
              <Line data={getChartData()} options={chartOptions} />
            )}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Comparison;
