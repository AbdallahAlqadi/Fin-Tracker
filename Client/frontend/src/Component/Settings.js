import React from "react";

function Settings() {
  // نفترض أن الـ JWT مخزّن في localStorage تحت المفتاح "token"
  const token = localStorage.getItem("token");

  const handleDeleteAll = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5004/deleteallBudget", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Auth: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        alert("تم حذف جميع المصاريف والنفقات بنجاح.");
        // في حال أردت تحديث واجهة المستخدم بعد الحذف، يمكنك فعل ذلك هنا
      } else {
        // عرض رسالة الخطأ الواردة من السيرفر
        alert(data.error || "حدث خطأ أثناء محاولة الحذف.");
      }
    } catch (err) {
      console.error("Error deleting all budget items:", err);
      alert("تعذّر الاتصال بالخادم. حاول مرة أخرى.");
    }
  };

  return (
    <>
      <button
        style={{
          padding: "10px 20px",
          backgroundColor: "#e74c3c",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={handleDeleteAll}
      >
        حذف كل المصاريف
      </button>
    </>
  );
}

export default Settings;
