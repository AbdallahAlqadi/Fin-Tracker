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
  Button,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import { schemeSet3, schemeTableau10 } from "d3-scale-chromatic";
import "../cssStyle/graphdatauser.css"; // استيراد ملف CSS

const Graph = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState("Revenues"); // Default to "Revenues"
  const [dateType, setDateType] = useState("month");
  const svgRef = useRef();

  // إنشاء مقياس لوني باستخدام أكثر من 40 لونًا مختلفًا
  const colorScale = d3.scaleOrdinal([...schemeSet3, ...schemeTableau10]);

  useEffect(() => {
    fetchBudget();
  }, []);

  const token = sessionStorage.getItem('jwt');

  const fetchBudget = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5004/api/getUserBudget', {
        headers: {
          Auth: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setBudgetItems(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching budget", error);
      setLoading(false);
    }
  };

  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const categoryName = item.CategoriesId.categoryName;
      if (!acc[categoryName]) {
        acc[categoryName] = { ...item, valueitem: 0 };
      }
      acc[categoryName].valueitem += parseFloat(item.valueitem);
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
          return selectedDate.getMonth() === itemDate.getMonth() && selectedDate.getFullYear() === itemDate.getFullYear();
        } else if (dateType === "year") {
          return selectedDate.getFullYear() === itemDate.getFullYear();
        } else {
          return selectedDate.toDateString() === itemDate.toDateString();
        }
      });
    }

    // Filter by type (Revenues or Expenses)
    filteredItems = filteredItems.filter((item) => item.CategoriesId.categoryType === filterType);

    return Object.values(groupByCategory(filteredItems));
  };

  const calculateTotals = (items) => {
    const totals = { Revenues: 0, Expenses: 0 };

    items.forEach((item) => {
      const value = parseFloat(item.valueitem);
      if (item.CategoriesId.categoryType === "Revenues") {
        totals.Revenues += value;
      } else if (item.CategoriesId.categoryType === "Expenses") {
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
    const width = 600;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 50;

    d3.select(svgRef.current).selectAll("*").remove(); // Clear previous chart

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
      .value(d => parseFloat(d.valueitem))
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => colorScale(i)) // استخدام المقياس اللوني الجديد
      .attr("stroke", "#fff")
      .style("stroke-width", "2px");
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        Category: item.CategoriesId.categoryName,
        Value: item.valueitem,
        Percentage: `${((item.valueitem / d3.sum(filteredItems.map(i => i.valueitem))) * 100).toFixed(2)}%`,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Items");
    XLSX.writeFile(workbook, "filtered_budget_items.xlsx");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: 4, background: "#f5f5f5", minHeight: "100vh" }}>
        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Date Type</InputLabel>
            <Select className="styled-select" value={dateType} onChange={(e) => setDateType(e.target.value)}>
              <MenuItem value="full">Full Date</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>
          <DatePicker
            label={dateType === "month" ? "Select Month" : dateType === "year" ? "Select Year" : "Select Date"}
            views={dateType === "month" ? ["year", "month"] : dateType === "year" ? ["year"] : ["year", "month", "day"]}
            value={filterDate}
            onChange={(newValue) => setFilterDate(newValue)}
            renderInput={(params) => <TextField {...params} sx={{ minWidth: 180 }} />}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select className="styled-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="Revenues">Revenues</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </Select>
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
          <Card sx={{ minWidth: 200, textAlign: "center", background: balance >= 0 ? "#4CAF50" : "#F44336", color: "#fff" }}>
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

        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="contained" color="success" onClick={exportToExcel}>
            Export to Excel
          </Button>
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
              <List sx={{ marginLeft: "20px", width: "300px" }}>
                {filteredItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Box sx={{ width: "20px", height: "20px", backgroundColor: colorScale(index) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.CategoriesId.categoryName} (${((item.valueitem / d3.sum(filteredItems.map(i => i.valueitem))) * 100).toFixed(2)}%)`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Grid container spacing={3} justifyContent="center">
              {filteredItems.map((item, index) => (
                <Grid item key={index}>
                  <Card className="styled-card">
                    <div className="image-container">
                      <img
                        src={`http://127.0.0.1:5004/${item.CategoriesId.image}`}
                        alt="Category"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#007BFF" }}>
                        {item.CategoriesId.categoryName}
                      </Typography>
                      <Typography variant="body1" sx={{ color: item.CategoriesId.categoryType === "Revenues" ? "#4CAF50" : "#F44336" }}>
                        {item.CategoriesId.categoryType === "Expenses" ? `-${item.valueitem}` : item.valueitem}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        {((item.valueitem / totals[item.CategoriesId.categoryType]) * 100).toFixed(2)}%
                      </Typography>
                    </CardContent>
                  </Card>
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