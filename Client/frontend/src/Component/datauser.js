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
} from "@mui/material";
import { styled } from "@mui/system";
import CategoryIcon from "@mui/icons-material/Category";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as XLSX from "xlsx";

// ==========================
// تعريف المكونات المُنسّقة (Styled Components)
// ==========================
const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "20px",
  borderRadius: "16px",
  border: "none",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  background: "linear-gradient(135deg, #ffffff, #f8f8f8)",
  width: "100%",
  maxWidth: "450px",
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
  },
}));

const ImageContainer = styled("div")(({ theme }) => ({
  flex: "0 0 100px",
  marginRight: "16px",
  borderRadius: "50%",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  width: "100px",
  height: "100px",
  [theme.breakpoints.down("sm")]: {
    marginRight: 0,
    marginBottom: "16px",
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

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "20px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    border: "none",
  },
}));

// مكون جديد لتكبير حجم نافذة تحديث البند فقط
const StyledUpdateDialog = styled(StyledDialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    minWidth: "500px", // تم تكبير حجم الديالوج هنا
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: "linear-gradient(90deg, #007BFF, #00C6FF)",
  color: "#fff",
  textAlign: "center",
  padding: theme.spacing(2),
  fontSize: "1.5rem",
  fontWeight: 600,
  position: "relative",
}));

const DeleteDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: "linear-gradient(90deg, #ef5350, #e53935)",
  color: "#fff",
  textAlign: "center",
  padding: theme.spacing(2),
  fontSize: "1.5rem",
  fontWeight: 600,
  position: "relative",
}));

// رأس الحوار الموحد مع أيقونة الإغلاق
const DialogHeader = ({ children, onClose }) => (
  <StyledDialogTitle>
    {children}
    {onClose ? (
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "#fff",
        }}
      >
        <CloseIcon />
      </IconButton>
    ) : null}
  </StyledDialogTitle>
);

// رأس الحوار الخاص بالحذف
const DeleteDialogHeader = ({ children, onClose }) => (
  <DeleteDialogTitle>
    {children}
    {onClose ? (
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "#fff",
        }}
      >
        <CloseIcon />
      </IconButton>
    ) : null}
  </DeleteDialogTitle>
);

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "#f9f9f9",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    "& fieldset": {
      borderColor: "#007BFF",
    },
    "&:hover fieldset": {
      borderColor: "#0056b3",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#007BFF",
    },
  },
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: "#f9f9f9",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: "8px",
  fontWeight: "600",
  padding: "10px 20px",
  textTransform: "none",
  transition: "all 0.3s ease",
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  },
}));

const ExportButton = styled(StyledButton)(({ theme }) => ({
  background: "linear-gradient(135deg, #4CAF50, #43A047)",
  color: "#fff",
  "&:hover": {
    background: "linear-gradient(135deg, #43A047, #388E3C)",
  },
  display: "flex",
  alignItems: "center",
  gap: "8px",
}));

// ==========================
// المكون الرئيسي BudgetItems
// ==========================
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

  // حالة وبيانات نافذة تأكيد الحذف
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const token = sessionStorage.getItem("jwt");

  useEffect(() => {
    fetchBudget();
  }, []);

  // دالة جلب البيانات مع فلترة العناصر التي ليس لها فئة
  const fetchBudget = async () => {
    try {
      const response = await axios.get("https://fin-tracker-ncbx.onrender.com/api/getUserBudget", {
        headers: {
          Auth: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      // فلترة العناصر التي لا تحتوي على CategoriesId لتجنب حدوث الخطأ
      setBudgetItems((response.data.products || []).filter(item => item.CategoriesId));
    } catch (error) {
      console.error("Error fetching budget", error);
    } finally {
      setLoading(false);
    }
  };

  // دالة لفتح نافذة تأكيد الحذف
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // دالة تأكيد الحذف واستدعاء API الحذف
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await axios.delete("https://fin-tracker-ncbx.onrender.com/api/deleteBudget", {
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
    handleCloseDeleteDialog();
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
      alert("الرجاء إدخال رقم صالح للقيمة.");
      return;
    }

    try {
      const response = await axios.put(
        "https://fin-tracker-ncbx.onrender.com/api/updateBudget",
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
        console.log("تم تحديث العنصر بنجاح", response.data);
        setBudgetItems((prevItems) =>
          prevItems.map((item) =>
            item.CategoriesId._id === selectedItem.CategoriesId._id &&
            new Date(item.date).toISOString() === new Date(selectedItem.date).toISOString()
              ? { ...item, valueitem: numericValue }
              : item
          )
        );
        handleCloseDialog();
      } else {
        console.error("فشل تحديث العنصر", response.data);
      }
    } catch (error) {
      console.error("خطأ في تحديث الميزانية", error.response?.data || error.message);
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

  // دالة التصفية مع التأكد من وجود بيانات الفئة
  const filterItems = (items) => {
    let filteredItems = items.filter(item => item.CategoriesId);

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

  // تحديث uniqueItems مع فلترة العناصر التي ليس لها CategoriesId
  const uniqueItems =
    filterType === "all"
      ? [...new Set(budgetItems.filter(item => item.CategoriesId).map(item => item.CategoriesId.categoryName))]
      : [
          ...new Set(
            budgetItems
              .filter(item => item.CategoriesId && item.CategoriesId.categoryType === filterType)
              .map(item => item.CategoriesId.categoryName)
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

  // تم تعديل دالة التصدير إلى Excel لتكون استجابة الزر أسرع دون تأخيرات زائدة
  const exportToExcel = async () => {
    setExportLoading(true);
    setExportProgress(0);

    const wsData = filteredItems.map((item) => ({
      Date: new Date(item.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
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

    // تطبيق نمط للعنوان (ملاحظة: قد لا تعمل تنسيقات الخلايا بشكل مثالي مع مكتبة XLSX في جميع الحالات)
    const headerCellStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "FFFF00" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { horizontal: "center" },
    };

    const headers = ["Date", "Item", "Type", "Value"];
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (ws[cellAddress]) {
        ws[cellAddress].s = headerCellStyle;
      }
    });

    // تحديث سريع لتقدم العملية قبل بدء التصدير
    setExportProgress(50);

    setTimeout(() => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BudgetItems");
      XLSX.writeFile(wb, "BudgetItems.xlsx");
      setExportProgress(100);
      setExportLoading(false);
      setExportProgress(0);
    }, 100); // تأخير قصير جداً (100 مللي ثانية)
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: { xs: 2, sm: 4 }, background: "#f5f5f5", minHeight: "100vh" }}>
        {/* عناصر التحكم */}
        <Box
          sx={{
            marginBottom: 4,
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
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
            onChange={(newValue) => {
              if (newValue && !isNaN(new Date(newValue).getTime())) {
                setFilterDate(newValue);
              }
            }}
            renderInput={(params) => <TextField {...params} sx={{ minWidth: 180 }} />}
          />
          <FormControl sx={{ minWidth: 120 }}>
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
          <FormControl sx={{ minWidth: 120 }}>
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
          <ExportButton onClick={exportToExcel} variant="contained" disabled={exportLoading}>
            {exportLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <DownloadIcon />
            )}
            {exportLoading ? "Exporting..." : "Export to Excel"}
          </ExportButton>
        </Box>

        {exportLoading && (
          <LinearProgress variant="determinate" value={exportProgress} sx={{ marginBottom: 2 }} />
        )}

        {/* بطاقات الإجماليات */}
        <Box
          sx={{
            marginBottom: 4,
            display: "flex",
            justifyContent: "center",
            gap: 4,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
          }}
        >
          <Card
            sx={{
              minWidth: 200,
              textAlign: "center",
              background: "linear-gradient(135deg, #66bb6a, #43a047)",
              color: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
              background: "linear-gradient(135deg, #ef5350, #e53935)",
              color: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
              background:
                balance >= 0
                  ? "linear-gradient(135deg, #66bb6a, #43a047)"
                  : "linear-gradient(135deg, #ef5350, #e53935)",
              color: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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

        {/* قائمة البنود */}
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
          groupByDate(filteredItems).map(([date, items]) => (
            <Box key={date} sx={{ marginBottom: 4 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  color: "#333",
                  fontWeight: "bold",
                  marginBottom: "24px",
                  textAlign: "center",
                }}
              >
                {new Date(date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                {items
                  .filter(item => item.CategoriesId)
                  .map((item, index) => (
                    <Grid item key={index} xs={12} sm={6}>
                      <StyledCard>
                        <ImageContainer>
                          <img
                            src={`https://fin-tracker-ncbx.onrender.com/${item.CategoriesId.image}`}
                            alt="Category"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </ImageContainer>
                        <CardContent
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              color:
                                item.CategoriesId.categoryType === "Revenues"
                                  ? "#4CAF50"
                                  : "#F44336",
                              fontWeight: "600",
                            }}
                          >
                            {item.CategoriesId.categoryType === "Expenses"
                              ? `-${item.valueitem}`
                              : item.valueitem}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CategoryIcon sx={{ color: "#007BFF" }} />
                            <Typography variant="h5" sx={{ color: "#007BFF", fontWeight: "bold" }}>
                              {item.CategoriesId.categoryName}
                            </Typography>
                          </Box>
                          <Box
                            display="flex"
                            justifyContent="center"
                            gap={1}
                            sx={{ marginTop: 2, flexDirection: { xs: "column", sm: "row" } }}
                          >
                            <StyledButton
                              variant="contained"
                              color="error"
                              onClick={() => handleDeleteClick(item)}
                            >
                              Delete
                            </StyledButton>
                            <StyledButton
                              variant="contained"
                              color="primary"
                              onClick={() => handleUpdateClick(item)}
                            >
                              Update
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

        {/* نافذة تحديث البند */}
        <StyledUpdateDialog open={openDialog} onClose={handleCloseDialog}>
          <DialogHeader onClose={handleCloseDialog}>
            Update Budget Item
          </DialogHeader>
          <StyledDialogContent>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Item Name: {selectedItem?.CategoriesId?.categoryName}
            </Typography>
            <StyledTextField
              autoFocus
              margin="dense"
              label="Value"
              type="text"
              fullWidth
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
          </StyledDialogContent>
          <StyledDialogActions>
            <StyledButton onClick={handleCloseDialog} color="secondary" variant="outlined">
              Cancel
            </StyledButton>
            <StyledButton onClick={handleSaveUpdate} color="primary" variant="contained">
              Save
            </StyledButton>
          </StyledDialogActions>
        </StyledUpdateDialog>

        {/* نافذة تأكيد الحذف */}
        <StyledDialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DeleteDialogHeader onClose={handleCloseDeleteDialog}>
            Confirm Deletion
          </DeleteDialogHeader>
          <StyledDialogContent>
            <Typography variant="body1">
              Are you sure you want to delete the item:{" "}
              <strong>{itemToDelete?.CategoriesId?.categoryName}</strong>?
            </Typography>
          </StyledDialogContent>
          <StyledDialogActions>
            <StyledButton onClick={handleCloseDeleteDialog} color="secondary" variant="outlined">
              Cancel
            </StyledButton>
            <StyledButton onClick={confirmDelete} color="error" variant="contained">
              Delete
            </StyledButton>
          </StyledDialogActions>
        </StyledDialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BudgetItems;
