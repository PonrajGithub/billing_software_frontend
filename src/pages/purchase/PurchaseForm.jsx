import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Save, UploadCloud, Plus, Trash2, HelpCircle } from "lucide-react";
import * as XLSX from "xlsx";

export default function PurchaseForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Draft ID if editing

  const [selectedCompany, setSelectedCompany] = useState(
    localStorage.getItem("selected_company_id") || ""
  );
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [purchaseNo, setPurchaseNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidAmount, setPaidAmount] = useState(0);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Locked if submitted

  // Load basic configurations
  useEffect(() => {
    if (!selectedCompany) return;

    // Load Suppliers for selected company
    api.get(`/supplier/get_all?company_id=${selectedCompany}`)
      .then(res => {
        if (res.data.status) {
          setSuppliers(res.data.data);
        }
      })
      .catch(console.error);

    // If ID is provided, load the draft purchase
    if (id) {
      setLoading(true);
      api.get(`/purchase/get_purchase_by_id?id=${id}`)
        .then(res => {
          if (res.data.status) {
            const p = res.data.data;
            setSelectedSupplier(p.supplier_id);
            setPurchaseNo(p.purchase_no || "");
            setPurchaseDate(p.purchase_date);
            setPaidAmount(p.paid_amount || 0);
            setIsLocked(p.status === "submitted");

            // Format items for validation lookup
            const formatted = p.items.map(item => ({
              product_name: item.product_name,
              product_code: item.product_code || "",
              barcode: item.barcode || "",
              category_name: item.category_name || "",
              subcategory_name: item.subcategory_name || "",
              brand_name: item.brand_name || "",
              price: Number(item.price),
              quantity: Number(item.quantity),
              unit: item.unit || "pcs",
              gst_percentage: Number(item.gst_percentage),
              product_id: item.product_id,
              category_id: item.category_id,
              subcategory_id: item.subcategory_id,
              brand_id: item.brand_id,
              status: "valid",
              errors: [],
              warnings: []
            }));
            setItems(formatted);
            // Re-run validation against backend DB to check status
            runBackendValidation(formatted);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [selectedCompany, id]);

  // Run validation on local items with backend lookups
  const runBackendValidation = async (currentItems) => {
    if (currentItems.length === 0) return;
    try {
      const res = await api.post("/purchase/validate_items", {
        company_id: selectedCompany,
        items: currentItems.map(item => ({
          product_name: item.product_name,
          product_code: item.product_code,
          barcode: item.barcode,
          category_name: item.category_name,
          subcategory_name: item.subcategory_name,
          brand_name: item.brand_name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          gst_percentage: item.gst_percentage
        }))
      });
      if (res.data.status) {
        // Sync resolved IDs & warnings/errors back to local state
        const validated = res.data.data;
        setItems(prev =>
          prev.map((item, index) => {
            const val = validated[index] || {};
            return {
              ...item,
              product_id: val.product_id,
              category_id: val.category_id,
              subcategory_id: val.subcategory_id,
              brand_id: val.brand_id,
              status: val.status,
              errors: val.errors || [],
              warnings: val.warnings || []
            };
          })
        );
      }
    } catch (err) {
      console.error("Backend validation error", err);
    }
  };

  // Trigger Excel file template download
  const downloadTemplate = () => {
    const headers = [
      ["Product Name", "Product Code", "Barcode", "Category", "Subcategory", "Brand", "Purchase Price", "Quantity", "Unit", "GST %"],
      ["Sample Product A", "PRDA01", "1234567890", "Electronics", "Mobiles", "BrandX", "15000", "10", "pcs", "18"],
      ["Sample Product B", "PRDB02", "", "Groceries", "Snacks", "BrandY", "120", "50", "box", "5"]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Purchase_Invoice_Import_Template.xlsx");
  };

  // Parse Excel file input
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        alert("The uploaded excel sheet is empty!");
        return;
      }

      // Map spreadsheet columns to keys
      const parsed = json.map(row => {
        // Find keys case-insensitively
        const findVal = (names) => {
          const key = Object.keys(row).find(k => names.includes(k.trim().toLowerCase()));
          return key ? row[key] : "";
        };

        return {
          product_name: String(findVal(["product name", "name", "product_name"]) || ""),
          product_code: String(findVal(["product code", "code", "sku", "product_code"]) || ""),
          barcode: String(findVal(["barcode", "barcode_no"]) || ""),
          category_name: String(findVal(["category", "category name", "category_name"]) || ""),
          subcategory_name: String(findVal(["subcategory", "sub category", "subcategory_name"]) || ""),
          brand_name: String(findVal(["brand", "brand name", "brand_name"]) || ""),
          price: parseFloat(findVal(["purchase price", "price", "rate", "cost"]) || 0),
          quantity: parseInt(findVal(["quantity", "qty", "stock"]) || 0),
          unit: String(findVal(["unit", "uom"]) || "pcs"),
          gst_percentage: parseFloat(findVal(["gst %", "gst", "gst_percentage"]) || 0),
          status: "pending",
          errors: [],
          warnings: []
        };
      });

      setItems(parsed);
      runBackendValidation(parsed);
    };
    reader.readAsArrayBuffer(file);
    // Reset file input value
    e.target.value = null;
  };

  // Add a blank manual row
  const addManualRow = () => {
    const newRow = {
      product_name: "",
      product_code: "",
      barcode: "",
      category_name: "",
      subcategory_name: "",
      brand_name: "",
      price: 0,
      quantity: 1,
      unit: "pcs",
      gst_percentage: 0,
      status: "pending",
      errors: [],
      warnings: []
    };
    const updated = [...items, newRow];
    setItems(updated);
    runBackendValidation(updated);
  };

  // Modify row inline
  const updateRowField = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);

    // Debounce backend check to avoid overloading
    const timer = setTimeout(() => {
      runBackendValidation(updated);
    }, 400);
    return () => clearTimeout(timer);
  };

  // Remove row
  const deleteRow = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    runBackendValidation(updated);
  };

  // Calculation totals
  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const gstTotal = items.reduce((sum, item) => sum + ((item.quantity * item.price) * (item.gst_percentage / 100)), 0);
  const grandTotal = subTotal + gstTotal;

  // Actions
  const handleSaveDraft = async () => {
    if (!selectedSupplier) {
      alert("Please select a supplier!");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/purchase/save_draft", {
        id: id || 0,
        company_id: selectedCompany,
        supplier_id: selectedSupplier,
        purchase_no: purchaseNo,
        purchase_date: purchaseDate,
        paid_amount: paidAmount,
        items
      });
      if (res.data.status) {
        alert(res.data.message);
        navigate("/purchases");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving purchase draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPurchase = async () => {
    if (!selectedSupplier) {
      alert("Please select a supplier!");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item!");
      return;
    }
    // Check if any row has status === "error"
    const hasErrors = items.some(item => item.status === "error");
    if (hasErrors) {
      alert("Please resolve all row errors before submitting to inventory!");
      return;
    }

    if (!window.confirm("Submit purchase? This will commit items and update inventory stock values permanently.")) return;

    setSaving(true);
    try {
      const res = await api.post("/purchase/submit_purchase", {
        id: id || 0,
        company_id: selectedCompany,
        supplier_id: selectedSupplier,
        purchase_no: purchaseNo,
        purchase_date: purchaseDate,
        paid_amount: paidAmount,
        items
      });
      if (res.data.status) {
        alert(res.data.message);
        navigate("/purchases");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error finalizing purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "25px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate("/purchases")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              cursor: "pointer",
              color: "#475569"
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              {isLocked ? "View Purchase Bill" : id ? "Edit Draft Purchase" : "New Purchase Invoice"}
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              {isLocked ? "Submitted purchase invoice detail is locked" : "Upload supplier invoices or add items manually"}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading purchase record...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "25px", alignItems: "start" }}>
          {/* Main Workspace (Import & Grid Table) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Import Controls */}
            {!isLocked && (
              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Import Invoice Items</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", marginTop: "3px" }}>Upload supplier excel directly to validate and check catalog matches</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={downloadTemplate}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      background: "#f0fdf4",
                      color: "#16a34a",
                      border: "1.5px solid #bbf7d0",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    Template.xlsx
                  </button>
                  <label
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <UploadCloud size={16} /> Upload Excel
                    <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} style={{ display: "none" }} />
                  </label>
                </div>
              </div>
            )}

            {/* Validation Correction Grid */}
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Invoice Items</h3>
                {!isLocked && (
                  <button
                    onClick={addManualRow}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "#ffffff",
                      color: "#2563eb",
                      border: "1.5px solid #dbeafe",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <Plus size={14} /> Add Row
                  </button>
                )}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b", width: "50px" }}>Status</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Product Name *</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Product Code</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Barcode</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Category</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Subcategory</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Brand</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b", width: "100px" }}>Cost Price</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b", width: "80px" }}>Qty</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b", width: "80px" }}>Unit</th>
                      <th style={{ padding: "12px 15px", fontSize: "12px", fontWeight: "700", color: "#64748b", width: "85px" }}>GST %</th>
                      {!isLocked && <th style={{ padding: "12px 15px", width: "50px" }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={isLocked ? 11 : 12} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                          No items added. Import excel or add manual rows to start.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        const statusColors = {
                          valid: { bg: "#dcfce7", color: "#15803d" },
                          warning: { bg: "#fef9c3", color: "#854d0e" },
                          error: { bg: "#fee2e2", color: "#b91c1c" },
                          pending: { bg: "#f1f5f9", color: "#475569" }
                        };
                        const statusStyle = statusColors[item.status] || statusColors.pending;

                        return (
                          <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            {/* Status */}
                            <td style={{ padding: "12px 15px", textAlign: "center" }}>
                              <div
                                title={[...(item.errors || []), ...(item.warnings || [])].join("\n")}
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "800",
                                  fontSize: "12px",
                                  cursor: "pointer"
                                }}
                              >
                                {item.status === "valid" ? "✓" : item.status === "error" ? "!" : "?"}
                              </div>
                            </td>
                            {/* Product Name */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="text"
                                value={item.product_name}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "product_name", e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  border: item.product_name ? "1px solid #e2e8f0" : "1.5px solid #ef4444",
                                  borderRadius: "6px",
                                  fontSize: "13px"
                                }}
                              />
                            </td>
                            {/* Code */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="text"
                                value={item.product_code}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "product_code", e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* Barcode */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="text"
                                value={item.barcode}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "barcode", e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* Category */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="text"
                                value={item.category_name}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "category_name", e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* Subcategory */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="text"
                                value={item.subcategory_name}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "subcategory_name", e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* Brand */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="text"
                                value={item.brand_name}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "brand_name", e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* Price */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="number"
                                value={item.price}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "price", parseFloat(e.target.value) || 0)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* Qty */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="number"
                                value={item.quantity}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "quantity", parseInt(e.target.value) || 0)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* Unit */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="text"
                                value={item.unit}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "unit", e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* GST */}
                            <td style={{ padding: "8px 6px" }}>
                              <input
                                type="number"
                                value={item.gst_percentage}
                                disabled={isLocked}
                                onChange={(e) => updateRowField(index, "gst_percentage", parseFloat(e.target.value) || 0)}
                                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }}
                              />
                            </td>
                            {/* Action delete */}
                            {!isLocked && (
                              <td style={{ padding: "12px 15px", textAlign: "center" }}>
                                <button
                                  onClick={() => deleteRow(index)}
                                  style={{
                                    border: "none",
                                    background: "#fef2f2",
                                    color: "#dc2626",
                                    padding: "6px",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Panel (Supplier details & Totals summary) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {/* Metadata Card */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", marginBottom: "15px" }}>Invoice Parameters</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Supplier *</label>
                  <select
                    value={selectedSupplier}
                    disabled={isLocked}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e8f0",
                      outline: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      background: isLocked ? "#f1f5f9" : "#ffffff"
                    }}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Bill / Invoice No</label>
                  <input
                    type="text"
                    value={purchaseNo}
                    disabled={isLocked}
                    onChange={(e) => setPurchaseNo(e.target.value)}
                    placeholder="Enter Invoice Bill No"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "14px",
                      background: isLocked ? "#f1f5f9" : "#ffffff"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    disabled={isLocked}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "14px",
                      background: isLocked ? "#f1f5f9" : "#ffffff"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Summary Card */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.01)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", marginBottom: "15px" }}>Bill Summary</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px", marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b" }}>
                  <span>Total Items:</span>
                  <span style={{ fontWeight: "600", color: "#334155" }}>{items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b" }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: "600", color: "#334155" }}>₹{subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b" }}>
                  <span>GST Total:</span>
                  <span style={{ fontWeight: "600", color: "#334155" }}>₹{gstTotal.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "20px" }}>
                <span>Grand Total:</span>
                <span style={{ color: "#10b981" }}>₹{grandTotal.toFixed(2)}</span>
              </div>

              {!isLocked && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "20px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Paid Amount</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "14px"
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              {!isLocked ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    onClick={handleSubmitPurchase}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      background: "#10b981",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(16,185,129,0.15)"
                    }}
                  >
                    {saving ? "Processing..." : "Submit to Inventory"}
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "12px",
                      background: "#ffffff",
                      color: "#475569",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Save as Draft
                  </button>
                </div>
              ) : (
                <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontWeight: "700", fontSize: "14px", textAlign: "center" }}>
                  Bill Submitted to Inventory ✓
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
