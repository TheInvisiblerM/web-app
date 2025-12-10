// src/pages/ChildrenPage.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { debounce } from "lodash";
import * as XLSX from "xlsx";

export default function ChildrenPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();
    return `${year}-${month}`;
  });

  const childrenCollection = collection(db, "children");

  const excelDateToJSDate = (serial) => {
    if (!serial) return "";
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const month = (date_info.getMonth() + 1).toString().padStart(2, "0");
    const day = date_info.getDate().toString().padStart(2, "0");
    const year = date_info.getFullYear();
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(childrenCollection);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "",
          phone: doc.data().phone || "",
          address: doc.data().address || "",
          dateOfBirth: doc.data().dateOfBirth || "",
          stage: doc.data().stage || "",
          birthCertificate: doc.data().birthCertificate || "",
          visited: doc.data().visited || {}
        }));
        setRows(data);
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        alert("❌ فشل تحميل البيانات");
      }
    };
    fetchData();
  }, []);

  const addRow = async () => {
    const newRow = { name: "", phone: "", address: "", dateOfBirth: "", stage: "", birthCertificate: "", visited: {} };
    try {
      const docRef = await addDoc(childrenCollection, newRow);
      setRows(prev => [...prev, { id: docRef.id, ...newRow }]);
    } catch (error) {
      console.error("خطأ في الإضافة:", error);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
  };

  const debounceUpdate = debounce(async (id, field, value) => {
    const docRef = doc(db, "children", id);
    try {
      await updateDoc(docRef, { [field]: value });
    } catch (error) {
      console.error("خطأ في التحديث:", error);
      alert("❌ فشل تحديث البيانات");
    }
  }, 500);

  const handleChange = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        if (field === "visited") {
          const newVisited = { ...r.visited, [selectedMonth]: value };
          debounceUpdate(id, "visited", newVisited);
          return { ...r, visited: newVisited };
        } else {
          debounceUpdate(id, field, value);
          return { ...r, [field]: value };
        }
      }
      return r;
    }));
  };

  const handleDelete = async (id) => {
    const docRef = doc(db, "children", id);
    try {
      await deleteDoc(docRef);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("خطأ في الحذف:", error);
      alert("❌ فشل حذف الصف");
    }
  };

  const handleReset = async () => {
    const updatedRows = [];
    for (const r of rows) {
      const newVisited = { ...r.visited, [selectedMonth]: false };
      await debounceUpdate(r.id, "visited", newVisited);
      updatedRows.push({ ...r, visited: newVisited });
    }
    setRows(updatedRows);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.every(cell => cell === undefined || cell === null || cell === "")) continue;
        const newRow = {
          name: row[0] || "",
          phone: row[1] || "",
          address: row[2] || "",
          dateOfBirth: typeof row[3] === "number" ? excelDateToJSDate(row[3]) : (row[3] || ""),
          stage: row[4] || "",
          birthCertificate: row[5] || "",
          visited: {}
        };
        try {
          const docRef = await addDoc(childrenCollection, newRow);
          setRows(prev => [...prev, { id: docRef.id, ...newRow }]);
        } catch (error) {
          console.error("خطأ في إضافة البيانات من Excel:", error);
        }
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const filteredRows = rows
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "ar")); // ترتيب أبجدي

  return (
    <div className="min-h-screen p-6 bg-[url('/church-bg.jpg')] bg-cover bg-center bg-fixed">
      <div className="backdrop-blur-md bg-white/80 p-6 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-red-900">👼 إدارة بيانات الأطفال</h1>

        {/* أدوات البحث والشهر والأزرار مرتبة جنب بعض */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2 flex-wrap">
          <input
            type="text"
            placeholder="🔍 ابحث عن اسم الطفل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/4 p-2 border rounded-xl"
          />

          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-full md:w-1/4 p-2 border rounded-xl"
          />

          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={addRow}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition text-sm md:text-base"
            >
              ➕ إضافة صف جديد
            </button>

            <label className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 cursor-pointer transition text-sm md:text-base">
              ⬆️ Upload Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleUpload} className="hidden" />
            </label>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition text-sm md:text-base"
            >
              🔄 إعادة ضبط الزيارات
            </button>
          </div>
        </div>

        {/* الجدول */}
        <div className="overflow-x-auto">
          <table className="w-full border shadow rounded-xl overflow-hidden text-center min-w-[700px]">
            <thead className="bg-red-800 text-white text-lg">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">اسم الطفل</th>
                <th className="p-3">رقم الهاتف</th>
                <th className="p-3">العنوان</th>
                <th className="p-3">تاريخ الميلاد</th>
                <th className="p-3">المرحلة</th>
                <th className="p-3">شهادة الميلاد</th>
                <th className="p-3">تمت الزيارة ✅</th>
                <th className="p-3">حذف</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id} className="even:bg-gray-100 text-lg">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3"><input type="text" value={row.name} onChange={e => handleChange(row.id, "name", e.target.value)} className="w-full p-1 border rounded" /></td>
                  <td className="p-3"><input type="text" value={row.phone} onChange={e => handleChange(row.id, "phone", e.target.value)} className="w-full p-1 border rounded" /></td>
                  <td className="p-3"><input type="text" value={row.address} onChange={e => handleChange(row.id, "address", e.target.value)} className="w-full p-1 border rounded" /></td>
                  <td className="p-3"><input type="text" value={row.dateOfBirth} onChange={e => handleChange(row.id, "dateOfBirth", e.target.value)} className="w-full p-1 border rounded" /></td>
                  <td className="p-3"><input type="text" value={row.stage} onChange={e => handleChange(row.id, "stage", e.target.value)} className="w-full p-1 border rounded" /></td>
                  <td className="p-3"><input type="text" value={row.birthCertificate} onChange={e => handleChange(row.id, "birthCertificate", e.target.value)} className="w-full p-1 border rounded" /></td>
                  <td className="p-3">
                    <input type="checkbox" checked={row.visited[selectedMonth] || false} onChange={e => handleChange(row.id, "visited", e.target.checked)} className="w-6 h-6 md:w-7 md:h-7" />
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(row.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
