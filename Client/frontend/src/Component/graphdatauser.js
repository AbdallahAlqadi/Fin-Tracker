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
  CardMedia,
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
  useMediaQuery,
  LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { styled } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as d3 from "d3";
import { schemeSet3, schemeTableau10 } from "d3-scale-chromatic";

// Helper function to build image URL correctly
const getImageUrl = (image) => {
  if (!image) return "fallback-image.png";
  return image.startsWith("data:") ? image : `https://fin-tracker-ncbx.onrender.com/${image}`;
};

// Styled rectangular card with modern effects
const RectangularCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  borderRadius: 16,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  cursor: "pointer",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  overflow: "hidden",
  backgroundColor: "#fff",
  marginBottom: theme.spacing(2),
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

const RectangularMedia = styled(CardMedia)(({ theme }) => ({
  width: 160,
  height: 160,
  objectFit: "cover",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    height: 200,
  },
}));

const RectangularCardContent = styled(CardContent)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme, categoryType }) => ({
  width: "95px",
  height: 12,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[300],
  "& .MuiLinearProgress-bar": {
    borderRadius: 5,
    backgroundColor:
      categoryType === "Revenues"
        ? "#4CAF50"
        : categoryType === "Expenses"
        ? "#F44336"
        : theme.palette.primary.main,
    minWidth: "10px",
  },
}));

const TotalCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "bgColor",
})(({ theme, bgColor }) => ({
  minWidth: 200,
  textAlign: "center",
  color: "#fff",
  borderRadius: "12px",
  padding: theme.spacing(2),
  background: bgColor,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  transition: "box-shadow 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
  },
}));

const Graph = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState("Revenues");
  const [dateType, setDateType] = useState("month");
  const svgRef = useRef();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const colorScale = d3.scaleOrdinal([...schemeSet3, ...schemeTableau10]);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

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
      console.error("Error fetching budget data:", error);
      setLoading(false);
    }
  };

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
        }
        return true;
      });
    }
    if (filterType) {
      filteredItems = filteredItems.filter(
        (item) => item.CategoriesId?.categoryType === filterType
      );
    }
    const grouped = groupByCategory(filteredItems);
    return Object.values(grouped).filter(
      (item) =>
        item.CategoriesId?.categoryName &&
        item.CategoriesId?.categoryName !== "Unknown"
    );
  };

  const filteredItems = filterItems(budgetItems);

  const calculateTotals = (items) => {
    const totals = { Revenues: 0, Expenses: 0 };
    items.forEach((item) => {
      const value = parseFloat(item.valueitem);
      if (item.CategoriesId?.categoryType === "Revenues") totals.Revenues += value;
      else if (item.CategoriesId?.categoryType === "Expenses") totals.Expenses += value;
    });
    return totals;
  };

  const totals = calculateTotals(filteredItems);
  const balance = totals.Revenues - totals.Expenses;

  const handleItemClick = (item) => {
    setSelectedCategory(item);
    setModalOpen(true);
  };

  useEffect(() => {
    if (filteredItems.length > 0) {
      drawPieChart(filteredItems);
    } else {
      d3.select(svgRef.current).selectAll("*").remove();
    }
  }, [filteredItems]);

  const drawPieChart = (data) => {
    const width = 700;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 50;
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    svg.selectAll("*").remove();

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

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);
    const pie = d3.pie().value((d) => parseFloat(d.valueitem)).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(radius * 0.6).outerRadius(radius + 10);

    const arcs = g.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc");

    let timeoutId;

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
        clearTimeout(timeoutId);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `${d.data.CategoriesId?.categoryName || "Unknown"}: ${parseFloat(
              d.data.valueitem
            ).toFixed(2)}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
        d3.select(this).transition().duration(200).attr("d", arcHover);
        timeoutId = setTimeout(() => {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("d", arc);
        }, 3000);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        clearTimeout(timeoutId);
        tooltip.transition().duration(500).style("opacity", 0);
        d3.select(this).transition().duration(200).attr("d", arc);
      })
      .on("click", function (event, d) {
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

    const totalValue = d3.sum(data, (d) => parseFloat(d.valueitem));
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text(totalValue.toFixed(2));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <>
        <AppBar position="static" color="primary" elevation={4}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: "30px" }}>
              Budget Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Container
          maxWidth="lg"
          sx={{
            py: 4,
            backgroundColor: "#f5f5f5",
            minHeight: "100vh",
          }}
        >
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
              <Select
                value={dateType}
                onChange={(e) => setDateType(e.target.value)}
                label="Date Type"
                sx={{
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
                }}
              >
                <MenuItem value="full">Full Date</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
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
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
                sx={{
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
                }}
              >
                <MenuItem value="Revenues">Revenues</MenuItem>
                <MenuItem value="Expenses">Expenses</MenuItem>
              </Select>
            </FormControl>
          </Paper>

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
                No items found
              </Typography>
            </Box>
          ) : (
            <>
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
                  {filteredItems.map((item, index) => {
                    const percentage =
                      totals[item.CategoriesId?.categoryType]
                        ? (item.valueitem / totals[item.CategoriesId.categoryType]) * 100
                        : 0;
                    return (
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
                          primary={`${item.CategoriesId?.categoryName || "Unknown"} (${percentage.toFixed(2)}%)`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>

              <Grid container spacing={2} justifyContent="center">
                {filteredItems.map((item, index) => {
                  const percentage =
                    totals[item.CategoriesId?.categoryType]
                      ? (item.valueitem / totals[item.CategoriesId.categoryType]) * 100
                      : 0;
                  return (
                    <Grid
                      item
                      key={index}
                      xs={12}
                      sm={12}
                      md={8}
                      lg={6}
                      xl={4}
                      sx={{ display: "flex", justifyContent: "center" }}
                    >
                      <RectangularCard onClick={() => handleItemClick(item)}>
                        <RectangularMedia
                          image={getImageUrl(item.CategoriesId?.image)}
                          title={item.CategoriesId?.categoryName || "Unknown"}
                        />
                        <RectangularCardContent>
                          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                            {item.CategoriesId?.categoryName || "Unknown"}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color:
                                item.CategoriesId?.categoryType === "Revenues" ? "#4CAF50" : "#F44336",
                              mb: 1,
                            }}
                          >
                            {item.CategoriesId?.categoryType === "Expenses"
                              ? `-${item.valueitem}`
                              : item.valueitem}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" sx={{ minWidth: 40 }}>
                              {percentage.toFixed(2)}%
                            </Typography>
                            <StyledLinearProgress
                              categoryType={item.CategoriesId?.categoryType}
                              variant="determinate"
                              value={percentage}
                            />
                          </Box>
                        </RectangularCardContent>
                      </RectangularCard>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}
        </Container>

        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          fullWidth
          maxWidth="sm"
          fullScreen={fullScreen}
          PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#1976d2",
              color: "#fff",
              fontSize: "18px",
              fontWeight: "bold",
              p: 1.5,
            }}
          >
            Category Details
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            {selectedCategory && (
              <>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      overflow: "hidden",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      mr: 2,
                    }}
                  >
                    <img
                      src={getImageUrl(selectedCategory.CategoriesId?.image)}
                      alt="Category"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {selectedCategory.CategoriesId?.categoryName || "Unknown"}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Type: {selectedCategory.CategoriesId?.categoryType || "Unknown"}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Value: {parseFloat(selectedCategory.valueitem).toFixed(2)}
                </Typography>
                <Typography variant="body1">
                  Percentage:{" "}
                  {selectedCategory && totals[selectedCategory.CategoriesId?.categoryType]
                    ? (
                        (selectedCategory.valueitem /
                          totals[selectedCategory.CategoriesId.categoryType]) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 1 }}>
            <Button onClick={() => setModalOpen(false)} variant="contained" color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </>
    </LocalizationProvider>
  );
};

export default Graph;