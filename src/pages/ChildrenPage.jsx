// src/pages/ChildrenPage.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { debounce } from "lodash";

export default function ChildrenPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  // الشهر الحالي تلقائي
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();
    return `${year}-${month}`;
  });

  const childrenCollection = collection(db, "children");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(childrenCollection);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "",
          phone: doc.data().phone || "",
          dateOfBirth: doc.data().dateOfBirth || "",
          address: doc.data().address || "",
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
    const newRow = { name: "", phone: "", dateOfBirth: "", address: "", visited: {} };
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

  // إعادة ضبط الزيارات بشكل آمن
  const handleReset = async () => {
    const updatedRows = rows.map(r => ({
      ...r,
      visited: { ...r.visited, [selectedMonth]: false }
    }));

    setRows(updatedRows);

    // تحديث كل الصفوف في Firebase
    for (const row of updatedRows) {
      const docRef = doc(db, "children", row.id);
      try {
        await updateDoc(docRef, { visited: row.visited });
      } catch (error) {
        console.error(`خطأ في تحديث الزيارات للطفل ${row.name}:`, error);
      }
    }
  };

  const filteredRows = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-6 bg-[url('/church-bg.jpg')] bg-cover bg-center bg-fixed">
      <div className="backdrop-blur-md bg-white/80 p-6 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-red-900">👼 إدارة بيانات الأطفال</h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <input
            type="text"
            placeholder="🔍 ابحث عن اسم الطفل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/2 p-2 border rounded-xl"
          />

          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="p-2 border rounded-xl"
          />

          <div className="flex gap-2">
            <button
              onClick={addRow}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
            >
              ➕ إضافة صف جديد
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition"
            >
              🔄 إعادة ضبط الزيارات
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border shadow rounded-xl overflow-hidden text-center min-w-[700px]">
            <thead className="bg-red-800 text-white text-lg">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">اسم الطفل</th>
                <th className="p-3">رقم الهاتف</th>
                <th className="p-3">تاريخ الميلاد</th>
                <th className="p-3">العنوان</th>
                <th className="p-3">تمت الزيارة ✅</th>
                <th className="p-3">حذف</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id} className="even:bg-gray-100 text-lg">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.name}
                      onChange={e => handleChange(row.id, "name", e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.phone}
                      onChange={e => handleChange(row.id, "phone", e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="date"
                      value={row.dateOfBirth}
                      onChange={e => handleChange(row.id, "dateOfBirth", e.target.value)}
                      className="p-1 border rounded"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.address}
                      onChange={e => handleChange(row.id, "address", e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={row.visited[selectedMonth] || false}
                      onChange={e => handleChange(row.id, "visited", e.target.checked)}
                      className="w-6 h-6 md:w-7 md:h-7"
                    />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
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
