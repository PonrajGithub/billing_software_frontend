import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Pencil, Trash2, Eye, Plus, FileSpreadsheet } from "lucide-react";

const ITEMS_PER_PAGE = 8;

export default function PurchaseList() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(
    localStorage.getItem("selected_company_id") || ""
  );
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    api.get(`/company/get_companies_by_admin?admin_id=${user.id}`)
      .then(res => {
        if (res.data.status) {
          setCompanies(res.data.data);
          const savedId = localStorage.getItem("selected_company_id");
          if (savedId) {
            fetchPurchases(savedId);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchPurchases = async (companyId) => {
    setLoading(true);
    try {
      const res = await api.get(`/purchase/get_purchases?company_id=${companyId}`);
      if (res.data.status) {
        setPurchases(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId) => {
    setSelectedCompany(companyId);
    localStorage.setItem("selected_company_id", companyId);
    setCurrentPage(1);
    fetchPurchases(companyId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this draft purchase?")) return;
    try {
      const res = await api.post(`/purchase/delete_purchase`, { id });
      if (res.data.status) {
        alert("Purchase draft deleted successfully");
        fetchPurchases(selectedCompany);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting purchase");
    }
  };

  // Filter & Paginate
  const filtered = purchases.filter((p) => {
    const billNo = p.purchase_no ? p.purchase_no.toLowerCase() : "";
    const supName = p.supplier_name ? p.supplier_name.toLowerCase() : "";
    return billNo.includes(search.toLowerCase()) || supName.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div style={{ padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Supplier Purchases</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>Manage supplier invoices, drafts, and inventory submittals</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/purchases/reports")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "12px",
              background: "#ffffff",
              color: "#3b82f6",
              border: "1.5px solid #dbeafe",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <FileSpreadsheet size={16} /> GST Report
          </button>
          <button
            onClick={() => navigate("/purchases/new")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "12px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37,99,235,0.2)"
            }}
          >
            <Plus size={16} /> Add Purchase
          </button>
        </div>
      </div>

      {/* Company Selector Buttons */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {companies.map((c) => {
            const isActive = Number(selectedCompany) === Number(c.id);
            return (
              <button
                key={c.id}
                onClick={() => handleCompanyChange(c.id)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: isActive ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                  backgroundColor: isActive ? "#2563eb" : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  boxShadow: isActive ? "0 4px 12px rgba(37,99,235,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>🏢</span> {c.company_name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search toolbar */}
      <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", gap: "15px" }}>
        <input
          type="text"
          placeholder="Search by Bill No or Supplier Name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "1.5px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "14px",
            outline: "none",
            color: "#334155",
            background: "#f8fafc"
          }}
        />
      </div>

      {/* Table Card */}
      <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "#64748b" }}>Date</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "#64748b" }}>Bill / Invoice No</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "#64748b" }}>Supplier</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "#64748b" }}>Subtotal</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "#64748b" }}>GST Total</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "#64748b" }}>Total Amount</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "#64748b" }}>Status</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "700", color: "#64748b", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>Loading purchases...</td>
              </tr>
            ) : !selectedCompany ? (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>Select a company to view purchases</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>No purchase bills found</td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", hover: { background: "#f8fafc" } }}>
                  <td style={{ padding: "16px 20px", fontSize: "14px", fontWeight: "500", color: "#334155" }}>
                    {p.purchase_date}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                    {p.purchase_no || "N/A"}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: "14px", color: "#475569" }}>
                    {p.supplier_name || "Unknown"}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: "14px", color: "#475569" }}>
                    ₹{Number(p.sub_total).toFixed(2)}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: "14px", color: "#475569" }}>
                    ₹{Number(p.gst_total).toFixed(2)}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                    ₹{Number(p.total_amount).toFixed(2)}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        backgroundColor: p.status === "submitted" ? "#dcfce7" : "#fef9c3",
                        color: p.status === "submitted" ? "#15803d" : "#854d0e"
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                      {p.status === "draft" ? (
                        <>
                          <button
                            onClick={() => navigate(`/purchases/edit/${p.id}`)}
                            title="Edit Draft"
                            style={{
                              border: "none",
                              background: "#f0fdf4",
                              color: "#16a34a",
                              padding: "8px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Delete Draft"
                            style={{
                              border: "none",
                              background: "#fef2f2",
                              color: "#dc2626",
                              padding: "8px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => navigate(`/purchases/edit/${p.id}`)}
                          title="View Details"
                          style={{
                            border: "none",
                            background: "#eff6ff",
                            color: "#2563eb",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "14px", color: "#64748b" }}>
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage(safePage - 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  cursor: safePage === 1 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#64748b"
                }}
              >
                Previous
              </button>
              <button
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  cursor: safePage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#64748b"
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
