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
  DialogActions,
  Button,
  useMediaQuery,
  LinearProgress,
  Divider,
  Avatar,
  Chip,
  IconButton,
} from "@mui/material";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import { styled } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as d3 from "d3";
import { schemePastel1, schemeTableau10 } from "d3-scale-chromatic"; 
import FilterListIcon from "@mui/icons-material/FilterList";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CategoryIcon from "@mui/icons-material/Category";
import InfoIcon from "@mui/icons-material/Info";
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PieChartIcon from '@mui/icons-material/PieChart';
import LabelIcon from '@mui/icons-material/Label';
import CloseIcon from '@mui/icons-material/Close';

const modernTheme = createTheme({
  palette: {
    primary: {
      main: "#5DB7A8", 
    },
    secondary: {
      main: "#F0A868", 
    },
    background: {
      default: "#F4F7F6", 
      paper: "#FFFFFF",
    },
    text: {
      primary: "#333745", 
      secondary: "#5E6472",
    },
    success: {
      main: "#81C784", 
      light: "#A5D6A7",
      dark: "#388E3C",
    },
    error: {
      main: "#FF8A65", 
      light: "#FFAB91",
      dark: "#D32F2F",
    },
    info: {
        main: "#64B5F6",
    }
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
        fontWeight: 700,
        color: "#333745",
    },
    h5: {
      fontWeight: 600,
      color: "#333745",
    },
    h6: {
      fontWeight: 500,
      color: "#333745",
    },
    subtitle1: {
        fontWeight: 500,
        color: "#5E6472",
    },
    body1: {
        color: "#5E6472",
    },
    body2: {
        color: "#5E6472", 
    }
  },
  shape: {
    borderRadius: 12, 
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 6px 18px rgba(93, 183, 168, 0.1)", 
          transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 10px 25px rgba(93, 183, 168, 0.18)",
          },
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }
        }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 600,
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#4E9A8C", 
          },
        },
      },
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", 
            }
        }
    },
    MuiDialogTitle: {
        styleOverrides: {
            root: {
                backgroundColor: "#5DB7A8",
                color: "#FFFFFF",
                padding: "8px 16px", // Reduced padding
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }
        }
    },
    MuiDialogActions: {
        styleOverrides: {
            root: {
                padding: "8px 16px", // Reduced padding
                borderTop: "1px solid #E0E0E0",
                backgroundColor: "#F4F7F6", 
            }
        }
    }
  },
});

const getImageUrl = (image) => {
  if (!image || image === "fallback-image.png") return "https://via.placeholder.com/150/F4F7F6/333745?text=No+Image";
  return image.startsWith("data:") ? image : `https://fin-tracker-ncbx.onrender.com/${image}`;
};

const RectangularCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  cursor: "pointer",
  overflow: "hidden",
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(2.5),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

const RectangularMedia = styled(CardMedia)(({ theme }) => ({
  width: 150,
  height: 150,
  objectFit: "cover",
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(1.5),
  [theme.breakpoints.down("sm")]: {
    width: `calc(100% - ${theme.spacing(3)})`,
    height: 180,
    margin: theme.spacing(1.5, 1.5, 0, 1.5),
  },
}));

const RectangularCardContent = styled(CardContent)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2.5),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme, categorytype }) => ({
  width: "100px", 
  height: 10,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.grey[200],
  "& .MuiLinearProgress-bar": {
    borderRadius: theme.shape.borderRadius,
    backgroundColor:
      categorytype === "Revenues"
        ? theme.palette.success.main 
        : categorytype === "Expenses"
        ? theme.palette.error.main 
        : theme.palette.primary.main,
    minWidth: "8px",
  },
}));

const TotalCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "bgColor" && prop !== "gradientBg",
})(({ theme, gradientBg }) => ({
  minWidth: 220, 
  textAlign: "center",
  color: theme.palette.common.white,
  padding: theme.spacing(2.5),
  background: gradientBg || theme.palette.primary.main, 
}));

const DetailItem = ({ icon, label, value, valueColor }) => (
    <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 2, mb: 1.5, backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2c3e50' : '#FFFFFF' }}>
        {icon && React.cloneElement(icon, { sx: { color: (theme) => valueColor || theme.palette.info.main, fontSize: 28 } })}
        <Box>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {label}
            </Typography>
            <Typography variant="subtitle1" fontWeight="600" color={valueColor || "text.primary"} sx={{ lineHeight: 1.3 }}>
                {value}
            </Typography>
        </Box>
    </Paper>
);

const GraphComponent = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState("Revenues");
  const [dateType, setDateType] = useState("month");
  const svgRef = useRef();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const d3ColorScale = d3.scaleOrdinal([...schemePastel1, ...schemeTableau10]); 
  const theme = useTheme(); 
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchBudget();
  }, []);

  const token = sessionStorage.getItem("jwt");

  const fetchBudget = async () => {
    setLoading(true);
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
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const categoryName = item.CategoriesId?.categoryName || "Unknown";
      if (!acc[categoryName]) {
        acc[categoryName] = { ...item, valueitem: 0 };
      }
      acc[categoryName].valueitem += parseFloat(item.valueitem) || 0;
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
        } else if (dateType === "full") {
          return (
            selectedDate.getDate() === itemDate.getDate() &&
            selectedDate.getMonth() === itemDate.getMonth() &&
            selectedDate.getFullYear() === itemDate.getFullYear()
          );
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
      const value = parseFloat(item.valueitem) || 0;
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
  
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    if (filteredItems.length > 0 && !loading) {
      drawPieChart(filteredItems);
    } else {
      d3.select(svgRef.current).selectAll("*").remove();
    }
  }, [filteredItems, loading, d3ColorScale]); 

  const drawPieChart = (data) => {
    const width = 700;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 40; 
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
        .style("padding", "10px")
        .style("background", "rgba(40, 40, 40, 0.85)") 
        .style("color", "#fff")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "13px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)");
    }

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);
    const pie = d3.pie().value((d) => parseFloat(d.valueitem)).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius); 
    const arcHover = d3.arc().innerRadius(radius * 0.55).outerRadius(radius + 8); 

    const arcs = g.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc");

    let timeoutId;

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => d3ColorScale(d.data.CategoriesId?.categoryName || i)) 
      .attr("stroke", theme.palette.background.paper) 
      .style("stroke-width", "3px")
      .each(function (d) {
        this._current = d;
      })
      .on("mouseover", function (event, d) {
        clearTimeout(timeoutId);
        d3.select(this).transition().duration(150).attr("d", arcHover);
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip
          .html(
            `<div style="font-weight: bold; margin-bottom: 4px;">${d.data.CategoriesId?.categoryName || "Unknown"}</div>` +
            `<div>Value: ${parseFloat(d.data.valueitem).toFixed(2)}</div>`
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 15 + "px");
        
        timeoutId = setTimeout(() => {
          tooltip.transition().duration(300).style("opacity", 0);
          d3.select(this).transition().duration(150).attr("d", arc);
        }, 3500);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 15 + "px");
      })
      .on("mouseout", function () {
        clearTimeout(timeoutId);
        d3.select(this).transition().duration(150).attr("d", arc);
        tooltip.transition().duration(300).style("opacity", 0);
      })
      .on("click", function (event, d) {
        handleItemClick(d.data);
      })
      .transition()
      .duration(800) 
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t));
        };
      });

    const totalValue = d3.sum(data, (d) => parseFloat(d.valueitem));
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.0em") 
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .style("fill", theme.palette.text.primary)
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "-0.2em")
      .text(filterType)
      .style("font-size", "14px")
      .style("font-weight", "normal")
      .style("fill", theme.palette.text.secondary);
      
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.0em")
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .style("fill", theme.palette.text.primary)
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "0.9em")
      .text(totalValue.toFixed(2));
  };

  return (
      <>
        <AppBar position="static" color="primary" elevation={0} sx={{ backgroundColor: theme.palette.primary.main }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: "24px", fontWeight: "bold", color: theme.palette.common.white }}>
              Modern Budget Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Container
          maxWidth="xl" 
          sx={{
            py: 3, 
            backgroundColor: theme.palette.background.default,
            minHeight: "calc(100vh - 64px)", 
          }}
        >
          <Paper
            elevation={0} 
            sx={{
              p: 2.5,
              mb: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 2,
              justifyContent: "space-around", 
              borderRadius: theme.shape.borderRadius, 
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <FilterListIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
              <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>Filters</Typography>
            </Box>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Date Type</InputLabel>
              <Select
                value={dateType}
                onChange={(e) => setDateType(e.target.value)}
                label="Date Type"
                variant="outlined"
                sx={{
                  borderRadius: theme.shape.borderRadius,
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
              slots={{ textField: (params) => <TextField {...params} variant="outlined" sx={{ minWidth: 180, borderRadius: theme.shape.borderRadius }} /> }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
                variant="outlined"
                 sx={{
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <MenuItem value="Revenues">Revenues</MenuItem>
                <MenuItem value="Expenses">Expenses</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center", 
              gap: { xs: 2, md: 3 }, 
            }}
          >
            <TotalCard gradientBg={`linear-gradient(135deg, ${theme.palette.success.light}, ${theme.palette.success.main})`}>
              <CardContent>
                <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} mb={1}>
                  <TrendingUpIcon sx={{ fontSize: 32, color: theme.palette.common.white }} />
                  <Typography variant="h6" gutterBottom sx={{color: theme.palette.common.white}}>
                    Total Revenues
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: theme.palette.common.white }}>
                  ${totals.Revenues.toFixed(2)}
                </Typography>
              </CardContent>
            </TotalCard>

            <TotalCard gradientBg={`linear-gradient(135deg, ${theme.palette.error.light}, ${theme.palette.error.main})`}>
              <CardContent>
                <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} mb={1}>
                  <TrendingDownIcon sx={{ fontSize: 32, color: theme.palette.common.white }} />
                  <Typography variant="h6" gutterBottom sx={{color: theme.palette.common.white}}>
                    Total Expenses
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: theme.palette.common.white }}>
                  ${totals.Expenses.toFixed(2)}
                </Typography>
              </CardContent>
            </TotalCard>

            <TotalCard
              gradientBg={
                balance >= 0
                  ? `linear-gradient(135deg, ${theme.palette.primary.light || '#88D4C5'}, ${theme.palette.primary.main})`
                  : `linear-gradient(135deg, ${theme.palette.secondary.light || '#F7C99B'}, ${theme.palette.secondary.main})` 
              }
            >
              <CardContent>
                <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} mb={1}>
                  <AccountBalanceIcon sx={{ fontSize: 32, color: theme.palette.common.white }} />
                  <Typography variant="h6" gutterBottom sx={{color: theme.palette.common.white}}>
                    Balance
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: theme.palette.common.white }}>
                  ${balance.toFixed(2)}
                </Typography>
              </CardContent>
            </TotalCard>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
              <CircularProgress size={50} sx={{color: theme.palette.primary.main}}/>
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
              <Typography variant="h5" color="textSecondary" sx={{color: theme.palette.text.secondary}}>
                No items found for the selected filters.
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={7} lg={8}>
                    <Paper elevation={0} sx={{ 
                        p: {xs: 1, sm: 2},
                        height: { xs: "auto", md: "550px" }, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        overflow: "hidden"
                    }}>
                        <svg ref={svgRef} style={{ width: "100%", height: "100%"}} />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={5} lg={4}>
                    <Paper elevation={0} sx={{ 
                        p: {xs: 1, sm: 2}, 
                        height: { xs: "auto", md: "550px" }, 
                        overflowY: 'auto',
                    }}>
                        <List>
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
                                transition: "background-color 0.2s ease",
                                borderRadius: theme.shape.borderRadius -4, 
                                mb: 1,
                                "&:hover": { backgroundColor: theme.palette.action.hover },
                                }}
                            >
                                <ListItemIcon>
                                <CategoryIcon
                                    sx={{
                                    color: d3ColorScale(item.CategoriesId?.categoryName || index),
                                    fontSize: 28,
                                    }}
                                />
                                </ListItemIcon>
                                <ListItemText
                                primaryTypographyProps={{ variant: 'subtitle1', fontWeight: '500', color: theme.palette.text.primary }}
                                secondaryTypographyProps={{ variant: 'body2', color: theme.palette.text.secondary }}
                                primary={`${item.CategoriesId?.categoryName || "Unknown"}`}
                                secondary={`Value: ${item.valueitem.toFixed(2)} (${percentage.toFixed(1)}%)`}
                                />
                            </ListItem>
                            );
                        })}
                        </List>
                    </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{mt: 1}} justifyContent="center">
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
                      sm={6}
                      md={4} 
                      lg={4}
                      sx={{ display: "flex", justifyContent: "center" }}
                    >
                      <RectangularCard onClick={() => handleItemClick(item)} sx={{width: "100%"}}>
                        <RectangularMedia
                          image={getImageUrl(item.CategoriesId?.image)}
                          title={item.CategoriesId?.categoryName || "Unknown"}
                        />
                        <RectangularCardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <CategoryIcon
                              sx={{
                                color:
                                  item.CategoriesId?.categoryType === "Revenues"
                                    ? theme.palette.success.main
                                    : theme.palette.error.main,
                                fontSize: 22,
                              }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: "600", color: theme.palette.text.primary }}>
                              {item.CategoriesId?.categoryName || "Unknown"}
                            </Typography>
                          </Box>
                          <Typography
                            variant="h5"
                            sx={{
                              color:
                                item.CategoriesId?.categoryType === "Revenues" ? theme.palette.success.dark : theme.palette.error.dark,
                              fontWeight: "bold",
                              mb: 1.5,
                            }}
                          >
                            {item.CategoriesId?.categoryType === "Expenses"
                              ? `-$${parseFloat(item.valueitem).toFixed(2)}`
                              : `$${parseFloat(item.valueitem).toFixed(2)}`}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <StyledLinearProgress
                              categorytype={item.CategoriesId?.categoryType} 
                              variant="determinate"
                              value={percentage}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
                              {percentage.toFixed(1)}%
                            </Typography>
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
          onClose={handleCloseModal}
          fullWidth
          maxWidth="sm" 
          fullScreen={fullScreen}
          PaperProps={{
            sx: {
              borderRadius: fullScreen ? 0 : theme.shape.borderRadius + 4, // e.g. 16px
              m: fullScreen ? 0 : 2,
              overflow: 'hidden', // Changed to hidden to clip title and actions
              bgcolor: theme.palette.background.default,
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <InfoIcon sx={{ mr: 1, fontSize: '1.25rem' }} /> {/* Slightly smaller icon */} 
                <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}> {/* Smaller title font */} 
                    Category Details
                </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={handleCloseModal}
              size="small" // Smaller IconButton
              sx={{
                color: (theme) => theme.palette.common.white, // Ensure contrast with title background
              }}
            >
              <CloseIcon fontSize="small"/> {/* Smaller CloseIcon */} 
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: {xs: 2, sm: 3}, overflowY: 'auto', maxHeight: fullScreen ? 'calc(100vh - 88px)' : 'calc(80vh - 88px)' }}> {/* Adjusted maxHeight for smaller title/actions */} 
            {selectedCategory && (
              <Box>
                <Box display="flex" flexDirection="column" alignItems="center" sx={{ mb: 3 }}>
                  <Avatar
                    src={getImageUrl(selectedCategory.CategoriesId?.image)}
                    alt={selectedCategory.CategoriesId?.categoryName || "Category"}
                    sx={{
                      width: { xs: 100, sm: 140 },
                      height: { xs: 100, sm: 140 },
                      mb: 2,
                      boxShadow: theme.shadows[4],
                      border: `3px solid ${theme.palette.common.white}`,
                    }}
                  />
                  <Typography variant="h4" component="h2" sx={{ fontWeight: "bold", color: theme.palette.text.primary, textAlign: "center", mb: 0.5 }}>
                    {selectedCategory.CategoriesId?.categoryName || "Unknown"}
                  </Typography>
                   <Chip 
                        icon={<LabelIcon />} 
                        label={selectedCategory.CategoriesId?.categoryType || "N/A"} 
                        size="small"
                        color={selectedCategory.CategoriesId?.categoryType === "Revenues" ? "success" : selectedCategory.CategoriesId?.categoryType === "Expenses" ? "error" : "default"}
                        sx={{ fontWeight: 500 }}
                    />
                </Box>
                
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <DetailItem 
                            icon={<MonetizationOnIcon />}
                            label="Value"
                            value={`$${parseFloat(selectedCategory.valueitem).toFixed(2)}`}
                            valueColor={selectedCategory.CategoriesId?.categoryType === "Revenues" ? theme.palette.success.dark : theme.palette.error.dark}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <DetailItem 
                            icon={<PieChartIcon />}
                            label={`Percentage of ${filterType}`}
                            value={`${selectedCategory && totals[selectedCategory.CategoriesId?.categoryType]
                                ? (
                                    (selectedCategory.valueitem /
                                    totals[selectedCategory.CategoriesId.categoryType]) *
                                    100
                                ).toFixed(1)
                                : "0.0"}%`}
                        />
                    </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} variant="contained" color="primary" size="small" sx={{minWidth: '100px'}}> {/* Smaller button */} 
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={modernTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <GraphComponent />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;

