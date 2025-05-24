import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  IconButton,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import { styled } from "@mui/system"; 
import { alpha, colors } from "@mui/material/styles"; // Added colors for direct use
import CategoryIcon from "@mui/icons-material/Category";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import * as XLSX from "xlsx";

// --- Enhanced Styled Components for a Modern, Strong, and Organized Look ---

const PageContainer = styled(Box)(({ theme }) => ({
  fontFamily: "\"Inter\", sans-serif",
  padding: theme.spacing(3),
  backgroundColor: theme.palette.grey[100],
  minHeight: "100vh",
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(5),
  },
}));

const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: "16px",
  boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.05)",
}));

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "stretch", 
  padding: theme.spacing(2),
  borderRadius: "16px",
  border: `1px solid ${theme.palette.divider}`,
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  background: theme.palette.background.paper,
  width: "100%",
  maxWidth: "500px", 
  minHeight: "160px", 
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
  "@media (max-width: 900px)": {
    flexDirection: "column",
    alignItems: "center", 
    textAlign: "center",
    padding: theme.spacing(2),
    minHeight: "auto", 
  },
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.12)",
  },
}));

const ImageContainer = styled("div")(({ theme }) => ({
  flexShrink: 0,
  marginRight: theme.spacing(2.5),
  borderRadius: "12px",
  overflow: "hidden",
  width: "100px",
  height: "100px",
  border: `2px solid ${theme.palette.grey[300]}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.grey[200],
  "@media (max-width:900px)": {
    marginRight: 0,
    marginBottom: theme.spacing(2),
    width: "100px", 
    height: "100px",
    alignSelf: "center",
  },
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "12px",
  backgroundColor: theme.palette.background.paper,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[400],
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.dark,
    borderWidth: "2px",
  },
  "& .MuiSelect-icon": {
    color: theme.palette.primary.main,
  },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "20px",
    boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
    border: "none",
    minWidth: "320px",
    [theme.breakpoints.up("sm")]: {
        minWidth: "450px",
    },
  },
}));

const StyledUpdateDialog = styled(StyledDialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    width: "90%",
    maxWidth: "550px",
  },
}));

const DialogHeaderBase = styled(DialogTitle)(({ theme }) => ({
  color: "#fff",
  textAlign: "center",
  padding: theme.spacing(2, 3),
  fontSize: "1.6rem",
  fontWeight: 700,
  position: "relative",
  borderTopLeftRadius: "20px",
  borderTopRightRadius: "20px",
}));

const StyledDialogTitle = styled(DialogHeaderBase)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
}));

const DeleteDialogTitle = styled(DialogHeaderBase)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
}));

const DialogHeader = ({ children, onClose }) => (
  <StyledDialogTitle>
    {children}
    {onClose ? (
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 12,
          top: 12,
          color: "#fff",
          backgroundColor: alpha("#000", 0.1),
          "&:hover": {
            backgroundColor: alpha("#000", 0.2),
          }
        }}
      >
        <CloseIcon />
      </IconButton>
    ) : null}
  </StyledDialogTitle>
);

const DeleteDialogHeader = ({ children, onClose }) => (
  <DeleteDialogTitle>
    {children}
    {onClose ? (
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 12,
          top: 12,
          color: "#fff",
          backgroundColor: alpha("#000", 0.1),
          "&:hover": {
            backgroundColor: alpha("#000", 0.2),
          }
        }}
      >
        <CloseIcon />
      </IconButton>
    ) : null}
  </DeleteDialogTitle>
);

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  backgroundColor: theme.palette.background.default,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: theme.palette.background.paper,
    "& fieldset": {
      borderColor: theme.palette.grey[400],
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.light,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.dark,
      borderWidth: "2px",
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.dark,
  },
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 4, 3, 4),
  backgroundColor: theme.palette.background.default,
  borderBottomLeftRadius: "20px",
  borderBottomRightRadius: "20px",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
}));

const StyledButton = styled(Button)(({ theme, variant = "contained", color = "primary" }) => ({
  borderRadius: "12px",
  fontWeight: 600,
  padding: theme.spacing(1.25, 3),
  textTransform: "none",
  transition: "all 0.25s ease-in-out",
  boxShadow: variant === "contained" ? `0 2px 5px ${alpha(theme.palette.common.black, 0.1)}` : "none",
  letterSpacing: "0.5px",

  ...(variant === "contained" && {
    color: theme.palette[color]?.contrastText || "#fff",
    backgroundColor: theme.palette[color]?.main,
    "&:hover": {
      backgroundColor: theme.palette[color]?.dark,
      boxShadow: `0 4px 10px ${alpha(theme.palette.common.black, 0.15)}`,
      transform: "translateY(-2px)",
    },
  }),
  ...(variant === "outlined" && {
    color: theme.palette[color]?.main,
    borderColor: alpha(theme.palette[color]?.main, 0.5),
    "&:hover": {
      backgroundColor: alpha(theme.palette[color]?.main, 0.08),
      borderColor: theme.palette[color]?.main,
      transform: "translateY(-2px)",
    },
  }),
  ...(variant === "text" && {
    color: theme.palette[color]?.main,
    "&:hover": {
        backgroundColor: alpha(theme.palette[color]?.main, 0.08),
    },
  }),
}));

const ExportButton = styled(StyledButton)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  "&:hover": {
    backgroundColor: theme.palette.success.dark,
  },
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledDateCard = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
  color: theme.palette.secondary.contrastText, 
  padding: theme.spacing(2, 3),
  borderRadius: "12px",
  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  fontWeight: 600,
}));

const SummaryCard = styled(Card)(({ theme, bgColor: rawBgColor }) => {
  let actualBgColorString;
  let textColor = theme.palette.common.white; // Default to white for gradients

  if (typeof rawBgColor === "function") {
    actualBgColorString = rawBgColor(theme); 
  } else {
    actualBgColorString = rawBgColor; 
  }

  if (typeof actualBgColorString === "string" && !actualBgColorString.startsWith("linear-gradient")) {
    // It's a solid color string, so we can try to get contrast text
    try {
      textColor = theme.palette.getContrastText(actualBgColorString);
    } catch (e) {
      // If getContrastText fails for any reason with a non-gradient string, fallback to white
      console.warn(`Failed to get contrast text for solid color: ${actualBgColorString}`, e);
      textColor = theme.palette.common.white;
    }
  } else if (typeof actualBgColorString === "string" && actualBgColorString.startsWith("linear-gradient")){
    // For gradients, explicitly set a common contrasting color (e.g., white)
    // More sophisticated logic could try to determine if the gradient is light or dark on average
    // but for simplicity and robustness, a fixed color is often best for gradients.
    textColor = theme.palette.common.white; 
  } else {
    // Fallback for undefined or unexpected bgColor types - use contrast against default primary.main
     actualBgColorString = `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`;
     textColor = theme.palette.getContrastText(theme.palette.primary.main);
  }

  return {
    minWidth: { xs: "100%", sm: 220 },
    textAlign: "center",
    background: actualBgColorString,
    color: textColor,
    borderRadius: "20px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
    padding: theme.spacing(2.5, 2),
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "180px",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    "& .MuiTypography-root": { 
      color: "inherit", 
    },
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    },
  };
});

const getImageUrl = (image) => {
  if (!image) return "/placeholder-image.svg";
  return image.startsWith("data:") ? image : `http://127.0.0.1:5004/${image}`;
};

// Main Component
const BudgetItems = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterType, setFilterType] = useState("all");
  const [filterItem, setFilterItem] = useState("all");
  const [dateType, setDateType] = useState("month");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const token = sessionStorage.getItem("jwt");

  // --- FUNCTIONALITY: REMAINS UNCHANGED ---
  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5004/api/getUserBudget", {
        headers: {
          Auth: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setBudgetItems((response.data.products || []).filter((item) => item.CategoriesId));
    } catch (error) {
      console.error("Error fetching budget", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const todayString = format(new Date(), "yyyy-MM-dd");
    const hasItemsToday = budgetItems.some(item => format(new Date(item.date), "yyyy-MM-dd") === todayString);
    localStorage.setItem("not", hasItemsToday ? "1" : "0");
  }, [budgetItems]);

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    handleCloseDeleteDialog();
    try {
      const response = await axios.delete("http://127.0.0.1:5004/api/deleteBudget", {
        headers: {
          Auth: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          CategoriesId: itemToDelete.CategoriesId._id,
          date: new Date(itemToDelete.date).toISOString(),
        },
      });
      if (response.status === 200) {
        console.log("Item deleted successfully", response.data);
        setBudgetItems((prevItems) =>
          prevItems.filter(
            (budgetItem) =>
              !(
                budgetItem.CategoriesId._id === itemToDelete.CategoriesId._id &&
                new Date(budgetItem.date).toISOString() === new Date(itemToDelete.date).toISOString()
              )
          )
        );
      } else {
        console.error("Failed to delete item", response.data);
      }
    } catch (error) {
      console.error("Error deleting budget", error.response?.data || error.message);
    }
  };

  const handleUpdateClick = (item) => {
    setSelectedItem(item);
    setUpdatedValue(item.valueitem);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setUpdatedValue("");
  };

  const handleSaveUpdate = async () => {
    if (!selectedItem) return;

    const numericValue = parseFloat(updatedValue);
    if (isNaN(numericValue)) {
      alert("Please enter a valid number.");
      return;
    }
    handleCloseDialog();
    try {
      const response = await axios.put(
        "http://127.0.0.1:5004/api/updateBudget",
        {
          CategoriesId: selectedItem.CategoriesId._id,
          date: selectedItem.date,
          valueitem: numericValue,
        },
        {
          headers: {
            Auth: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Item updated successfully", response.data);
        setBudgetItems((prevItems) =>
          prevItems.map((item) =>
            item.CategoriesId._id === selectedItem.CategoriesId._id &&
            new Date(item.date).toISOString() === new Date(selectedItem.date).toISOString()
              ? { ...item, valueitem: numericValue }
              : item
          )
        );
      } else {
        console.error("Failed to update item", response.data);
      }
    } catch (error) {
      console.error("Error updating budget", error.response?.data || error.message);
    }
  };

  const groupByDate = (items) => {
    const grouped = items.reduce((acc, item) => {
      const date = new Date(item.date);
      const dateString = date.toISOString().split("T")[0];
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(item);
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  };

  const filterItems = (items) => {
    let filteredItems = items.filter((item) => item.CategoriesId);

    if (filterDate && !isNaN(new Date(filterDate).getTime())) {
      const selectedDate = new Date(filterDate);
      filteredItems = filteredItems.filter((item) => {
        const itemDate = new Date(item.date);
        const isSameDate =
          selectedDate.getFullYear() === itemDate.getFullYear() &&
          selectedDate.getMonth() === itemDate.getMonth() &&
          selectedDate.getDate() === itemDate.getDate();
        if (dateType === "month") {
          return (
            selectedDate.getMonth() === itemDate.getMonth() &&
            selectedDate.getFullYear() === itemDate.getFullYear()
          );
        } else if (dateType === "year") {
          return selectedDate.getFullYear() === itemDate.getFullYear();
        } else {
          return isSameDate;
        }
      });
    }

    if (filterType !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.CategoriesId.categoryType === filterType
      );
    }

    if (filterItem !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.CategoriesId.categoryName === filterItem
      );
    }
    return filteredItems;
  };

  const uniqueItems =
    filterType === "all"
      ? [
          ...new Set(
            budgetItems.filter((item) => item.CategoriesId).map((item) => item.CategoriesId.categoryName)
          ),
        ]
      : [
          ...new Set(
            budgetItems
              .filter((item) => item.CategoriesId && item.CategoriesId.categoryType === filterType)
              .map((item) => item.CategoriesId.categoryName)
          ),
        ];

  const filteredItems = filterItems(budgetItems);
  const calculateTotals = (items) => {
    const totals = { Revenues: 0, Expenses: 0 };
    items.forEach((item) => {
      const value = parseFloat(item.valueitem);
      if (item.CategoriesId) {
        if (item.CategoriesId.categoryType === "Revenues") {
          totals.Revenues += value;
        } else if (item.CategoriesId.categoryType === "Expenses") {
          totals.Expenses += value;
        }
      }
    });
    return totals;
  };

  const totals = calculateTotals(filteredItems);
  const balance = totals.Revenues - totals.Expenses;

  useEffect(() => {
    if (balance < 0) {
      setShowError(true);
      setShowSuccess(false);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    } else if (balance > 0) {
      setShowSuccess(true);
      setShowError(false);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
      setShowSuccess(false);
    }
  }, [balance]);

  const exportToExcel = async () => {
    setExportLoading(true);
    setExportProgress(0);

    const wsData = filteredItems.map((item) => ({
      Date: format(new Date(item.date), "dd/MM/yyyy"),
      Item: item.CategoriesId.categoryName,
      Type: item.CategoriesId.categoryType,
      Value: item.valueitem,
    }));

    const totalsRow = [
      {
        Date: "Totals",
        Item: "Revenues",
        Type: "",
        Value: totals.Revenues.toFixed(2),
      },
      {
        Date: "Totals",
        Item: "Expenses",
        Type: "",
        Value: totals.Expenses.toFixed(2),
      },
      {
        Date: "Totals",
        Item: "Balance",
        Type: "",
        Value: balance.toFixed(2),
      },
    ];

    const exportData = [...wsData, ...totalsRow];
    const ws = XLSX.utils.json_to_sheet(exportData, { header: ["Date", "Item", "Type", "Value"] });
    ws["!cols"] = [
      { wpx: 100 },
      { wpx: 200 },
      { wpx: 100 },
      { wpx: 100 },
    ];

    const headerCellStyle = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFFFF" } },
      fill: { fgColor: { rgb: "FF424242" } }, 
      alignment: { horizontal: "center", vertical: "center" },
      border: { 
        top: { style: "thin", color: { rgb: "FF000000" } }, 
        bottom: { style: "thin", color: { rgb: "FF000000" } },
        left: { style: "thin", color: { rgb: "FF000000" } },
        right: { style: "thin", color: { rgb: "FF000000" } }
      }
    };
    const headers = ["Date", "Item", "Type", "Value"];
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (ws[cellAddress]) {
        ws[cellAddress].s = headerCellStyle;
      }
    });

    setExportProgress(50);
    setTimeout(() => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BudgetItems");
      XLSX.writeFile(wb, "BudgetItems_Report.xlsx");
      setExportProgress(100);
      setExportLoading(false);
      setExportProgress(0);
    }, 100);
  };
  // --- END OF UNCHANGED FUNCTIONALITY ---

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageContainer>
        <Snackbar
          open={showError}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          autoHideDuration={5000}
          onClose={() => setShowError(false)}
        >
          <Alert
            onClose={() => setShowError(false)}
            severity="error"
            variant="filled"
            sx={{ fontSize: "1rem", padding: "12px 20px", width: "100%", alignItems: "center" }}
          >
            Warning: Expenses exceed Revenues!
          </Alert>
        </Snackbar>

        <Snackbar
          open={showSuccess}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          autoHideDuration={5000}
          onClose={() => setShowSuccess(false)}
        >
          <Alert
            onClose={() => setShowSuccess(false)}
            severity="success"
            variant="filled"
            sx={{ fontSize: "1rem", padding: "12px 20px", width: "100%", alignItems: "center" }}
          >
            Success: Revenues exceed Expenses!
          </Alert>
        </Snackbar>

        <SectionPaper elevation={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <FilterListIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h5" component="h2" fontWeight="700" color="text.primary">
                Filters & Actions
                </Typography>
            </Box>
            <Grid container spacing={2.5} alignItems="center">
                <Grid item xs={12} sm={6} md={3} lg={2}>
                    <FormControl fullWidth variant="outlined">
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
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
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
                        onChange={(newValue) => {
                        if (newValue && !isNaN(new Date(newValue).getTime())) {
                            setFilterDate(newValue);
                        }
                        }}
                        renderInput={(params) => <StyledTextField {...params} fullWidth />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2} lg={2}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Type</InputLabel>
                        <StyledSelect
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        label="Type"
                        >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="Revenues">Revenues</MenuItem>
                        <MenuItem value="Expenses">Expenses</MenuItem>
                        </StyledSelect>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3} lg={3}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Item</InputLabel>
                        <StyledSelect
                        value={filterItem}
                        onChange={(e) => setFilterItem(e.target.value)}
                        label="Item"
                        >
                        <MenuItem value="all">All</MenuItem>
                        {uniqueItems.map((item, index) => (
                            <MenuItem key={index} value={item}>
                            {item}
                            </MenuItem>
                        ))}
                        </StyledSelect>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={12} lg={2} sx={{ display: "flex", justifyContent: {xs: "stretch", lg: "flex-end"} }}>
                    <ExportButton onClick={exportToExcel} variant="contained" disabled={exportLoading} fullWidth>
                        {exportLoading ? (
                        <CircularProgress size={22} color="inherit" sx={{mr: 1}} />
                        ) : (
                        <DownloadIcon sx={{mr: 0.5}} />
                        )}
                        {exportLoading ? "Exporting..." : "Export Excel"}
                    </ExportButton>
                </Grid>
            </Grid>
        </SectionPaper>

        {exportLoading && (
          <Box sx={{mb: 3}}>
            <Typography variant="caption" display="block" gutterBottom textAlign="center">Exporting data: {exportProgress}%</Typography>
            <LinearProgress variant="determinate" value={exportProgress} sx={{ borderRadius: "4px", height: "8px" }} />
          </Box>
        )}

        <SectionPaper elevation={3}>
            <Typography variant="h5" component="h2" fontWeight="700" color="text.primary" gutterBottom sx={{mb: 2.5}}>
                Financial Summary
            </Typography>
            <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={6} md={4}>
                    <SummaryCard bgColor={(theme) => `linear-gradient(135deg, ${theme.palette.success.light}, ${theme.palette.success.main})`}>
                        <CardContent sx={{width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
                            <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1}>
                                <TrendingUpIcon sx={{ fontSize: {xs: 28, sm: 32, md: 36} }} />
                                <Typography variant="h6" fontWeight="600" sx={{fontSize: {xs: "1rem", sm: "1.1rem", md: "1.25rem"}}}>
                                Total Revenues
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: {xs: "1.75rem", sm: "2rem", md: "2.25rem"} }}>
                                {totals.Revenues.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </SummaryCard>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <SummaryCard bgColor={(theme) => `linear-gradient(135deg, ${theme.palette.error.light}, ${theme.palette.error.main})`}>
                         <CardContent sx={{width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
                            <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1}>
                                <TrendingDownIcon sx={{ fontSize: {xs: 28, sm: 32, md: 36} }} />
                                <Typography variant="h6" fontWeight="600" sx={{fontSize: {xs: "1rem", sm: "1.1rem", md: "1.25rem"}}}>
                                Total Expenses
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: {xs: "1.75rem", sm: "2rem", md: "2.25rem"} }}>
                                {totals.Expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </SummaryCard>
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                    <SummaryCard
                        bgColor={(theme) => balance >= 0
                            ? `linear-gradient(135deg, ${theme.palette.info.light}, ${theme.palette.info.main})`
                            : `linear-gradient(135deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`
                        }
                    >
                        <CardContent sx={{width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
                            <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1}>
                                <AccountBalanceIcon sx={{ fontSize: {xs: 28, sm: 32, md: 36} }} />
                                <Typography variant="h6" fontWeight="600" sx={{fontSize: {xs: "1rem", sm: "1.1rem", md: "1.25rem"}}}>
                                Net Balance
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: {xs: "1.75rem", sm: "2rem", md: "2.25rem"} }}>
                                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </SummaryCard>
                </Grid>
            </Grid>
        </SectionPaper>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{py: 10}}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : filteredItems.length === 0 ? (
          <SectionPaper elevation={3} sx={{textAlign: "center", py: 5}}>
            <Typography variant="h5" color="text.secondary" fontWeight="500">
              No budget items found for the selected filters.
            </Typography>
            <Typography variant="body1" color="text.hint" sx={{mt:1}}>
              Try adjusting your filters or adding new items.
            </Typography>
          </SectionPaper>
        ) : (
          groupByDate(filteredItems).map(([date, items]) => (
            <Box key={date} sx={{ marginBottom: 4 }}>
              <StyledDateCard>
                <CalendarTodayIcon sx={{ fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {format(new Date(date), "dd MMMM yyyy")}
                </Typography>
              </StyledDateCard>
              <Grid container spacing={3} justifyContent="flex-start">
                {items
                  .filter((item) => item.CategoriesId)
                  .map((item, index) => (
                    <Grid item key={`${item.CategoriesId?._id}-${item.date}-${index}`} xs={12} md={6} lg={4}>
                      <StyledCard>
                        <ImageContainer>
                          <img
                            src={getImageUrl(item.CategoriesId.image)}
                            alt={item.CategoriesId.categoryName || "Category Image"}
                          />
                        </ImageContainer>
                        <CardContent
                          sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between", 
                            alignItems: {xs: "center", sm: "flex-start"},
                            textAlign: {xs: "center", sm: "left"},
                            width: "100%",
                            overflow: "hidden", 
                            py: {xs: 1, sm: 0.5}, 
                            px: {xs: 0, sm: 1}
                          }}
                        >
                          <Box sx={{width: "100%", mb: 1.5, overflow: "hidden"}}> 
                            <Typography
                                variant="h5"
                                component="div"
                                noWrap={false} 
                                sx={{
                                color:
                                    item.CategoriesId.categoryType === "Revenues"
                                    ? "success.main"
                                    : "error.main",
                                fontWeight: "700",
                                mb: 0.5,
                                wordBreak: "break-word",
                                lineHeight: 1.3
                                }}
                            >
                                {item.CategoriesId.categoryType === "Expenses"
                                ? `-`
                                : `+`}
                                {parseFloat(item.valueitem).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} sx={{ justifyContent: {xs: "center", sm: "flex-start"}}}>
                                <CategoryIcon
                                sx={{
                                    color:
                                    item.CategoriesId.categoryType === "Revenues"
                                        ? "success.dark"
                                        : "error.dark",
                                    fontSize: "1.1rem"
                                }}
                                />
                                <Typography
                                variant="h6"
                                noWrap={false} 
                                sx={{
                                    color: "text.primary",
                                    fontWeight: "600",
                                    fontSize: "1rem", 
                                    wordBreak: "break-word",
                                    whiteSpace: "normal", 
                                }}
                                >
                                {item.CategoriesId.categoryName}
                                </Typography>
                            </Box>
                          </Box>
                          <Box
                            display="flex"
                            justifyContent={{xs: "center", sm: "flex-end"}}
                            gap={1.5}
                            sx={{ width: "100%", mt: "auto" }} 
                          >
                            <StyledButton
                              variant="outlined"
                              color="primary"
                              onClick={() => handleUpdateClick(item)}
                              startIcon={<EditIcon />}
                              size="small"
                            >
                              Update
                            </StyledButton>
                            <StyledButton
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteClick(item)}
                              startIcon={<DeleteIcon />}
                              size="small"
                            >
                              Delete
                            </StyledButton>
                          </Box>
                        </CardContent>
                      </StyledCard>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          ))
        )}

        <StyledUpdateDialog open={openDialog} onClose={handleCloseDialog}>
          <DialogHeader onClose={handleCloseDialog}>
            Update Budget Item
          </DialogHeader>
          <StyledDialogContent>
            <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 0.5 }}>
              Item: <Typography component="span" fontWeight="600" color="text.primary">{selectedItem?.CategoriesId?.categoryName}</Typography>
            </Typography>
             <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 2 }}>
              Current Value: <Typography component="span" fontWeight="600" color="text.primary">{parseFloat(selectedItem?.valueitem || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
            </Typography>
            <StyledTextField
              autoFocus
              margin="dense"
              label="New Value"
              type="number"
              fullWidth
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            />
          </StyledDialogContent>
          <StyledDialogActions>
            <StyledButton
              onClick={handleCloseDialog}
              color="secondary"
              variant="text"
            >
              Cancel
            </StyledButton>
            <StyledButton
              onClick={handleSaveUpdate}
              color="primary"
              variant="contained"
              startIcon={<SaveIcon />}
            >
              Save Changes
            </StyledButton>
          </StyledDialogActions>
        </StyledUpdateDialog>

        <StyledDialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
            <DeleteDialogHeader onClose={handleCloseDeleteDialog}>
                Confirm Deletion
            </DeleteDialogHeader>
            <StyledDialogContent>
                <Typography variant="body1" sx={{ mb: 1 }}>
                    Are you sure you want to delete the item 
                    <Typography component="span" fontWeight="bold"> {itemToDelete?.CategoriesId?.categoryName} </Typography>
                    dated 
                    <Typography component="span" fontWeight="bold"> {itemToDelete ? format(new Date(itemToDelete.date), "dd/MM/yyyy") : ""} </Typography>
                    with value 
                    <Typography component="span" fontWeight="bold"> {itemToDelete?.valueitem ? parseFloat(itemToDelete.valueitem).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}? </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    This action cannot be undone.
                </Typography>
            </StyledDialogContent>
            <StyledDialogActions>
                <StyledButton onClick={handleCloseDeleteDialog} color="secondary" variant="text">
                    Cancel
                </StyledButton>
                <StyledButton onClick={confirmDelete} color="error" variant="contained" startIcon={<DeleteIcon />}>
                    Delete Item
                </StyledButton>
            </StyledDialogActions>
        </StyledDialog>

      </PageContainer>
    </LocalizationProvider>
  );
};

export default BudgetItems;

