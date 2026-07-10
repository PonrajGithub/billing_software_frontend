// import { useEffect, useState, useCallback } from "react";
// import api from "../../services/api";

// import {
//   ChevronLeft,
//   ChevronRight,
//   Filter,
//   X,
//   Download,
//   FileDown,
//   AlertCircle,
//   Clock,
// } from "lucide-react";

// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// /* ─── Inject Styles ─────────────────────────────────────────── */
// function useStyles() {
//   useEffect(() => {
//     const id = "pending-styles-v2";
//     if (document.getElementById(id)) return;
//     const s = document.createElement("style");
//     s.id = id;
//     s.innerHTML = `
//       @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
//       * { box-sizing: border-box; }
//       @keyframes fadeSlide {
//         from { opacity:0; transform:translateY(-8px); }
//         to   { opacity:1; transform:none; }
//       }
//       .pp-filter-panel { animation: fadeSlide .25s ease both; }
//       .pp-filter-input:focus {
//         border-color: #6366f1 !important;
//         box-shadow: 0 0 0 3px rgba(99,102,241,.08) !important;
//         outline: none;
//       }
//       .pp-row:hover td { background: #f8fafc !important; }
//       .pp-dl-btn:hover { opacity:.88; transform:translateY(-1px); }
//       .pp-dl-btn { transition: all .18s; }
//     `;
//     document.head.appendChild(s);
//     return () => document.head.removeChild(s);
//   }, []);
// }

// /* ─── Constants ───────────────────────────────────────────────── */
// const FONT  = "'Plus Jakarta Sans', sans-serif";
// const INDIGO = "#4338ca";
// const PAYMENT_METHODS  = ["all", "cash", "online", "upi", "credit"];
// const PAYMENT_STATUSES = ["all", "not_paid", "partial"];
// const DUE_STATUSES     = ["all", "overdue", "upcoming"];

// const METHOD_LABEL = {
//   all: "All Methods", cash: "Cash", online: "Online", upi: "UPI", credit: "Credit",
// };
// const STATUS_LABEL = {
//   all: "All Status", not_paid: "Not Paid", partial: "Partial",
// };
// const DUE_LABEL = {
//   all: "All Due", overdue: "Overdue", upcoming: "Upcoming",
// };

// /* ─── Toast Hook ─────────────────────────────────────────────── */
// function useToast() {
//   const [toasts, setToasts] = useState([]);
//   const show = (type, msg) => {
//     const id = Date.now();
//     setToasts(prev => [...prev, { id, type, msg }]);
//     setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
//   };
//   return { toasts, show };
// }

// function Toasts({ toasts }) {
//   return (
//     <div style={{
//       position: "fixed", top: 20, right: 20,
//       zIndex: 9999, display: "flex", flexDirection: "column", gap: 10,
//     }}>
//       {toasts.map(t => (
//         <div key={t.id} style={{
//           background: t.type === "success" ? "#16a34a" : "#dc2626",
//           color: "#fff", padding: "12px 18px",
//           borderRadius: 12, fontWeight: 600,
//           boxShadow: "0 8px 24px rgba(0,0,0,.12)",
//         }}>{t.msg}</div>
//       ))}
//     </div>
//   );
// }

// /* ─── Summary Card ───────────────────────────────────────────── */
// function SCard({ label, value, color, icon }) {
//   return (
//     <div style={{
//       background: "#fff", border: "1.5px solid #e0e7ff",
//       borderRadius: 16, padding: "14px 20px",
//       display: "flex", alignItems: "center", gap: 14,
//       minWidth: 160, flex: 1,
//     }}>
//       <div style={{
//         width: 38, height: 38, borderRadius: 11,
//         background: color + "18",
//         display: "flex", alignItems: "center", justifyContent: "center",
//       }}>{icon}</div>
//       <div>
//         <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{label}</div>
//         <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b" }}>{value}</div>
//       </div>
//     </div>
//   );
// }

// /* ─── Main ───────────────────────────────────────────────────── */
// export default function PaymentPending() {
//   useStyles();
//   const { toasts, show } = useToast();

//   const [data,        setData]        = useState([]);
//   const [summary,     setSummary]     = useState(null);
//   const [loading,     setLoading]     = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showFilter,  setShowFilter]  = useState(false);

//   /* filter fields */
//   const [fromDate,       setFromDate]       = useState("");
//   const [toDate,         setToDate]         = useState("");
//   const [paymentMethod,  setPaymentMethod]  = useState("all");
//   const [paymentStatus,  setPaymentStatus]  = useState("all");
//   const [customerFilter, setCustomerFilter] = useState("");
//   const [dueStatus,      setDueStatus]      = useState("all");

//   const recordsPerPage = 10;

//   /* badge count */
//   const appliedCount = [
//     fromDate || toDate,
//     paymentMethod !== "all",
//     paymentStatus !== "all",
//     customerFilter,
//     dueStatus !== "all",
//   ].filter(Boolean).length;

//   /* ── fetch ── */
//   const fetchData = useCallback(async (overrides = {}) => {
//     setLoading(true);
//     try {
//       const user = JSON.parse(localStorage.getItem("user"));
//       if (!user?.company_id) return;
//       const res = await api.post("/invoice/get_filtered_pending", {
//         company_id:     user.company_id,
//         from_date:      overrides.fromDate      ?? fromDate,
//         to_date:        overrides.toDate        ?? toDate,
//         payment_method: overrides.paymentMethod ?? paymentMethod,
//         payment_status: overrides.paymentStatus ?? paymentStatus,
//         customer_name:  overrides.customerFilter ?? customerFilter,
//         due_status:     overrides.dueStatus     ?? dueStatus,
//       });
//       if (res.data.status) {
//         setData(res.data.data);
//         setSummary(res.data.summary);
//         setCurrentPage(1);
//       }
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }, [fromDate, toDate, paymentMethod, paymentStatus, customerFilter, dueStatus]);

//   useEffect(() => { fetchData(); }, []); // eslint-disable-line

//   /* ── date format ── */
//   const formatDate = (date) => {
//     if (!date) return "-";
//     return new Date(date.replace(" ", "T")).toLocaleDateString("en-IN", {
//       day: "2-digit", month: "short", year: "numeric",
//     });
//   };

//   /* ── WhatsApp ── */
//   const sendReminder = (phone, name, amount, dueDate) => {
//     const msg =
//       `Hi ${name},\n\nYour payment ₹${amount} is due on ${formatDate(dueDate)}.\n\nKindly pay on time. Thank you!`;
//     window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank");
//   };

//   /* ── mark paid ── */
//   const markPaid = async (invoice_no, pay_amount) => {
//     const res = await api.post("/invoice/mark_as_paid", { invoice_no, pay_amount });
//     if (res.data.status) {
//       show("success", res.data.message);
//       fetchData();
//     } else {
//       show("error", res.data.message || "Failed");
//     }
//   };

//   /* ── apply / reset filter ── */
//   const applyFilter = () => { fetchData(); };
//   const resetFilter = () => {
//     const defaults = {
//       fromDate: "", toDate: "",
//       paymentMethod: "all", paymentStatus: "all",
//       customerFilter: "", dueStatus: "all",
//     };
//     setFromDate(""); setToDate(""); setPaymentMethod("all");
//     setPaymentStatus("all"); setCustomerFilter(""); setDueStatus("all");
//     fetchData(defaults);
//   };

//   /* ── pagination ── */
//   const totalPages   = Math.ceil(data.length / recordsPerPage);
//   const indexOfFirst = (currentPage - 1) * recordsPerPage;
//   const currentData  = data.slice(indexOfFirst, indexOfFirst + recordsPerPage);
//   const pages        = Array.from({ length: totalPages }, (_, i) => i + 1);
//   const goTo         = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

//   /* ── filter label ── */
//   const filterLabel = () => {
//     const parts = [];
//     if (fromDate) parts.push(`from_${fromDate}`);
//     if (toDate)   parts.push(`to_${toDate}`);
//     if (paymentMethod !== "all") parts.push(paymentMethod);
//     if (paymentStatus !== "all") parts.push(paymentStatus);
//     if (dueStatus !== "all")     parts.push(dueStatus);
//     return parts.join("_") || "all";
//   };

//   /* ── Excel download ── */
//   const downloadExcel = () => {
//     if (!data.length) { alert("No data to export"); return; }
//     const rows = data.map((item, i) => ({
//       "S.No":           i + 1,
//       "Invoice No":     item.invoice_no,
//       "Customer":       item.customer_name,
//       "Phone":          item.customer_phone,
//       "Total":          `₹${Number(item.total_amount).toLocaleString()}`,
//       "Paid":           `₹${Number(item.paid_amount_total).toLocaleString()}`,
//       "Pending":        `₹${Number(item.balance_amount).toLocaleString()}`,
//       "Credit Limit":   `₹${Number(item.credit_limit).toLocaleString()}`,
//       "Method":         item.payment_method,
//       "Status":         item.payment_status,
//       "Due Date":       item.due_date ? formatDate(item.due_date) : "-",
//       "Overdue":        item.is_overdue ? "Yes" : "No",
//       "Invoice Date":   item.created_at,
//     }));
//     const ws = XLSX.utils.json_to_sheet(rows);
//     ws["!cols"] = [
//       { wch: 6 }, { wch: 20 }, { wch: 26 }, { wch: 14 },
//       { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
//       { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 20 },
//     ];
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Pending Payments");
//     const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     saveAs(
//       new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
//       `pending_payments_${filterLabel()}.xlsx`
//     );
//   };

//   /* ── PDF download ── */
//   const downloadPDF = () => {
//     if (!data.length) { alert("No data to export"); return; }
//     const doc = new jsPDF({ orientation: "landscape" });
//     doc.setFontSize(14);
//     doc.setTextColor(67, 56, 202);
//     doc.text("Pending Payments Report", 14, 16);
//     doc.setFontSize(9);
//     doc.setTextColor(120, 120, 120);
//     doc.text(`Generated: ${new Date().toLocaleString("en-IN")}   |   Filter: ${filterLabel()}`, 14, 23);

//     autoTable(doc, {
//       startY: 28,
//       head: [["#", "Invoice", "Customer", "Phone", "Total", "Paid", "Pending", "Method", "Status", "Due Date", "Overdue"]],
//       body: data.map((item, i) => [
//         i + 1,
//         item.invoice_no,
//         item.customer_name,
//         item.customer_phone,
//         `₹${Number(item.total_amount).toLocaleString()}`,
//         `₹${Number(item.paid_amount_total).toLocaleString()}`,
//         `₹${Number(item.balance_amount).toLocaleString()}`,
//         item.payment_method,
//         item.payment_status,
//         item.due_date ? formatDate(item.due_date) : "-",
//         item.is_overdue ? "YES" : "No",
//       ]),
//       headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: "bold", fontSize: 8 },
//       bodyStyles: { fontSize: 8 },
//       alternateRowStyles: { fillColor: [238, 242, 255] },
//       didParseCell: (d) => {
//         if (d.section === "body" && d.column.index === 10) {
//           if (d.cell.raw === "YES") d.cell.styles.textColor = [220, 38, 38];
//         }
//       },
//       styles: { cellPadding: 3 },
//     });

//     const finalY = doc.lastAutoTable.finalY + 8;
//     doc.setFontSize(9);
//     doc.setTextColor(67, 56, 202);
//     doc.text(
//       `Total Records: ${data.length}  |  ` +
//       `Total Pending: ₹${data.reduce((s, r) => s + Number(r.balance_amount), 0).toLocaleString()}  |  ` +
//       `Overdue: ${data.filter(r => r.is_overdue).length} records`,
//       14, finalY
//     );
//     doc.save(`pending_payments_${filterLabel()}.pdf`);
//   };

//   /* ── shared input style ── */
//   const inputStyle = {
//     width: "100%", padding: "9px 12px",
//     border: "1.5px solid #e0e7ff", borderRadius: 10,
//     fontSize: 12, fontFamily: FONT,
//     background: "#fff", color: "#1e1b4b",
//   };

//   const btnPrimary = {
//     border: "none", color: "#fff",
//     padding: "10px 16px", borderRadius: 12,
//     fontSize: 12, fontWeight: 700,
//     cursor: "pointer", fontFamily: FONT,
//     display: "flex", alignItems: "center", gap: 7,
//   };

//   /* ── render ── */
//   return (
//     <>
//       <Toasts toasts={toasts} />
//       <div style={{ padding: 24, fontFamily: FONT, background: "#f8fafc", minHeight: "100vh" }}>

//         {/* HEADER */}
//         <div style={{
//           display: "flex", alignItems: "center",
//           justifyContent: "space-between", marginBottom: 20,
//           flexWrap: "wrap", gap: 14,
//         }}>
//           <div>
//             <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>
//               💰 Pending Payments
//             </h2>
//             <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af" }}>
//               Advanced filter — overdue tracking, PDF & Excel export
//             </p>
//           </div>

//           <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//             <button
//               className="pp-dl-btn"
//               onClick={downloadExcel}
//               style={{ ...btnPrimary, background: "#16a34a" }}
//             >
//               <Download size={14} /> Excel
//             </button>
//             <button
//               className="pp-dl-btn"
//               onClick={downloadPDF}
//               style={{ ...btnPrimary, background: "#dc2626" }}
//             >
//               <FileDown size={14} /> PDF
//             </button>
//           </div>
//         </div>

//         {/* SUMMARY CARDS */}
//         {summary && (
//           <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
//             <SCard
//               label="Total Pending"
//               value={`₹${Number(summary.total_pending).toLocaleString()}`}
//               color="#dc2626"
//               icon={<AlertCircle size={18} color="#dc2626" />}
//             />
//             <SCard
//               label="Overdue Amount"
//               value={`₹${Number(summary.total_overdue).toLocaleString()}`}
//               color="#d97706"
//               icon={<Clock size={18} color="#d97706" />}
//             />
//             <SCard
//               label="Overdue Records"
//               value={summary.overdue_count}
//               color="#7c3aed"
//               icon={<AlertCircle size={18} color="#7c3aed" />}
//             />
//             <SCard
//               label="Total Records"
//               value={summary.total_records}
//               color="#0891b2"
//               icon={<Clock size={18} color="#0891b2" />}
//             />
//           </div>
//         )}

//         {/* FILTER TOGGLE ROW */}
//         <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
//           <button
//             onClick={() => setShowFilter(v => !v)}
//             style={{
//               ...btnPrimary,
//               background: showFilter ? INDIGO : "#eef2ff",
//               color: showFilter ? "#fff" : INDIGO,
//               position: "relative",
//             }}
//           >
//             <Filter size={14} />
//             Filter
//             {appliedCount > 0 && (
//               <span style={{
//                 position: "absolute", top: -6, right: -6,
//                 background: "#dc2626", color: "#fff",
//                 borderRadius: "50%", width: 18, height: 18,
//                 display: "flex", alignItems: "center",
//                 justifyContent: "center", fontSize: 10, fontWeight: 800,
//               }}>{appliedCount}</span>
//             )}
//           </button>

//           {appliedCount > 0 && (
//             <button
//               onClick={resetFilter}
//               style={{ ...btnPrimary, background: "#fee2e2", color: "#dc2626" }}
//             >
//               <X size={13} /> Reset Filters
//             </button>
//           )}
//         </div>

//         {/* FILTER PANEL */}
//         {showFilter && (
//           <div className="pp-filter-panel" style={{
//             background: "#fff", border: "1.5px solid #e0e7ff",
//             borderRadius: 18, padding: "20px 22px", marginBottom: 18,
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
//             gap: 14,
//           }}>

//             {/* From Date */}
//             <div>
//               <label style={{ fontSize: 11, fontWeight: 700, color: INDIGO, display: "block", marginBottom: 6 }}>
//                 From Date
//               </label>
//               <input type="date" className="pp-filter-input"
//                 value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
//             </div>

//             {/* To Date */}
//             <div>
//               <label style={{ fontSize: 11, fontWeight: 700, color: INDIGO, display: "block", marginBottom: 6 }}>
//                 To Date
//               </label>
//               <input type="date" className="pp-filter-input"
//                 value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
//             </div>

//             {/* Payment Method */}
//             <div>
//               <label style={{ fontSize: 11, fontWeight: 700, color: INDIGO, display: "block", marginBottom: 6 }}>
//                 Payment Method
//               </label>
//               <select className="pp-filter-input"
//                 value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
//                 style={{ ...inputStyle, cursor: "pointer" }}>
//                 {PAYMENT_METHODS.map(m => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
//               </select>
//             </div>

//             {/* Payment Status */}
//             <div>
//               <label style={{ fontSize: 11, fontWeight: 700, color: INDIGO, display: "block", marginBottom: 6 }}>
//                 Payment Status
//               </label>
//               <select className="pp-filter-input"
//                 value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
//                 style={{ ...inputStyle, cursor: "pointer" }}>
//                 {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
//               </select>
//             </div>

//             {/* Due Status */}
//             <div>
//               <label style={{ fontSize: 11, fontWeight: 700, color: INDIGO, display: "block", marginBottom: 6 }}>
//                 Due Status
//               </label>
//               <select className="pp-filter-input"
//                 value={dueStatus} onChange={e => setDueStatus(e.target.value)}
//                 style={{ ...inputStyle, cursor: "pointer" }}>
//                 {DUE_STATUSES.map(d => <option key={d} value={d}>{DUE_LABEL[d]}</option>)}
//               </select>
//             </div>

//             {/* Customer Name */}
//             <div>
//               <label style={{ fontSize: 11, fontWeight: 700, color: INDIGO, display: "block", marginBottom: 6 }}>
//                 Customer Name
//               </label>
//               <input type="text" className="pp-filter-input"
//                 value={customerFilter}
//                 onChange={e => setCustomerFilter(e.target.value)}
//                 placeholder="Search customer…"
//                 style={inputStyle} />
//             </div>

//             {/* Buttons */}
//             <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}>
//               <button onClick={applyFilter}
//                 style={{ ...btnPrimary, background: INDIGO, justifyContent: "center" }}>
//                 Apply Filter
//               </button>
//               <button onClick={resetFilter}
//                 style={{ ...btnPrimary, background: "#f1f5f9", color: "#64748b", justifyContent: "center" }}>
//                 Reset All
//               </button>
//             </div>

//           </div>
//         )}

//         {/* TABLE */}
//         <div style={{
//           background: "#fff", borderRadius: 18,
//           overflow: "hidden", border: "1px solid #e5e7eb",
//           boxShadow: "0 4px 14px rgba(0,0,0,.04)",
//         }}>
//           <div style={{ overflowX: "auto" }}>
//             <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1300 }}>

//               <thead>
//                 <tr style={{ background: "#eef2ff" }}>
//                   {["#", "Invoice", "Customer", "Phone", "Total", "Paid", "Pending",
//                     "Limit", "Due Date", "Status", "Reminder", "Action"].map((h, i) => (
//                     <th key={i} style={th}>{h}</th>
//                   ))}
//                 </tr>
//               </thead>

//               <tbody>
//                 {loading ? (
//                   <tr><td colSpan={12} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
//                     Loading…
//                   </td></tr>
//                 ) : currentData.length === 0 ? (
//                   <tr><td colSpan={12} style={{ padding: 40, textAlign: "center", color: "#64748b", fontWeight: 600 }}>
//                     No Pending Payments
//                   </td></tr>
//                 ) : currentData.map((item, i) => {

//                   const isOverdue  = item.is_overdue;
//                   const showRem    = item.payment_type === "credit"
//                     && Number(item.balance_amount) > 0
//                     && item.due_date;
//                   const returnAmt  = Number(item.pay_amount || 0) > Number(item.balance_amount)
//                     ? Number(item.pay_amount) - Number(item.balance_amount)
//                     : 0;

//                   return (
//                     <tr key={i} className="pp-row" style={{ borderBottom: "1px solid #f1f5f9", fontFamily: FONT }}>

//                       <td style={td}>{indexOfFirst + i + 1}</td>

//                       <td style={tdBlue}>{item.invoice_no}</td>

//                       <td style={td}>{item.customer_name}</td>

//                       <td style={tdLight}>{item.customer_phone}</td>

//                       <td style={td}>₹{Number(item.total_amount).toLocaleString()}</td>

//                       <td style={{ ...td, color: "#16a34a", fontWeight: 700 }}>
//                         ₹{Number(item.paid_amount_total).toLocaleString()}
//                       </td>

//                       <td style={{ ...td, color: "#dc2626", fontWeight: 700 }}>
//                         ₹{Number(item.balance_amount).toLocaleString()}
//                       </td>

//                       <td style={{ ...td, color: "#7c3aed", fontWeight: 700 }}>
//                         ₹{Number(item.credit_limit).toLocaleString()}
//                       </td>

//                       <td style={td}>{item.due_date ? formatDate(item.due_date) : "-"}</td>

//                       <td style={td}>
//                         <span style={{
//                           padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700,
//                           background: isOverdue ? "#fee2e2" : "#fef3c7",
//                           color: isOverdue ? "#dc2626" : "#d97706",
//                         }}>
//                           {isOverdue ? "Overdue" : "Pending"}
//                         </span>
//                       </td>

//                       <td style={td}>
//                         {showRem ? (
//                           <button
//                             onClick={() => sendReminder(item.customer_phone, item.customer_name, item.balance_amount, item.due_date)}
//                             style={{
//                               background: "#22c55e", color: "#fff", border: "none",
//                               padding: "8px 14px", borderRadius: 8,
//                               cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: FONT,
//                             }}
//                           >Send</button>
//                         ) : <span style={{ color: "#9ca3af" }}>—</span>}
//                       </td>

//                       <td style={td}>
//                         <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//                           <input
//                             type="number"
//                             placeholder="Enter amount"
//                             value={item.pay_amount || ""}
//                             onChange={(e) => {
//                               const updated = [...data];
//                               updated[indexOfFirst + i].pay_amount = e.target.value;
//                               setData(updated);
//                             }}
//                             style={{
//                               padding: "8px 10px", border: "1px solid #d1d5db",
//                               borderRadius: 8, width: 140,
//                               fontFamily: FONT, fontSize: 12,
//                             }}
//                           />
//                           {returnAmt > 0 && (
//                             <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
//                               Return ₹{returnAmt.toLocaleString()}
//                             </div>
//                           )}
//                           <button
//                             onClick={() => {
//                               if (!item.pay_amount || Number(item.pay_amount) <= 0) {
//                                 show("error", "Please enter payment amount");
//                                 return;
//                               }
//                               markPaid(item.invoice_no, item.pay_amount);
//                             }}
//                             style={{
//                               background: "#16a34a", color: "#fff", border: "none",
//                               padding: "8px 12px", borderRadius: 8,
//                               cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: FONT,
//                             }}
//                           >Confirm Paid</button>
//                         </div>
//                       </td>

//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* PAGINATION */}
//         {totalPages > 1 && (
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
//             <button
//               onClick={() => goTo(currentPage - 1)}
//               disabled={currentPage === 1}
//               style={pgBtn}
//             >
//               <ChevronLeft size={15} /> Prev
//             </button>

//             <div style={{ display: "flex", gap: 6 }}>
//               {pages.map((p) => (
//                 <button key={p} onClick={() => goTo(p)} style={{
//                   width: 36, height: 36, borderRadius: 10,
//                   border: "1px solid #dbeafe",
//                   background: currentPage === p ? INDIGO : "#fff",
//                   color: currentPage === p ? "#fff" : INDIGO,
//                   fontWeight: 700, cursor: "pointer", fontFamily: FONT,
//                 }}>{p}</button>
//               ))}
//             </div>

//             <button
//               onClick={() => goTo(currentPage + 1)}
//               disabled={currentPage === totalPages}
//               style={pgBtn}
//             >
//               Next <ChevronRight size={15} />
//             </button>
//           </div>
//         )}

//       </div>
//     </>
//   );
// }

// /* ─── Styles ─────────────────────────────────────────────────── */
// const th = {
//   padding: "13px 14px", textAlign: "left",
//   fontSize: 11, color: "#4338ca",
//   fontWeight: 700, whiteSpace: "nowrap",
// };
// const td      = { padding: "13px 14px", whiteSpace: "nowrap", fontSize: 12 };
// const tdLight = { ...td, color: "#6b7280" };
// const tdBlue  = { ...td, color: "#4338ca", fontWeight: 700 };
// const pgBtn   = {
//   display: "flex", alignItems: "center", gap: 6,
//   padding: "8px 16px", background: "#fff",
//   border: "1px solid #dbeafe", borderRadius: 10,
//   cursor: "pointer", color: "#4338ca", fontWeight: 600,
//   fontFamily: "'Plus Jakarta Sans', sans-serif",
// };





//manju
// import { useEffect, useState } from "react";
// import api from "../../services/api";

// import {
//   ChevronLeft,
//   ChevronRight
// } from "lucide-react";

// /* ─── Toast Hook ───────────────── */

// function useToast() {

//   const [toasts, setToasts] = useState([]);

//   const show = (type, msg) => {

//     const id = Date.now();

//     setToasts(prev => [
//       ...prev,
//       { id, type, msg }
//     ]);

//     setTimeout(() => {

//       setToasts(prev =>
//         prev.filter(t => t.id !== id)
//       );

//     }, 3000);

//   };

//   return {
//     toasts,
//     show
//   };

// }

// /* ─── Toast UI ───────────────── */

// function Toasts({ toasts }) {

//   return (

//     <div
//       style={{
//         position: "fixed",
//         top: 20,
//         right: 20,
//         zIndex: 9999,
//         display: "flex",
//         flexDirection: "column",
//         gap: 10
//       }}
//     >

//       {toasts.map(t => (

//         <div
//           key={t.id}
//           style={{
//             background:
//               t.type === "success"
//                 ? "#16a34a"
//                 : "#dc2626",
//             color: "#fff",
//             padding: "12px 18px",
//             borderRadius: 12,
//             fontWeight: 600,
//             boxShadow:
//               "0 8px 24px rgba(0,0,0,.12)",
//             animation: "fadeIn .25s ease"
//           }}
//         >
//           {t.msg}
//         </div>

//       ))}

//     </div>

//   );

// }

// export default function PaymentPending() {

//   const [data, setData] = useState([]);

//   const { toasts, show } = useToast();

//   // ✅ PAGINATION

//   const [currentPage, setCurrentPage] = useState(1);

//   const recordsPerPage = 10;

//   // ✅ FETCH DATA

//   const fetchData = async () => {

//    const company_id =
//   localStorage.getItem("selected_company_id");

// const res = await api.post(
//   "/invoice/get_pending_invoice",
//   {
//     company_id
//   }
// );

//     if (res.data.status) {
//       setData(res.data.data);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // ✅ DATE FORMAT

//   const formatDate = (date) => {

//     if (!date) return "-";

//     const d = new Date(date.replace(" ", "T"));

//     return d.toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short"
//     });
//   };

//   // ✅ WHATSAPP REMINDER

//   const sendReminder = (
//     phone,
//     name,
//     amount,
//     dueDate
//   ) => {

//     const msg = `Hi ${name},

// Your payment ₹${amount} is due on ${formatDate(dueDate)}.

// Kindly pay on time. Thank you!`;

//     const url =
//       `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;

//     window.open(url, "_blank");
//   };

//   // ✅ MARK PAID

//   const markPaid = async (
//     invoice_no,
//     pay_amount
//   ) => {

//     const res = await api.post(
//       "/invoice/mark_as_paid",
//       {
//         invoice_no,
//         pay_amount
//       }
//     );

//     if (res.data.status) {

//       show("success", res.data.message);

//       fetchData();
//     }
//   };

//   // ✅ PAGINATION LOGIC

//   const totalPages = Math.ceil(
//     data.length / recordsPerPage
//   );

//   const indexOfFirst =
//     (currentPage - 1) * recordsPerPage;

//   const currentData = data.slice(
//     indexOfFirst,
//     indexOfFirst + recordsPerPage
//   );

//   const goTo = (p) => {

//     setCurrentPage(
//       Math.max(1, Math.min(p, totalPages))
//     );

//   };

//   const pages = Array.from(
//     { length: totalPages },
//     (_, i) => i + 1
//   );

//   return (

// <>
// <Toasts toasts={toasts} />

//     <div
//       style={{
//         padding: 24,
//         fontFamily: "sans-serif",
//         background: "#f8fafc",
//         minHeight: "100vh"
//       }}
//     >

//       {/* HEADER */}

//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           marginBottom: 22
//         }}
//       >

//         <h2
//           style={{
//             margin: 0,
//             color: "#1e293b"
//           }}
//         >
//           💰 Pending Payments
//         </h2>

//         <div
//           style={{
//             background: "#fff",
//             padding: "10px 16px",
//             borderRadius: 12,
//             border: "1px solid #e2e8f0",
//             fontWeight: 700,
//             color: "#4338ca"
//           }}
//         >
//           Total Pending : ₹
//           {data
//             .reduce(
//               (sum, item) =>
//                 sum + Number(item.balance_amount),
//               0
//             )
//             .toLocaleString()}
//         </div>

//       </div>

//       {/* TABLE */}

//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 18,
//           overflow: "hidden",
//           border: "1px solid #e5e7eb",
//           boxShadow: "0 4px 14px rgba(0,0,0,.04)"
//         }}
//       >

//         <div style={{ overflowX: "auto" }}>

//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               minWidth: 1300
//             }}
//           >

//             {/* HEADER */}

//             <thead>

//               <tr
//                 style={{
//                   background: "#eef2ff"
//                 }}
//               >

//                 <th style={th}>#</th>

//                 <th style={th}>Invoice</th>

//                 <th style={th}>Customer</th>

//                 <th style={th}>Phone</th>

//                 <th style={th}>Total</th>

//                 <th style={th}>Paid</th>

//                 <th style={th}>Pending</th>

//                 <th style={th}>Limit</th>

//                 <th style={th}>Due Date</th>

//                 <th style={th}>Status</th>

//                 <th style={th}>Reminder</th>

//                 <th style={th}>Action</th>

//               </tr>

//             </thead>

//             {/* BODY */}

//             <tbody>

//               {currentData.length === 0 ? (

//                 <tr>

//                   <td
//                     colSpan={12}
//                     style={{
//                       padding: 40,
//                       textAlign: "center",
//                       color: "#64748b",
//                       fontWeight: 600
//                     }}
//                   >
//                     No Pending Payments
//                   </td>

//                 </tr>

//               ) : currentData.map((item, i) => {

//                 const today = new Date();

//                 const due = item.due_date
//                   ? new Date(
//                       item.due_date.replace(" ", "T")
//                     )
//                   : null;

//                 const diff = due
//                   ? (due - today) /
//                     (1000 * 60 * 60 * 24)
//                   : null;

//                 const isOverdue =
//                   diff !== null && diff < 0;

//                 const showReminder =
//                   item.payment_type === "credit" &&
//                   Number(item.balance_amount) > 0 &&
//                   item.due_date;

//                 const returnAmount =
//                   Number(item.pay_amount || 0) >
//                   Number(item.balance_amount)
//                     ? Number(item.pay_amount) -
//                       Number(item.balance_amount)
//                     : 0;

//                 return (

//                   <tr
//                     key={i}
//                     style={{
//                       borderBottom:
//                         "1px solid #f1f5f9"
//                     }}
//                   >

//                     {/* SERIAL */}

//                     <td style={td}>
//                       {indexOfFirst + i + 1}
//                     </td>

//                     {/* INVOICE */}

//                     <td style={tdBlue}>
//                       {item.invoice_no}
//                     </td>

//                     {/* CUSTOMER */}

//                     <td style={td}>
//                       {item.customer_name}
//                     </td>

//                     {/* PHONE */}

//                     <td style={tdLight}>
//                       {item.customer_phone}
//                     </td>

//                     {/* TOTAL */}

//                     <td style={td}>
//                       ₹
//                       {Number(
//                         item.total_amount
//                       ).toLocaleString()}
//                     </td>

//                     {/* PAID */}

//                     <td
//                       style={{
//                         padding: "14px",
//                         color: "#16a34a",
//                         fontWeight: 700
//                       }}
//                     >
//                       ₹
//                       {Number(
//                         item.paid_amount_total
//                       ).toLocaleString()}
//                     </td>

//                     {/* PENDING */}

//                     <td
//                       style={{
//                         padding: "14px",
//                         color: "#dc2626",
//                         fontWeight: 700
//                       }}
//                     >
//                       ₹
//                       {Number(
//                         item.balance_amount
//                       ).toLocaleString()}
//                     </td>

//                     {/* LIMIT */}

//                     <td
//                       style={{
//                         padding: "14px",
//                         color: "#7c3aed",
//                         fontWeight: 700
//                       }}
//                     >
//                       ₹
//                       {Number(
//                         item.credit_limit
//                       ).toLocaleString()}
//                     </td>

//                     {/* DUE DATE */}

//                     <td style={td}>
//                       {item.due_date
//                         ? formatDate(item.due_date)
//                         : "-"}
//                     </td>

//                     {/* STATUS */}

//                     <td style={td}>

//                       <span
//                         style={{
//                           padding: "6px 12px",
//                           borderRadius: 20,
//                           fontSize: 12,
//                           fontWeight: 700,
//                           background:
//                             isOverdue
//                               ? "#fee2e2"
//                               : "#fef3c7",
//                           color:
//                             isOverdue
//                               ? "#dc2626"
//                               : "#d97706"
//                         }}
//                       >
//                         {isOverdue
//                           ? "Overdue"
//                           : "Pending"}
//                       </span>

//                     </td>

//                     {/* REMINDER */}

//                     <td style={td}>

//                       {showReminder ? (

//                         <button
//                           onClick={() =>
//                             sendReminder(
//                               item.customer_phone,
//                               item.customer_name,
//                               item.balance_amount,
//                               item.due_date
//                             )
//                           }
//                           style={{
//                             background: "#22c55e",
//                             color: "#fff",
//                             border: "none",
//                             padding: "8px 14px",
//                             borderRadius: 8,
//                             cursor: "pointer",
//                             fontWeight: 700
//                           }}
//                         >
//                           Send
//                         </button>

//                       ) : (

//                         <span
//                           style={{
//                             color: "#9ca3af"
//                           }}
//                         >
//                           —
//                         </span>

//                       )}

//                     </td>

//                     {/* ACTION */}

//                     <td style={td}>

//                       <div
//                         style={{
//                           display: "flex",
//                           flexDirection: "column",
//                           gap: 8
//                         }}
//                       >

//                         <input
//                           type="number"
//                           placeholder="Enter amount"
//                           value={
//                             item.pay_amount || ""
//                           }
//                           onChange={(e) => {

//                             const updated = [
//                               ...data
//                             ];

//                             updated[indexOfFirst + i].pay_amount =
//                               e.target.value;

//                             setData(updated);

//                           }}
//                           style={{
//                             padding: "8px 10px",
//                             border:
//                               "1px solid #d1d5db",
//                             borderRadius: 8,
//                             width: 140
//                           }}
//                         />

//                         {/* RETURN */}

//                         {returnAmount > 0 && (

//                           <div
//                             style={{
//                               fontSize: 12,
//                               fontWeight: 700,
//                               color: "#dc2626"
//                             }}
//                           >
//                             Return ₹
//                             {returnAmount.toLocaleString()}
//                           </div>

//                         )}

//                         <button
//                           onClick={() => {

//                             if (
//                               !item.pay_amount ||
//                               Number(item.pay_amount) <= 0
//                             ) {

//                               show(
//                                 "error",
//                                 "Please enter payment amount"
//                               );

//                               return;
//                             }

//                             markPaid(
//                               item.invoice_no,
//                               item.pay_amount
//                             );

//                           }}
//                           style={{
//                             background: "#16a34a",
//                             color: "#fff",
//                             border: "none",
//                             padding: "8px 12px",
//                             borderRadius: 8,
//                             cursor: "pointer",
//                             fontWeight: 700
//                           }}
//                         >
//                           Confirm Paid
//                         </button>

//                       </div>

//                     </td>

//                   </tr>

//                 );
//               })}

//             </tbody>

//           </table>

//         </div>

//       </div>

//       {/* PAGINATION */}

//       {totalPages > 1 && (

//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             marginTop: 18
//           }}
//         >

//           {/* PREV */}

//           <button
//             onClick={() => goTo(currentPage - 1)}
//             disabled={currentPage === 1}
//             style={pgBtn}
//           >
//             <ChevronLeft size={15} />
//             Prev
//           </button>

//           {/* PAGE NUMBERS */}

//           <div
//             style={{
//               display: "flex",
//               gap: 6
//             }}
//           >

//             {pages.map((p) => (

//               <button
//                 key={p}
//                 onClick={() => goTo(p)}
//                 style={{
//                   width: 36,
//                   height: 36,
//                   borderRadius: 10,
//                   border: "1px solid #dbeafe",
//                   background:
//                     currentPage === p
//                       ? "#4338ca"
//                       : "#fff",
//                   color:
//                     currentPage === p
//                       ? "#fff"
//                       : "#4338ca",
//                   fontWeight: 700,
//                   cursor: "pointer"
//                 }}
//               >
//                 {p}
//               </button>

//             ))}

//           </div>

//           {/* NEXT */}

//           <button
//             onClick={() => goTo(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             style={pgBtn}
//           >
//             Next
//             <ChevronRight size={15} />
//           </button>

//         </div>

//       )}

//     </div>

// </>

//   );
// }

// // 🎨 STYLES

// const th = {
//   padding: "14px",
//   textAlign: "left",
//   fontSize: 12,
//   color: "#4338ca",
//   fontWeight: 700,
//   whiteSpace: "nowrap"
// };

// const td = {
//   padding: "14px",
//   whiteSpace: "nowrap"
// };

// const tdLight = {
//   padding: "14px",
//   color: "#6b7280",
//   whiteSpace: "nowrap"
// };

// const tdBlue = {
//   padding: "14px",
//   color: "#4338ca",
//   fontWeight: 700,
//   whiteSpace: "nowrap"
// };

// const pgBtn = {
//   display: "flex",
//   alignItems: "center",
//   gap: 6,
//   padding: "8px 16px",
//   background: "#fff",
//   border: "1px solid #dbeafe",
//   borderRadius: 10,
//   cursor: "pointer",
//   color: "#4338ca",
//   fontWeight: 600
// };


//ponraj - whatsapp real integration
// import { useEffect, useState } from "react";
// import api from "../../services/api";

// import {
//   ChevronLeft,
//   ChevronRight
// } from "lucide-react";

// /* ─── Toast Hook ───────────────── */

// function useToast() {

//   const [toasts, setToasts] = useState([]);

//   const show = (type, msg) => {

//     const id = Date.now();

//     setToasts(prev => [
//       ...prev,
//       { id, type, msg }
//     ]);

//     setTimeout(() => {

//       setToasts(prev =>
//         prev.filter(t => t.id !== id)
//       );

//     }, 3000);

//   };

//   return {
//     toasts,
//     show
//   };

// }

// /* ─── Toast UI ───────────────── */

// function Toasts({ toasts }) {

//   return (

//     <div
//       style={{
//         position: "fixed",
//         top: 20,
//         right: 20,
//         zIndex: 9999,
//         display: "flex",
//         flexDirection: "column",
//         gap: 10
//       }}
//     >

//       {toasts.map(t => (

//         <div
//           key={t.id}
//           style={{
//             background:
//               t.type === "success"
//                 ? "#16a34a"
//                 : "#dc2626",
//             color: "#fff",
//             padding: "12px 18px",
//             borderRadius: 12,
//             fontWeight: 600,
//             boxShadow:
//               "0 8px 24px rgba(0,0,0,.12)",
//             animation: "fadeIn .25s ease"
//           }}
//         >
//           {t.msg}
//         </div>

//       ))}

//     </div>

//   );

// }

// export default function PaymentPending() {

//   const [data, setData] = useState([]);
//   const [sendingReminder, setSendingReminder] = useState({});

//   const { toasts, show } = useToast();

//   // ✅ PAGINATION

//   const [currentPage, setCurrentPage] = useState(1);

//   const recordsPerPage = 10;

//   // ✅ FETCH DATA

//   const fetchData = async () => {

//    const company_id =
//   localStorage.getItem("selected_company_id");

// const res = await api.post(
//   "/invoice/get_pending_invoice",
//   {
//     company_id
//   }
// );

//     if (res.data.status) {
//       setData(res.data.data);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // ✅ DATE FORMAT

//   const formatDate = (date) => {

//     if (!date) return "-";

//     const d = new Date(date.replace(" ", "T"));

//     return d.toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short"
//     });
//   };

//   // ✅ WHATSAPP REMINDER
//   // Note: WHATSAPP_TEMPLATE is configured here. Default is "hello_world" for default Meta test.
//   // Change to "payment_reminder" or your custom template name when template is approved in Meta Developer account.
//   const WHATSAPP_TEMPLATE = "hello_world";

//   const sendReminder = async (
//     invoiceNo,
//     phone,
//     name,
//     amount,
//     dueDate
//   ) => {
//     setSendingReminder((prev) => ({ ...prev, [invoiceNo]: true }));
//     try {
//       const res = await api.post("/whatsapp/send_reminder", {
//         invoice_no: invoiceNo,
//         phone: phone,
//         name: name,
//         amount: amount,
//         due_date: dueDate,
//         template_name: WHATSAPP_TEMPLATE
//       });

//       // Meta API returns error if token is expired, or messages array if success
//       if (res.data && !res.data.error && (res.data.messages || res.data.status === true)) {
//         show("success", `Reminder sent successfully to ${name}!`);
//       } else if (res.data && res.data.error) {
//         const errorMsg = res.data.error.message || "Failed to send WhatsApp message.";
//         show("error", errorMsg);
//       } else if (res.data && res.data.status === false) {
//         show("error", res.data.message || "Failed to send reminder.");
//       } else {
//         show("success", "Reminder API triggered successfully!");
//       }
//     } catch (err) {
//       console.error(err);
//       show("error", err.response?.data?.message || "Failed to connect to WhatsApp service.");
//     } finally {
//       setSendingReminder((prev) => ({ ...prev, [invoiceNo]: false }));
//     }
//   };

//   // ✅ MARK PAID

//   const markPaid = async (
//     invoice_no,
//     pay_amount
//   ) => {

//     const res = await api.post(
//       "/invoice/mark_as_paid",
//       {
//         invoice_no,
//         pay_amount
//       }
//     );

//     if (res.data.status) {

//       show("success", res.data.message);

//       fetchData();
//     }
//   };

//   // ✅ PAGINATION LOGIC

//   const totalPages = Math.ceil(
//     data.length / recordsPerPage
//   );

//   const indexOfFirst =
//     (currentPage - 1) * recordsPerPage;

//   const currentData = data.slice(
//     indexOfFirst,
//     indexOfFirst + recordsPerPage
//   );

//   const goTo = (p) => {

//     setCurrentPage(
//       Math.max(1, Math.min(p, totalPages))
//     );

//   };

//   const pages = Array.from(
//     { length: totalPages },
//     (_, i) => i + 1
//   );

//   return (

// <>
// <Toasts toasts={toasts} />

//     <div
//       style={{
//         padding: 24,
//         fontFamily: "sans-serif",
//         background: "#f8fafc",
//         minHeight: "100vh"
//       }}
//     >

//       {/* HEADER */}

//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           marginBottom: 22
//         }}
//       >

//         <h2
//           style={{
//             margin: 0,
//             color: "#1e293b"
//           }}
//         >
//           💰 Pending Payments
//         </h2>

//         <div
//           style={{
//             background: "#fff",
//             padding: "10px 16px",
//             borderRadius: 12,
//             border: "1px solid #e2e8f0",
//             fontWeight: 700,
//             color: "#4338ca"
//           }}
//         >
//           Total Pending : ₹
//           {data
//             .reduce(
//               (sum, item) =>
//                 sum + Number(item.balance_amount),
//               0
//             )
//             .toLocaleString()}
//         </div>

//       </div>

//       {/* TABLE */}

//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 18,
//           overflow: "hidden",
//           border: "1px solid #e5e7eb",
//           boxShadow: "0 4px 14px rgba(0,0,0,.04)"
//         }}
//       >

//         <div style={{ overflowX: "auto" }}>

//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               minWidth: 1300
//             }}
//           >

//             {/* HEADER */}

//             <thead>

//               <tr
//                 style={{
//                   background: "#eef2ff"
//                 }}
//               >

//                 <th style={th}>#</th>

//                 <th style={th}>Invoice</th>

//                 <th style={th}>Customer</th>

//                 <th style={th}>Phone</th>

//                 <th style={th}>Total</th>

//                 <th style={th}>Paid</th>

//                 <th style={th}>Pending</th>

//                 <th style={th}>Limit</th>

//                 <th style={th}>Due Date</th>

//                 <th style={th}>Status</th>

//                 <th style={th}>Reminder</th>

//                 <th style={th}>Action</th>

//               </tr>

//             </thead>

//             {/* BODY */}

//             <tbody>

//               {currentData.length === 0 ? (

//                 <tr>

//                   <td
//                     colSpan={12}
//                     style={{
//                       padding: 40,
//                       textAlign: "center",
//                       color: "#64748b",
//                       fontWeight: 600
//                     }}
//                   >
//                     No Pending Payments
//                   </td>

//                 </tr>

//               ) : currentData.map((item, i) => {

//                 const today = new Date();

//                 const due = item.due_date
//                   ? new Date(
//                       item.due_date.replace(" ", "T")
//                     )
//                   : null;

//                 const diff = due
//                   ? (due - today) /
//                     (1000 * 60 * 60 * 24)
//                   : null;

//                 const isOverdue =
//                   diff !== null && diff < 0;

//                 const showReminder =
//                   item.payment_type === "credit" &&
//                   Number(item.balance_amount) > 0 &&
//                   item.due_date;

//                 const returnAmount =
//                   Number(item.pay_amount || 0) >
//                   Number(item.balance_amount)
//                     ? Number(item.pay_amount) -
//                       Number(item.balance_amount)
//                     : 0;

//                 return (

//                   <tr
//                     key={i}
//                     style={{
//                       borderBottom:
//                         "1px solid #f1f5f9"
//                     }}
//                   >

//                     {/* SERIAL */}

//                     <td style={td}>
//                       {indexOfFirst + i + 1}
//                     </td>

//                     {/* INVOICE */}

//                     <td style={tdBlue}>
//                       {item.invoice_no}
//                     </td>

//                     {/* CUSTOMER */}

//                     <td style={td}>
//                       {item.customer_name}
//                     </td>

//                     {/* PHONE */}

//                     <td style={tdLight}>
//                       {item.customer_phone}
//                     </td>

//                     {/* TOTAL */}

//                     <td style={td}>
//                       ₹
//                       {Number(
//                         item.total_amount
//                       ).toLocaleString()}
//                     </td>

//                     {/* PAID */}

//                     <td
//                       style={{
//                         padding: "14px",
//                         color: "#16a34a",
//                         fontWeight: 700
//                       }}
//                     >
//                       ₹
//                       {Number(
//                         item.paid_amount_total
//                       ).toLocaleString()}
//                     </td>

//                     {/* PENDING */}

//                     <td
//                       style={{
//                         padding: "14px",
//                         color: "#dc2626",
//                         fontWeight: 700
//                       }}
//                     >
//                       ₹
//                       {Number(
//                         item.balance_amount
//                       ).toLocaleString()}
//                     </td>

//                     {/* LIMIT */}

//                     <td
//                       style={{
//                         padding: "14px",
//                         color: "#7c3aed",
//                         fontWeight: 700
//                       }}
//                     >
//                       ₹
//                       {Number(
//                         item.credit_limit
//                       ).toLocaleString()}
//                     </td>

//                     {/* DUE DATE */}

//                     <td style={td}>
//                       {item.due_date
//                         ? formatDate(item.due_date)
//                         : "-"}
//                     </td>

//                     {/* STATUS */}

//                     <td style={td}>

//                       <span
//                         style={{
//                           padding: "6px 12px",
//                           borderRadius: 20,
//                           fontSize: 12,
//                           fontWeight: 700,
//                           background:
//                             isOverdue
//                               ? "#fee2e2"
//                               : "#fef3c7",
//                           color:
//                             isOverdue
//                               ? "#dc2626"
//                               : "#d97706"
//                         }}
//                       >
//                         {isOverdue
//                           ? "Overdue"
//                           : "Pending"}
//                       </span>

//                     </td>

//                     {/* REMINDER */}

//                     <td style={td}>

//                       {showReminder ? (

//                         <button
//                           onClick={() =>
//                             sendReminder(
//                               item.invoice_no,
//                               item.customer_phone,
//                               item.customer_name,
//                               item.balance_amount,
//                               item.due_date
//                             )
//                           }
//                           disabled={sendingReminder[item.invoice_no]}
//                           style={{
//                             background: sendingReminder[item.invoice_no] ? "#a3e635" : "#22c55e",
//                             color: "#fff",
//                             border: "none",
//                             padding: "8px 14px",
//                             borderRadius: 8,
//                             cursor: sendingReminder[item.invoice_no] ? "not-allowed" : "pointer",
//                             fontWeight: 700
//                           }}
//                         >
//                           {sendingReminder[item.invoice_no] ? "Sending..." : "Send"}
//                         </button>

//                       ) : (

//                         <span
//                           style={{
//                             color: "#9ca3af"
//                           }}
//                         >
//                           —
//                         </span>

//                       )}

//                     </td>

//                     {/* ACTION */}

//                     <td style={td}>

//                       <div
//                         style={{
//                           display: "flex",
//                           flexDirection: "column",
//                           gap: 8
//                         }}
//                       >

//                         <input
//                           type="number"
//                           placeholder="Enter amount"
//                           value={
//                             item.pay_amount || ""
//                           }
//                           onChange={(e) => {

//                             const updated = [
//                               ...data
//                             ];

//                             updated[indexOfFirst + i].pay_amount =
//                               e.target.value;

//                             setData(updated);

//                           }}
//                           style={{
//                             padding: "8px 10px",
//                             border:
//                               "1px solid #d1d5db",
//                             borderRadius: 8,
//                             width: 140
//                           }}
//                         />

//                         {/* RETURN */}

//                         {returnAmount > 0 && (

//                           <div
//                             style={{
//                               fontSize: 12,
//                               fontWeight: 700,
//                               color: "#dc2626"
//                             }}
//                           >
//                             Return ₹
//                             {returnAmount.toLocaleString()}
//                           </div>

//                         )}

//                         <button
//                           onClick={() => {

//                             if (
//                               !item.pay_amount ||
//                               Number(item.pay_amount) <= 0
//                             ) {

//                               show(
//                                 "error",
//                                 "Please enter payment amount"
//                               );

//                               return;
//                             }

//                             markPaid(
//                               item.invoice_no,
//                               item.pay_amount
//                             );

//                           }}
//                           style={{
//                             background: "#16a34a",
//                             color: "#fff",
//                             border: "none",
//                             padding: "8px 12px",
//                             borderRadius: 8,
//                             cursor: "pointer",
//                             fontWeight: 700
//                           }}
//                         >
//                           Confirm Paid
//                         </button>

//                       </div>

//                     </td>

//                   </tr>

//                 );
//               })}

//             </tbody>

//           </table>

//         </div>

//       </div>

//       {/* PAGINATION */}

//       {totalPages > 1 && (

//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             marginTop: 18
//           }}
//         >

//           {/* PREV */}

//           <button
//             onClick={() => goTo(currentPage - 1)}
//             disabled={currentPage === 1}
//             style={pgBtn}
//           >
//             <ChevronLeft size={15} />
//             Prev
//           </button>

//           {/* PAGE NUMBERS */}

//           <div
//             style={{
//               display: "flex",
//               gap: 6
//             }}
//           >

//             {pages.map((p) => (

//               <button
//                 key={p}
//                 onClick={() => goTo(p)}
//                 style={{
//                   width: 36,
//                   height: 36,
//                   borderRadius: 10,
//                   border: "1px solid #dbeafe",
//                   background:
//                     currentPage === p
//                       ? "#4338ca"
//                       : "#fff",
//                   color:
//                     currentPage === p
//                       ? "#fff"
//                       : "#4338ca",
//                   fontWeight: 700,
//                   cursor: "pointer"
//                 }}
//               >
//                 {p}
//               </button>

//             ))}

//           </div>

//           {/* NEXT */}

//           <button
//             onClick={() => goTo(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             style={pgBtn}
//           >
//             Next
//             <ChevronRight size={15} />
//           </button>

//         </div>

//       )}

//     </div>

// </>

//   );
// }

// // 🎨 STYLES

// const th = {
//   padding: "14px",
//   textAlign: "left",
//   fontSize: 12,
//   color: "#4338ca",
//   fontWeight: 700,
//   whiteSpace: "nowrap"
// };

// const td = {
//   padding: "14px",
//   whiteSpace: "nowrap"
// };

// const tdLight = {
//   padding: "14px",
//   color: "#6b7280",
//   whiteSpace: "nowrap"
// };

// const tdBlue = {
//   padding: "14px",
//   color: "#4338ca",
//   fontWeight: 700,
//   whiteSpace: "nowrap"
// };

// const pgBtn = {
//   display: "flex",
//   alignItems: "center",
//   gap: 6,
//   padding: "8px 16px",
//   background: "#fff",
//   border: "1px solid #dbeafe",
//   borderRadius: 10,
//   cursor: "pointer",
//   color: "#4338ca",
//   fontWeight: 600
// };


//credit customer list
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Pencil, Search, Phone, MapPin, Download, Wallet,
  CheckCircle, ChevronRight, Filter, IndianRupee, X, MessageCircle,
  FileDown, ChevronLeft,
} from "lucide-react";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date.replace(" ", "T")).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
const distributePayment = (pendingInvoices, totalAmount) => {
  let remaining = Number(totalAmount);
  return pendingInvoices.map((inv) => {
    const bal = Number(inv.balance_amount);
    if (remaining <= 0) return { ...inv, _applying: 0, _newBalance: bal };
    const applying = Math.min(remaining, bal);
    remaining -= applying;
    return { ...inv, _applying: applying, _newBalance: bal - applying };
  });
};

const INV_PER_PAGE = 5;

export default function PaymentPending() {
  const navigate = useNavigate();
 const user     = JSON.parse(localStorage.getItem("user") || "{}");
const admin_id = user?.role === "cashier" ? user?.admin_id : user?.id;

  const [customers,        setCustomers]        = useState([]);
  const [search,           setSearch]           = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceHistory,   setInvoiceHistory]   = useState([]);
  const [allHistory,       setAllHistory]       = useState([]);
  const [toast,            setToast]            = useState(null);

  /* collect popup */
  const [showCollect,   setShowCollect]   = useState(false);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMethod, setCollectMethod] = useState("cash");
  const [collecting,    setCollecting]    = useState(false);
  const [preview,       setPreview]       = useState([]);

  const [sendingReminder, setSendingReminder] = useState(false);

  /* invoice table state */
  const [checkedIds,   setCheckedIds]   = useState(new Set());
  const [invPage,      setInvPage]      = useState(1);


  /* filter states */
const [showFilter,     setShowFilter]     = useState(false);
const [fromDate,       setFromDate]       = useState("");
const [toDate,         setToDate]         = useState("");
const [filterMethod,   setFilterMethod]   = useState("all");
const [filterStatus,   setFilterStatus]   = useState("all");
const [filterCustomer, setFilterCustomer] = useState("");


  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const appliedCount = [
  fromDate || toDate,
  filterMethod !== "all",
  filterStatus !== "all",
  filterCustomer,
].filter(Boolean).length;

const applyFilter = () => {
  if (selectedCustomer) fetchCustomerHistory(selectedCustomer.id);
};

const resetFilter = () => {
  setFromDate(""); setToDate("");
  setFilterMethod("all"); setFilterStatus("all");
  setFilterCustomer("");
  if (selectedCustomer)
    fetchCustomerHistory(selectedCustomer.id, {
      filterMethod: "all", filterStatus: "all",
      filterCustomer: "", fromDate: "", toDate: "",
    });
};


  
  /* ── fetch only credit-enabled customers ── */
const fetchCustomers = async () => {
  try {
    const res = await api.get(`/customer/get_all_customer?admin_id=${admin_id}`);
    if (res.data.status) {
      const creditOnly = res.data.data.filter(c => Number(c.credit_enabled) === 1);
      setCustomers(creditOnly);
      if (creditOnly.length > 0) {
        setSelectedCustomer(creditOnly[0]);
        fetchCustomerHistory(creditOnly[0].id); // ← auto-select first customer
      }
    }
  } catch (err) { console.log(err); }
};

const fetchAllHistory = async (overrides = {}) => {
  try {
    const res = await api.get(`/invoice/get_pending_invoice_history?admin_id=${admin_id}`);
    if (res.data.status) {
      let data = res.data.data.filter(
        item => Number(item.balance_amount) > 0  // ← credit restriction remove
      );
      setAllHistory(data);
    }
  } catch (err) { console.log(err); }
};

const fetchCustomerHistory = async (customerId, overrides = {}) => {
  try {
    const res = await api.get(`/invoice/get_pending_invoice_history?admin_id=${admin_id}`);
    if (res.data.status) {
      let data = res.data.data.filter(
        item => Number(item.customer_id) === Number(customerId)
      );

      // apply filters
      const method   = overrides.filterMethod   ?? filterMethod;
      const status   = overrides.filterStatus   ?? filterStatus;
      const customer = overrides.filterCustomer ?? filterCustomer;
      const from     = overrides.fromDate       ?? fromDate;
      const to       = overrides.toDate         ?? toDate;

      if (method !== "all")
        data = data.filter(i => i.payment_method?.toLowerCase() === method);

      if (status === "paid")
        data = data.filter(i => Number(i.balance_amount) <= 0);
      else if (status === "not_paid")
        data = data.filter(i => Number(i.balance_amount) > 0);

      if (from)
        data = data.filter(i => i.created_at && i.created_at.slice(0,10) >= from);
      if (to)
        data = data.filter(i => i.created_at && i.created_at.slice(0,10) <= to);

      setInvoiceHistory(data);
      setCheckedIds(new Set());
      setInvPage(1);
    }
  } catch (err) { console.log(err); }
};

  useEffect(() => { fetchCustomers(); fetchAllHistory(); }, []);

  useEffect(() => {
    const pending = invoiceHistory.filter(i => Number(i.balance_amount) > 0);
    if (!collectAmount || Number(collectAmount) <= 0) { setPreview([]); return; }
    setPreview(distributePayment(pending, collectAmount));
  }, [collectAmount, invoiceHistory]);

  const getCustomerPendingTotal = (customerId) =>
    allHistory
      .filter(i => Number(i.customer_id) === Number(customerId))
      .reduce((s, i) => s + Number(i.balance_amount || 0), 0);

  const pendingInvoices = invoiceHistory.filter(i => Number(i.balance_amount) > 0);
  const totalPending    = pendingInvoices.reduce((s, i) => s + Number(i.balance_amount), 0);

  /* ── invoice pagination ── */
  const totalInvPages = Math.ceil(invoiceHistory.length / INV_PER_PAGE);
  const invStart      = (invPage - 1) * INV_PER_PAGE;
  const currentInvs   = invoiceHistory.slice(invStart, invStart + INV_PER_PAGE);

  /* ── checkbox helpers ── */
  const allCurrentChecked =
    currentInvs.length > 0 && currentInvs.every(i => checkedIds.has(i.id));

  const toggleAll = () => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (allCurrentChecked) currentInvs.forEach(i => next.delete(i.id));
      else currentInvs.forEach(i => next.add(i.id));
      return next;
    });
  };

  const toggleOne = (id, e) => {
    e.stopPropagation();
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedInvRows = invoiceHistory.filter(i => checkedIds.has(i.id));
  const exportRows      = checkedIds.size > 0 ? selectedInvRows : invoiceHistory;

  /* ── Excel ── */
  const downloadExcel = () => {
    if (!exportRows.length) { alert("No data"); return; }
    const rows = exportRows.map(item => ({
      "Invoice No":       item.invoice_no || "-",
      "Payment Method":   item.payment_method || "-",
      "Total":            item.total_amount,
      "Paid":             item.paid_amount_total,
      "Pending":          item.balance_amount,
      "Due Date":         formatDate(item.due_date),
      "Status":           Number(item.balance_amount) <= 0 ? "Paid" : "Not Paid",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [20,18,14,14,14,18,14].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `${selectedCustomer?.name || "customer"}_invoices.xlsx`
    );
  };

  /* ── PDF ── */
  const downloadPDF = () => {
    if (!exportRows.length) { alert("No data"); return; }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(13); doc.setTextColor(37, 99, 235);
    doc.text(`Invoice Report — ${selectedCustomer?.name || ""}`, 14, 15);
    doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 22);
    autoTable(doc, {
      startY: 27,
      head: [["Invoice No", "Method", "Total", "Paid", "Pending", "Due Date", "Status"]],
      body: exportRows.map(item => [
        item.invoice_no || "-",
        item.payment_method || "-",
        `Rs.${Number(item.total_amount).toFixed(2)}`,
        `Rs.${Number(item.paid_amount_total).toFixed(2)}`,
        `Rs.${Number(item.balance_amount).toFixed(2)}`,
        formatDate(item.due_date),
        Number(item.balance_amount) <= 0 ? "Paid" : "Not Paid",
      ]),
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [239, 246, 255] },
    });
    doc.save(`${selectedCustomer?.name || "customer"}_invoices.pdf`);
  };

  /* ── collect ── */
  const openCollect = () => { setCollectAmount(""); setCollectMethod("cash"); setPreview([]); setShowCollect(true); };

  const handleBulkCollect = async () => {
    if (!collectAmount || Number(collectAmount) <= 0) { showToast("Enter a valid amount", false); return; }
    if (Number(collectAmount) > totalPending)         { showToast("Amount exceeds total pending", false); return; }
    setCollecting(true);
    const toUpdate = distributePayment(pendingInvoices, collectAmount).filter(i => i._applying > 0);
    try {
      for (const inv of toUpdate) {
        await api.post("/invoice/update_credit_payment", {
          invoice_id: inv.id, amount: inv._applying, payment_method: collectMethod,
        });
      }
      showToast("Payment collected successfully");
      setShowCollect(false); setCollectAmount(""); setPreview([]);
      await fetchCustomers(); await fetchAllHistory();
      await fetchCustomerHistory(selectedCustomer.id);
    } catch { showToast("Server error, please retry", false); }
    finally { setCollecting(false); }
  };

  /* ── send reminder ── */
  const sendCustomerReminder = async () => {
    if (!selectedCustomer) return;
    const pi = invoiceHistory.filter(
      item => Number(item.balance_amount) > 0 && item.payment_method === "credit"
    );
    if (!pi.length) { showToast("No pending invoices found.", false); return; }
    setSendingReminder(true);
    try {
      for (const item of pi) {
        await api.post("/whatsapp/send_reminder", {
          invoice_no: item.invoice_no, phone: selectedCustomer.phone,
          name: selectedCustomer.name, amount: item.balance_amount,
          due_date: item.due_date, template_name: "hello_world",
        });
      }
      showToast(`Reminder sent for ${pi.length} pending invoice(s).`);
    } catch { showToast("Unable to send reminder.", false); }
    finally { setSendingReminder(false); }
  };

  const filtered = customers.filter(
    c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  /* ════════════════════════════════════════════ */
  return (
    <>
      <style>{`
      .filter-panel { animation: fadeSlide .25s ease both; }
@keyframes fadeSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
.rp-filter-input:focus { border-color:#2563eb !important; outline:none; }
        @keyframes toastIn { from{opacity:0;transform:translateY(-10px) scale(.95)} to{opacity:1;transform:none} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes popIn   { from{opacity:0;transform:scale(.94) translateY(16px)} to{opacity:1;transform:none} }
        .cust-row:hover    { background:#f8fafc !important; }
        .collect-btn:hover { background:#1d4ed8 !important; transform:translateY(-1px); }
        .method-btn:hover  { border-color:#2563eb !important; color:#2563eb !important; }
        .quick-btn:hover   { background:#dbeafe !important; }
        .inv-row:hover td  { background:#f5f7ff !important; }
        .inv-cb            { width:14px; height:14px; accent-color:#2563eb; cursor:pointer; }
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{
          position:"fixed", top:20, right:20, zIndex:99999,
          background: toast.ok ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "linear-gradient(135deg,#dc2626,#ef4444)",
          color:"#fff", padding:"13px 20px", borderRadius:14,
          boxShadow:"0 10px 30px rgba(0,0,0,.2)",
          display:"flex", alignItems:"center", gap:10,
          fontWeight:600, fontSize:14, animation:"toastIn .25s ease",
        }}>
          <div style={{
            width:22, height:22, borderRadius:7, background:"rgba(255,255,255,.22)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:12,
          }}>
            {toast.ok ? "✓" : "✕"}
          </div>
          {toast.msg}
        </div>
      )}

      {/* COLLECT POPUP */}
      {showCollect && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowCollect(false); }}
          style={{
            position:"fixed", inset:0, zIndex:9999,
            background:"rgba(15,23,42,.55)", backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:20,
          }}
        >
          <div style={{
            background:"#fff", borderRadius:20, width:"100%", maxWidth:480,
            maxHeight:"90vh", display:"flex", flexDirection:"column",
            boxShadow:"0 24px 64px rgba(0,0,0,.22)",
            animation:"popIn .25s cubic-bezier(.34,1.56,.64,1)", overflow:"hidden",
          }}>
            {/* header */}
            <div style={{
              background:"linear-gradient(135deg,#1e3a8a,#2563eb)",
              padding:"20px 24px", display:"flex", justifyContent:"space-between",
              alignItems:"center", flexShrink:0,
            }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, color:"#fff", fontWeight:800, fontSize:17 }}>
                  <Wallet size={20}/> Collect Payment
                </div>
                <div style={{ color:"rgba(255,255,255,.7)", fontSize:13, marginTop:3 }}>
                  {selectedCustomer?.name}
                </div>
              </div>
              <button onClick={() => setShowCollect(false)} style={{
                width:36, height:36, borderRadius:10, border:"none",
                background:"rgba(255,255,255,.15)", color:"#fff",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <X size={18}/>
              </button>
            </div>

            {/* body */}
            <div style={{ overflowY:"auto", flex:1, padding:"22px 24px" }}>
              <div style={{
                background:"linear-gradient(135deg,#fef2f2,#fff5f5)",
                border:"1px solid #fecaca", borderRadius:14,
                padding:"16px 20px", marginBottom:20,
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#dc2626", textTransform:"uppercase" }}>
                    Total Pending
                  </div>
                  <div style={{ fontSize:30, fontWeight:900, color:"#dc2626", marginTop:2 }}>
                    ₹{fmt(totalPending)}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:"#ef4444", fontWeight:600 }}>
                    {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ marginTop:6 }}>
                    {pendingInvoices.map((inv, i) => {
                      const prev = preview.find(p => p.id === inv.id);
                      const applying = prev ? prev._applying : 0;
                      return (
                        <div key={i} style={{
                          fontSize:11, color: applying > 0 ? "#16a34a" : "#94a3b8",
                          fontWeight:600, textAlign:"right",
                        }}>
                          {applying > 0
                            ? `✓ ₹${fmt(inv.balance_amount)} → ₹${fmt(Number(inv.balance_amount) - applying)}`
                            : `₹${fmt(inv.balance_amount)} pending`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {pendingInvoices.length === 0 ? (
                <div style={{ textAlign:"center", padding:"28px 0", color:"#64748b" }}>
                  <CheckCircle size={44} style={{ color:"#86efac", marginBottom:10 }}/>
                  <div style={{ fontWeight:700, fontSize:16, color:"#16a34a" }}>All Cleared!</div>
                  <div style={{ fontSize:13, marginTop:4 }}>No pending payments</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>
                      Pending Breakdown
                    </div>
                    {pendingInvoices.map((inv, i) => {
                      const prev = preview.find(p => p.id === inv.id);
                      const applying = prev ? prev._applying : 0;
                      return (
                        <div key={i} style={{
                          display:"flex", justifyContent:"space-between", alignItems:"center",
                          padding:"10px 14px", borderRadius:10, marginBottom:6,
                          background: applying > 0 ? "#f0fdf4" : "#f8fafc",
                          border: applying > 0 ? "1.5px solid #86efac" : "1.5px solid #f1f5f9",
                        }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{
                              width:32, height:32, borderRadius:8,
                              background: applying > 0 ? "#dcfce7" : "#f1f5f9",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:12, fontWeight:800,
                              color: applying > 0 ? "#16a34a" : "#94a3b8",
                            }}>#{i+1}</div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", textTransform:"capitalize" }}>
                                {inv.payment_method || "Invoice"}
                              </div>
                              {inv.due_date && (
                                <div style={{ fontSize:11, color:"#94a3b8" }}>Due: {formatDate(inv.due_date)}</div>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:14, fontWeight:800, color:"#dc2626" }}>
                              ₹{fmt(inv.balance_amount)}
                            </div>
                            {applying > 0 && (
                              <div style={{ fontSize:11, color:"#16a34a", fontWeight:700 }}>
                                −₹{fmt(applying)} → ₹{fmt(Number(inv.balance_amount) - applying)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ height:1, background:"#f1f5f9", marginBottom:18 }}/>

                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:7 }}>
                      Amount to Collect
                    </label>
                    <div style={{ position:"relative" }}>
                      <IndianRupee size={16} style={{
                        position:"absolute", left:13, top:"50%",
                        transform:"translateY(-50%)", color:"#94a3b8",
                      }}/>
                      <input
                        type="number" placeholder="0" value={collectAmount}
                        onChange={e => setCollectAmount(e.target.value)} autoFocus
                        style={{
                          width:"100%", padding:"13px 14px 13px 38px",
                          borderRadius:12, border:"2px solid #dbeafe",
                          outline:"none", fontSize:18, fontWeight:800,
                          boxSizing:"border-box", color:"#0f172a",
                        }}
                        onFocus={e => (e.target.style.borderColor="#2563eb")}
                        onBlur={e  => (e.target.style.borderColor="#dbeafe")}
                      />
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      {[25,50,100].map(pct => {
                        const val = Math.round(totalPending * pct / 100);
                        return (
                          <button key={pct} className="quick-btn"
                            onClick={() => setCollectAmount(String(val))}
                            style={{
                              flex:1, padding:"8px 0", fontSize:12, fontWeight:700,
                              background:"#eff6ff", color:"#2563eb",
                              border:"1.5px solid #bfdbfe", borderRadius:9, cursor:"pointer",
                            }}
                          >
                            {pct}%<br/>
                            <span style={{ fontSize:11 }}>₹{fmt(val)}</span>
                          </button>
                        );
                      })}
                      <button className="quick-btn"
                        onClick={() => setCollectAmount(String(totalPending))}
                        style={{
                          flex:1, padding:"8px 0", fontSize:12, fontWeight:700,
                          background:"#eff6ff", color:"#2563eb",
                          border:"1.5px solid #bfdbfe", borderRadius:9, cursor:"pointer",
                        }}
                      >
                        Full<br/><span style={{ fontSize:11 }}>₹{fmt(totalPending)}</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom:20 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:7 }}>
                      Payment Method
                    </label>
                    <div style={{ display:"flex", gap:10 }}>
                      {["cash","online","upi"].map(m => (
                        <button key={m} className="method-btn"
                          onClick={() => setCollectMethod(m)}
                          style={{
                            flex:1, padding:"11px 0", fontSize:13, fontWeight:700,
                            textTransform:"capitalize", borderRadius:11, cursor:"pointer",
                            background: collectMethod===m ? "#2563eb" : "#fff",
                            color:      collectMethod===m ? "#fff"    : "#64748b",
                            border:     collectMethod===m ? "2px solid #2563eb" : "2px solid #e5e7eb",
                          }}
                        >
                          {m==="cash"?"💵":m==="online"?"🏦":"📱"} {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {preview.filter(p => p._applying > 0).length > 0 && (
                    <div style={{
                      background:"#f0fdf4", border:"1.5px solid #bbf7d0",
                      borderRadius:12, padding:"14px 16px", marginBottom:20,
                      animation:"fadeUp .2s ease",
                    }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#16a34a", marginBottom:10, textTransform:"uppercase" }}>
                        ✓ Payment Distribution
                      </div>
                      {preview.filter(p => p._applying > 0).map((p, i) => (
                        <div key={i} style={{
                          display:"flex", justifyContent:"space-between",
                          fontSize:13, color:"#166534", marginBottom:5, fontWeight:600,
                        }}>
                          <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <ChevronRight size={13}/>
                            <span style={{ textTransform:"capitalize" }}>{p.payment_method||"Invoice"}</span>
                            <span style={{ color:"#86efac" }}>#{i+1}</span>
                          </span>
                          <span>−₹{fmt(p._applying)}</span>
                        </div>
                      ))}
                      <div style={{
                        borderTop:"1.5px solid #86efac", marginTop:10, paddingTop:10,
                        display:"flex", justifyContent:"space-between",
                        fontWeight:800, fontSize:14, color:"#15803d",
                      }}>
                        <span>Remaining balance</span>
                        <span>₹{fmt(Math.max(0, totalPending - Number(collectAmount)))}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {pendingInvoices.length > 0 && (
              <div style={{
                padding:"16px 24px", borderTop:"1px solid #f1f5f9",
                display:"flex", gap:10, flexShrink:0, background:"#fff",
              }}>
                <button onClick={() => setShowCollect(false)} style={{
                  flex:1, padding:"13px 0", borderRadius:12,
                  border:"2px solid #e5e7eb", background:"#fff",
                  fontWeight:700, fontSize:14, cursor:"pointer", color:"#64748b",
                }}>Cancel</button>
                <button className="collect-btn" onClick={handleBulkCollect} disabled={collecting}
                  style={{
                    flex:2, padding:"13px 0",
                    background: collecting ? "#93c5fd" : "#2563eb",
                    color:"#fff", border:"none", borderRadius:12,
                    fontWeight:800, fontSize:14,
                    cursor: collecting ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    boxShadow:"0 4px 16px rgba(37,99,235,.35)",
                  }}
                >
                  <Wallet size={17}/>
                  {collecting ? "Processing..." : "Collect Payment"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{ minHeight:"100vh", background:"#f1f5f9", padding:20, fontFamily:"Inter, sans-serif" }}>

        {/* HEADER */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#0f172a" }}>Credit Customers</h2>
            <p style={{ margin:"3px 0 0", color:"#64748b", fontSize:13 }}>Pending payment management</p>
          </div>
        </div>

{/* FILTER ROW */}
<div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
  <button
    onClick={() => setShowFilter(v => !v)}
    style={{
      display:"flex", alignItems:"center", gap:7,
      padding:"9px 16px", borderRadius:11,
      border:"1.5px solid #c7d2fe",
      background: showFilter ? "#2563eb" : "#eef2ff",
      color: showFilter ? "#fff" : "#2563eb",
      fontWeight:700, fontSize:12, cursor:"pointer",
      position:"relative",
    }}
  >
    <Filter size={14}/> Filter
    {appliedCount > 0 && (
      <span style={{
        position:"absolute", top:-6, right:-6,
        background:"#dc2626", color:"#fff",
        borderRadius:"50%", width:18, height:18,
        display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:10, fontWeight:800,
      }}>{appliedCount}</span>
    )}
  </button>
  {appliedCount > 0 && (
    <button onClick={resetFilter} style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"9px 14px", borderRadius:11,
      border:"none", background:"#fee2e2",
      color:"#dc2626", fontWeight:700, fontSize:12, cursor:"pointer",
    }}>
      <X size={13}/> Reset
    </button>
  )}
</div>

{/* FILTER PANEL */}
{showFilter && (
  <div className="filter-panel" style={{
    background:"#fff", border:"1.5px solid #e0e7ff",
    borderRadius:16, padding:"18px 20px", marginBottom:16,
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",
    gap:12,
  }}>
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:"#2563eb", display:"block", marginBottom:6 }}>From Date</label>
      <input type="date" className="rp-filter-input"
        value={fromDate} onChange={e => setFromDate(e.target.value)}
        style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e0e7ff", borderRadius:10, fontSize:12 }}
      />
    </div>
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:"#2563eb", display:"block", marginBottom:6 }}>To Date</label>
      <input type="date" className="rp-filter-input"
        value={toDate} onChange={e => setToDate(e.target.value)}
        style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e0e7ff", borderRadius:10, fontSize:12 }}
      />
    </div>
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:"#2563eb", display:"block", marginBottom:6 }}>Payment Method</label>
      <select className="rp-filter-input"
        value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
        style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e0e7ff", borderRadius:10, fontSize:12, cursor:"pointer" }}
      >
        {["all","cash","online","upi","credit"].map(m => (
          <option key={m} value={m}>
            {m === "all" ? "All Methods" : m.charAt(0).toUpperCase() + m.slice(1)}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:"#2563eb", display:"block", marginBottom:6 }}>Status</label>
      <select className="rp-filter-input"
        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
        style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e0e7ff", borderRadius:10, fontSize:12, cursor:"pointer" }}
      >
        <option value="all">All Status</option>
        <option value="paid">Paid</option>
        <option value="not_paid">Not Paid</option>
      </select>
    </div>
    <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:8 }}>
      <button onClick={applyFilter} style={{
        padding:"10px 0", borderRadius:10, border:"none",
        background:"#2563eb", color:"#fff",
        fontWeight:700, fontSize:13, cursor:"pointer",
      }}>Apply Filter</button>
      <button onClick={resetFilter} style={{
        padding:"10px 0", borderRadius:10, border:"none",
        background:"#f1f5f9", color:"#64748b",
        fontWeight:700, fontSize:13, cursor:"pointer",
      }}>Reset All</button>
    </div>
  </div>
)}
        {/* 2-COLUMN */}
        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:16, height:"calc(100vh - 120px)" }}>

          {/* LEFT — customer list */}
          <div style={card}>
            <div style={{ padding:"12px 14px", borderBottom:"1px solid #f1f5f9", position:"relative" }}>
              <Search size={15} style={{
                position:"absolute", top:"50%", left:26,
                transform:"translateY(-50%)", color:"#94a3b8",
              }}/>
              <input
                placeholder="Search customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width:"100%", padding:"9px 12px 9px 34px",
                  borderRadius:10, border:"1px solid #e2e8f0",
                  outline:"none", fontSize:13, boxSizing:"border-box",
                }}
              />
            </div>
            <div style={{ overflowY:"auto", flex:1 }}>
              {filtered.map(c => {
                const pt = getCustomerPendingTotal(c.id);
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div key={c.id} className="cust-row"
                    onClick={() => {
                      setSelectedCustomer(c);
                      fetchCustomerHistory(c.id);
                      setCollectAmount(""); setPreview([]);
                    }}
                    style={{
                      padding:"12px 14px", borderBottom:"1px solid #f1f5f9",
                      cursor:"pointer",
                      background:  isSelected ? "#eff6ff" : "#fff",
                      borderLeft:  isSelected ? "3px solid #2563eb" : "3px solid transparent",
                    }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{c.name}</div>
                        <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{c.phone}</div>
                      </div>
                      <div style={{ fontWeight:700, fontSize:13, color: pt > 0 ? "#ef4444" : "#94a3b8" }}>
                        ₹{fmt(pt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding:32, textAlign:"center", color:"#94a3b8", fontSize:13 }}>
                  No credit customers found
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — invoice table */}
          <div style={{ ...card, overflow:"hidden" }}>

            {/* customer info bar */}
            {selectedCustomer && (
              <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800, color:"#0f172a", marginBottom:8 }}>
                      {selectedCustomer.name}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#64748b", marginBottom:4 }}>
                      <Phone size={13}/> {selectedCustomer.phone}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#64748b" }}>
                      <MapPin size={13}/> {selectedCustomer.address}
                    </div>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
                    {/* pending badge */}
                    {totalPending > 0 && (
                      <div style={{
                        background:"#fef2f2", border:"1px solid #fecaca",
                        borderRadius:12, padding:"8px 16px", textAlign:"center",
                      }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#dc2626", textTransform:"uppercase" }}>Pending</div>
                        <div style={{ fontSize:18, fontWeight:900, color:"#dc2626" }}>₹{fmt(totalPending)}</div>
                      </div>
                    )}

                    {/* Download buttons */}
                    <button onClick={downloadExcel} style={btnGreen}>
                      <Download size={14}/>
                      {checkedIds.size > 0 ? `Excel (${checkedIds.size})` : "Excel"}
                    </button>
                    <button onClick={downloadPDF} style={btnRedSm}>
                      <FileDown size={14}/> PDF
                    </button>

                    {/* Send Reminder */}
                    {totalPending > 0 && (
                      <button onClick={sendCustomerReminder} disabled={sendingReminder}
                        style={{
                          background:"#22c55e", color:"#fff", border:"none",
                          borderRadius:12, padding:"10px 16px", fontWeight:700,
                          fontSize:13, cursor: sendingReminder?"not-allowed":"pointer",
                          display:"flex", alignItems:"center", gap:7,
                          boxShadow:"0 4px 14px rgba(34,197,94,.3)",
                        }}
                      >
                        <MessageCircle size={15}/>
                        {sendingReminder ? "Sending..." : "Remind"}
                      </button>
                    )}

                    {/* Collect */}
                    {totalPending > 0 && (
                      <button onClick={openCollect}
                        style={{
                          background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
                          color:"#fff", border:"none", borderRadius:12,
                          padding:"10px 16px", fontWeight:700, fontSize:13,
                          cursor:"pointer", display:"flex", alignItems:"center", gap:7,
                          boxShadow:"0 4px 14px rgba(37,99,235,.3)",
                        }}
                      >
                        <Wallet size={15}/> Collect
                      </button>
                    )}

                    {/* <button onClick={() => navigate(`/customer/edit/${selectedCustomer.id}`)} style={btnEdit}>
                      <Pencil size={15}/>
                    </button> */}
                  </div>
                </div>
              </div>
            )}

            {/* TABLE HEADER */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"40px 1fr 1fr 1fr 1fr 1fr 1fr",
              padding:"10px 20px",
              background:"#f8fafc", borderBottom:"1px solid #e5e7eb",
              fontWeight:700, fontSize:11, color:"#64748b",
              textTransform:"uppercase", letterSpacing:".5px",
            }}>
              <div style={{ display:"flex", alignItems:"center" }}>
                <input
                  type="checkbox" className="inv-cb"
                  checked={allCurrentChecked}
                  onChange={toggleAll}
                />
              </div>
              <span>Invoice No</span>
              <span style={{ textAlign:"center" }}>Method</span>
              <span style={{ textAlign:"center" }}>Total</span>
              <span style={{ textAlign:"center" }}>Paid</span>
              <span style={{ textAlign:"center" }}>Pending</span>
              <span style={{ textAlign:"center" }}>Status</span>
            </div>

            {/* TABLE ROWS */}
            <div style={{ overflowY:"auto", flex:1 }}>
              {invoiceHistory.length === 0 ? (
                <div style={{
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  padding:48, color:"#94a3b8", textAlign:"center",
                }}>
                  <div style={{ fontSize:52, marginBottom:14 }}>📄</div>
                  <div style={{ fontWeight:700, fontSize:16, color:"#0f172a" }}>No Billing Records</div>
                </div>
              ) : (
                currentInvs.map((item, index) => {
                  const isPaid    = Number(item.balance_amount) <= 0;
                  const isChecked = checkedIds.has(item.id);
                  return (
                    <div key={index}
                      onClick={() => navigate(`/invoice/${item.invoice_no}`)}
                      style={{
                        display:"grid",
                        gridTemplateColumns:"40px 1fr 1fr 1fr 1fr 1fr 1fr",
                        padding:"13px 20px", alignItems:"center",
                        borderBottom:"1px solid #f8fafc",
                        background: isChecked ? "#eff6ff" : "#fff",
                        cursor:"pointer",
                        transition:"background .15s",
                      }}
                    >
                      <div onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox" className="inv-cb"
                          checked={isChecked}
                          onChange={e => toggleOne(item.id, e)}
                        />
                      </div>
                      <div style={{ fontWeight:700, color:"#2563eb", fontSize:13 }}>
                        {item.invoice_no || "-"}
                      </div>
                      <div style={{ textAlign:"center", fontWeight:600, fontSize:13, textTransform:"capitalize" }}>
                        {item.payment_method || "-"}
                      </div>
                      <div style={{ textAlign:"center", fontSize:13 }}>₹{fmt(item.total_amount)}</div>
                      <div style={{ textAlign:"center", fontWeight:700, color:"#16a34a", fontSize:13 }}>
                        ₹{fmt(item.paid_amount_total)}
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <span style={{
                          background: isPaid?"#f0fdf4":"#fee2e2",
                          color:      isPaid?"#16a34a":"#dc2626",
                          padding:"4px 10px", borderRadius:8, fontSize:12, fontWeight:700,
                        }}>
                          ₹{fmt(item.balance_amount)}
                        </span>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <span style={{
                          padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700,
                          background: isPaid?"#dcfce7":"#fee2e2",
                          color:      isPaid?"#15803d":"#dc2626",
                          display:"inline-block", minWidth:64, textAlign:"center",
                        }}>
                          {isPaid ? "Paid" : "Not Paid"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION */}
            {totalInvPages > 1 && (
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 20px", borderTop:"1px solid #f1f5f9",
                background:"#fff", flexShrink:0,
              }}>
                <button onClick={() => setInvPage(p => Math.max(1, p-1))}
                  disabled={invPage===1}
                  style={{
                    display:"flex", alignItems:"center", gap:5,
                    padding:"7px 14px", borderRadius:9,
                    border:"1px solid #dbeafe", background:"#fff",
                    color:"#2563eb", fontWeight:600, fontSize:12,
                    cursor: invPage===1?"not-allowed":"pointer", opacity: invPage===1?.5:1,
                  }}
                >
                  <ChevronLeft size={14}/> Prev
                </button>

                <div style={{ display:"flex", gap:6 }}>
                  {Array.from({ length: totalInvPages }, (_, i) => i+1).map(p => (
                    <button key={p} onClick={() => setInvPage(p)} style={{
                      width:32, height:32, borderRadius:8,
                      border:"1px solid #dbeafe",
                      background: invPage===p ? "#2563eb" : "#fff",
                      color:      invPage===p ? "#fff"    : "#2563eb",
                      fontWeight:700, fontSize:12, cursor:"pointer",
                    }}>{p}</button>
                  ))}
                </div>

                <button onClick={() => setInvPage(p => Math.min(totalInvPages, p+1))}
                  disabled={invPage===totalInvPages}
                  style={{
                    display:"flex", alignItems:"center", gap:5,
                    padding:"7px 14px", borderRadius:9,
                    border:"1px solid #dbeafe", background:"#fff",
                    color:"#2563eb", fontWeight:600, fontSize:12,
                    cursor: invPage===totalInvPages?"not-allowed":"pointer",
                    opacity: invPage===totalInvPages?.5:1,
                  }}
                >
                  Next <ChevronRight size={14}/>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}



const card    = { background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", display:"flex", flexDirection:"column" };
const btnGreen = { background:"#16a34a", color:"#fff", border:"none", borderRadius:10, padding:"9px 14px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:12 };
const btnRedSm = { background:"#dc2626", color:"#fff", border:"none", borderRadius:10, padding:"9px 14px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:12 };
const btnEdit  = { background:"#eff6ff", border:"1px solid #dbeafe", width:40, height:40, borderRadius:12, cursor:"pointer", color:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 };