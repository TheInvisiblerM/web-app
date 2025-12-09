// src/pages/MassPage.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { debounce } from "lodash";

export default function MassPage() {
  const [children, setChildren] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newChildName, setNewChildName] = useState("");
  const [search, setSearch] = useState("");
  const massCollection = collection(db, "mass");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(massCollection);
        const tempChildren = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return { id: docSnap.id, name: data.name, days: data.days || {} };
        });
        setChildren(tempChildren);
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        alert("❌ فشل تحميل البيانات");
      }
    };
    fetchData();
  }, []);

  const debounceUpdate = debounce(async (docRef, date, field, value) => {
    try {
      await updateDoc(docRef, { [`days.${date}.${field}`]: value }, { merge: true });
    } catch (error) {
      console.error("خطأ في تحديث اليوم:", error);
      alert("❌ فشل تحديث اليوم");
    }
  }, 300);

  const addChild = async () => {
    if (!selectedDate) return alert("⚠️ اختار تاريخ الأول");
    const trimmedName = newChildName.trim();
    if (!trimmedName) return alert("⚠️ أدخل اسم الطفل");

    const childId = trimmedName.replace(/\s+/g, "_") + "_" + Date.now();
    const newChild = { name: trimmedName, days: {} };

    try {
      const docRef = doc(db, "mass", childId);
      await setDoc(docRef, newChild);
      setChildren(prev => [...prev, { id: childId, name: trimmedName, days: {} }]);
      setNewChildName("");
    } catch (error) {
      console.error("خطأ في إضافة الطفل:", error);
      alert("❌ حدث خطأ أثناء الإضافة");
    }
  };

  const updateDay = (childId, field, value) => {
    if (!selectedDate) return alert("⚠️ اختار تاريخ الأول");

    setChildren(prev =>
      prev.map(c => {
        if (c.id === childId) {
          const updatedDays = { ...c.days, [selectedDate]: { ...c.days[selectedDate], [field]: value } };
          return { ...c, days: updatedDays };
        }
        return c;
      })
    );

    const docRef = doc(db, "mass", childId);
    debounceUpdate(docRef, selectedDate, field, value);
  };

  const deleteChild = async (childId) => {
    const docRef = doc(db, "mass", childId);
    try {
      await deleteDoc(docRef);
      setChildren(prev => prev.filter(c => c.id !== childId));
    } catch (error) {
      console.error("خطأ في حذف الطفل:", error);
      alert("❌ فشل حذف الطفل");
    }
  };

  const filteredChildren = children.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 bg-[url('/church-bg.jpg')] bg-cover bg-center bg-fixed">
      <div className="backdrop-blur-md bg-white/90 p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-center text-red-900">⛪ حضور القداس</h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <input
            type="text"
            placeholder="ابحث باسم الطفل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/4 p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="اسم الطفل الجديد..."
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            className="w-full md:w-1/4 p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={addChild}
            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition shadow"
          >
            ➕ إضافة طفل
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full md:w-1/4 p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border shadow rounded-xl text-center min-w-[500px]">
            <thead className="bg-red-800 text-white text-lg sticky top-0">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3 w-60">اسم الطفل</th>
                <th className="p-3 w-24">حضور ✅</th>
                <th className="p-3 w-24">غياب ❌</th>
                <th className="p-3 w-16">حذف</th>
              </tr>
            </thead>
            <tbody>
              {filteredChildren.map((child, idx) => {
                const dayData = child.days[selectedDate] || { present: false, absent: false };
                return (
                  <tr key={child.id} className="even:bg-gray-100 hover:bg-gray-200 transition">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3 text-left">{child.name}</td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        className="w-7 h-7"
                        checked={dayData.present}
                        onChange={(e) => updateDay(child.id, "present", e.target.checked)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        className="w-7 h-7"
                        checked={dayData.absent}
                        onChange={(e) => updateDay(child.id, "absent", e.target.checked)}
                      />
                    </td>
                    <td className="p-3 cursor-pointer text-xl" onClick={() => deleteChild(child.id)}>
                      ❌
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
