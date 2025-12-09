// src/pages/MassPage.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { debounce } from "lodash";

export default function MassPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const massCollection = collection(db, "mass");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(massCollection);
        setRows(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        alert("❌ فشل تحميل البيانات");
      }
    };
    fetchData();
  }, []);

  const addRow = async () => {
    const today = new Date().toISOString().split("T")[0];
    const newRow = { name: "", attended: false, date: today };
    try {
      const docRef = await addDoc(massCollection, newRow);
      setRows(prev => [...prev, { id: docRef.id, ...newRow }]);
    } catch (error) {
      console.error("خطأ في الإضافة:", error);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
  };

  const debounceUpdate = debounce(async (id, field, value) => {
    const docRef = doc(db, "mass", id);
    try {
      await updateDoc(docRef, { [field]: value });
    } catch (error) {
      console.error("خطأ في التحديث:", error);
      alert("❌ فشل تحديث البيانات");
    }
  }, 500);

  const handleChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    debounceUpdate(id, field, value);
  };

  const handleDelete = async (id) => {
    const docRef = doc(db, "mass", id);
    try {
      await deleteDoc(docRef);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("خطأ في الحذف:", error);
      alert("❌ فشل حذف الصف");
    }
  };

  const filteredRows = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-6 bg-[url('/church-bg.jpg')] bg-cover bg-center bg-fixed">
      <div className="backdrop-blur-md bg-white/80 p-6 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-red-900">⛪ حضور القداس – اليوم</h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <input
            type="text"
            placeholder="🔍 ابحث باسم الطفل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/2 p-2 border rounded-xl"
          />
          <button
            onClick={addRow}
            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
          >
            ➕ إضافة صف جديد
          </button>
        </div>

        <table className="w-full border shadow rounded-xl overflow-hidden text-center">
          <thead className="bg-red-800 text-white text-lg">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">اسم الطفل</th>
              <th className="p-3">حضر القداس</th>
              <th className="p-3">التاريخ</th>
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
                    type="checkbox"
                    checked={row.attended}
                    onChange={e => handleChange(row.id, "attended", e.target.checked)}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="date"
                    value={row.date}
                    onChange={e => handleChange(row.id, "date", e.target.value)}
                    className="p-1 border rounded"
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
  );
}
