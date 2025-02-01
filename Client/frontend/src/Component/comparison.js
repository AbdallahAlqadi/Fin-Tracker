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
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
} from "@mui/material";
import { styled } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as d3 from "d3";
import * as XLSX from "xlsx";

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

const ImageContainer = styled("div")({
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  overflow: "hidden",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  marginBottom: "12px",
});

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

const Comparison = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [filterType, setFilterType] = useState("Revenues");
  const [dateType, setDateType] = useState("year"); // year, month, day
  const [chartType, setChartType] = useState("bar"); // bar, line
  const svgRef = useRef();

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

  const groupByDateAndCategory = (items) => {
    const groupedData = {};

    items.forEach((item) => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Months are 0-indexed
      const day = date.getDate();
      const categoryName = item.CategoriesId.categoryName;

      let key;
      if (dateType === "year") {
        key = year;
      } else if (dateType === "month") {
        key = `${year}-${month}`;
      } else if (dateType === "day") {
        key = `${year}-${month}-${day}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = {};
      }

      if (!groupedData[key][categoryName]) {
        groupedData[key][categoryName] = 0;
      }

      groupedData[key][categoryName] += parseFloat(item.valueitem);
    });

    return groupedData;
  };

  const filterItems = (items) => {
    let filteredItems = items;

    if (dateType === "year" && selectedYears.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const year = new Date(item.date).getFullYear();
        return selectedYears.includes(year);
      });
    } else if (dateType === "month" && selectedMonths.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const month = new Date(item.date).getMonth() + 1;
        return selectedMonths.includes(month);
      });
    } else if (dateType === "day" && selectedDays.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        const day = new Date(item.date).getDate();
        return selectedDays.includes(day);
      });
    }

    // Filter by type (Revenues or Expenses)
    filteredItems = filteredItems.filter((item) => item.CategoriesId.categoryType === filterType);

    return groupByDateAndCategory(filteredItems);
  };

  const filteredItems = filterItems(budgetItems);

  useEffect(() => {
    if (Object.keys(filteredItems).length > 0) {
      if (chartType === "bar") {
        drawBarChart(filteredItems);
      } else if (chartType === "line") {
        drawLineChart(filteredItems);
      }
    }
  }, [filteredItems, chartType]);

  const drawBarChart = (data) => {
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    d3.select(svgRef.current).selectAll("*").remove(); // Clear previous chart

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dates = Object.keys(data);
    const categories = [...new Set(Object.values(data).flatMap(date => Object.keys(date)))];

    const x0 = d3.scaleBand()
      .domain(dates)
      .rangeRound([0, width - margin.left - margin.right])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .domain(categories)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(Object.values(data), date => d3.max(Object.values(date)))])
      .nice()
      .rangeRound([height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add bars
    svg.append("g")
      .selectAll("g")
      .data(dates)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d)},0)`)
      .selectAll("rect")
      .data(d => categories.map(category => ({ category, value: data[d][category] || 0 })))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.category))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - margin.top - margin.bottom - y(d.value))
      .attr("fill", d => color(d.category))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.7);
        svg.append("text")
          .attr("class", "bar-value")
          .attr("x", x0(dates[0]) + x1(d.category) + x1.bandwidth() / 2)
          .attr("y", y(d.value) - 5)
          .attr("text-anchor", "middle")
          .text(d.value);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        svg.selectAll(".bar-value").remove();
      });

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x0));

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right - 100},${margin.top})`);

    categories.forEach((category, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(category));

      legend.append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(category)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
  };

  const drawLineChart = (data) => {
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    d3.select(svgRef.current).selectAll("*").remove(); // Clear previous chart

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dates = Object.keys(data);
    const categories = [...new Set(Object.values(data).flatMap(date => Object.keys(date)))];

    const x = d3.scaleBand()
      .domain(dates)
      .rangeRound([0, width - margin.left - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(Object.values(data), date => d3.max(Object.values(date)))])
      .nice()
      .rangeRound([height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const line = d3.line()
      .x((d, i) => x(dates[i]) + x.bandwidth() / 2)
      .y(d => y(d.value));

    categories.forEach((category, i) => {
      const categoryData = dates.map(date => ({ value: data[date][category] || 0 }));

      svg.append("path")
        .datum(categoryData)
        .attr("fill", "none")
        .attr("stroke", color(i))
        .attr("stroke-width", 2)
        .attr("d", line);

      svg.selectAll(`.dot-${category}`)
        .data(categoryData)
        .enter()
        .append("circle")
        .attr("class", `dot-${category}`)
        .attr("cx", (d, i) => x(dates[i]) + x.bandwidth() / 2)
        .attr("cy", d => y(d.value))
        .attr("r", 5)
        .attr("fill", color(i))
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 8);
          svg.append("text")
            .attr("class", "line-value")
            .attr("x", x(dates[0]) + x.bandwidth() / 2)
            .attr("y", y(d.value) - 10)
            .attr("text-anchor", "middle")
            .text(d.value);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 5);
          svg.selectAll(".line-value").remove();
        });
    });

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x));

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right - 100},${margin.top})`);

    categories.forEach((category, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(i));

      legend.append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(category)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
  };

  const handleYearChange = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleMonthChange = (month) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const handleDayChange = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const availableYears = [...new Set(budgetItems.map(item => new Date(item.date).getFullYear()))];
  const availableMonths = [...new Set(budgetItems.map(item => new Date(item.date).getMonth() + 1))];
  const availableDays = [...new Set(budgetItems.map(item => new Date(item.date).getDate()))];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: 4, background: "#f5f5f5", minHeight: "100vh" }}>
        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <StyledSelect value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="Revenues">Revenues</MenuItem>
              <MenuItem value="Expenses">Expenses</MenuItem>
            </StyledSelect>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Date Type</InputLabel>
            <StyledSelect value={dateType} onChange={(e) => setDateType(e.target.value)}>
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
            <FormControlLabel value="bar" control={<Radio />} label="Bar Chart" />
            <FormControlLabel value="line" control={<Radio />} label="Line Chart" />
          </RadioGroup>
        </Box>

        <Box sx={{ marginBottom: 4, display: "flex", justifyContent: "center", gap: 2 }}>
          {dateType === "year" && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {availableYears.map((year) => (
                <FormControlLabel
                  key={year}
                  control={
                    <Checkbox
                      checked={selectedYears.includes(year)}
                      onChange={() => handleYearChange(year)}
                    />
                  }
                  label={year}
                />
              ))}
            </Box>
          )}
          {dateType === "month" && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {availableMonths.map((month) => (
                <FormControlLabel
                  key={month}
                  control={
                    <Checkbox
                      checked={selectedMonths.includes(month)}
                      onChange={() => handleMonthChange(month)}
                    />
                  }
                  label={month}
                />
              ))}
            </Box>
          )}
          {dateType === "day" && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {availableDays.map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={selectedDays.includes(day)}
                      onChange={() => handleDayChange(day)}
                    />
                  }
                  label={day}
                />
              ))}
            </Box>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress size={60} />
          </Box>
        ) : Object.keys(filteredItems).length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <Typography variant="h4" color="textSecondary">
              No Items
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <svg ref={svgRef} width="800" height="400"></svg>
            </Box>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Comparison;