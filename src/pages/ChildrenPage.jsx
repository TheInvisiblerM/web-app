import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

export default function ChildrenPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const childrenCollection = collection(db, "children");

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(childrenCollection);
      setRows(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  const addRow = async () => {
    const newRow = { name: "", phone: "" };
    const docRef = await addDoc(childrenCollection, newRow);
    setRows(prev => [...prev, { id: docRef.id, ...newRow }]);
  };

  const handleChange = async (id, field, value) => {
    const docRef = doc(db, "children", id);
    await updateDoc(docRef, { [field]: value });
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleDelete = async (id) => {
    const docRef = doc(db, "children", id);
    await deleteDoc(docRef);
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const filteredRows = rows.filter(row => row.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-6 bg-[url('/church-bg.jpg')] bg-cover bg-center bg-fixed">
      <div className="backdrop-blur-md bg-white/80 p-6 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-red-900">👼 إدارة بيانات الأطفال</h1>
        <input type="text" placeholder="ابحث بالاسم..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full p-2 mb-4 border rounded"/>
        <button onClick={addRow} className="mb-4 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition">➕ إضافة صف جديد</button>
        <table className="w-full border shadow rounded-xl overflow-hidden text-center">
          <thead className="bg-red-800 text-white text-lg">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">اسم الطفل</th>
              <th className="p-3">رقم التليفون</th>
              <th className="p-3">حذف</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row,index)=>(
              <tr key={row.id} className="even:bg-gray-100 text-lg">
                <td className="p-3">{index+1}</td>
                <td className="p-3"><input type="text" value={row.name} onChange={(e)=>handleChange(row.id,"name",e.target.value)} className="w-full p-1 border rounded"/></td>
                <td className="p-3"><input type="text" value={row.phone} onChange={(e)=>handleChange(row.id,"phone",e.target.value)} className="w-full p-1 border rounded"/></td>
                <td className="p-3"><button onClick={()=>handleDelete(row.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">❌</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
