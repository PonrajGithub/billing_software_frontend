import { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function CustomerForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    gst_no: "",
    type: "B2B",
    credit_enabled: 0,
    credit_limit: "",
    credit_days: ""
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  //   const handleSubmit = async () => {
  //     const user     = JSON.parse(localStorage.getItem("user"));
  //     const admin_id = user?.id;

  //     if (!form.name.trim()) {
  //       showToast("Customer name is required", false);
  //       return;
  //     }

  //     if (!/^[0-9]{10}$/.test(form.phone)) {
  //       showToast("Enter valid 10-digit mobile number", false);
  //       return;
  //     }

  //     if (!form.gst_no.trim()) {
  //       showToast("GST number is required", false);
  //       return;
  //     }

  //     if (!GST_REGEX.test(form.gst_no)) {
  //       showToast("Invalid GST format (e.g. 22ABCDE1234F1Z5)", false);
  //       return;
  //     }

  //     setLoading(true);

  //     try {
  //       const payload = {
  //         admin_id,
  //         name:           form.name.trim(),
  //         phone:          form.phone,
  //         address:        form.address,
  //         gst_no:         form.gst_no,
  //         type:           form.type,
  //         credit_enabled: form.credit_enabled,
  //         credit_limit:   form.credit_enabled ? form.credit_limit : 0,
  //         credit_days:    form.credit_enabled ? form.credit_days  : 0
  //       };

  //       const res = await api.post("/customer/create_customer.php", payload);
  // console.log("API Response:", res.data);
  //       if (res.data.status) {
  //         showToast("Customer created successfully!");
  //         setTimeout(() => navigate("/customer"), 1500);
  //       } else {
  //         showToast(res.data.message || "Failed to create", false);
  //       }
  //     } catch (err) {
  //       console.error(err);
  //       showToast("Server error", false);
  //     }

  //     setLoading(false);
  //   };


  const handleSubmit = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const admin_id = user?.id;

    if (!form.name.trim()) {
      showToast("Customer name is required", false);
      return;
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      showToast("Enter valid 10-digit mobile number", false);
      return;
    }

    // GST mandatory only for B2B (regular)
    if (form.type === "regular") {
      if (!form.gst_no.trim()) {
        showToast("GST number is required for B2B customers", false);
        return;
      }
      if (!GST_REGEX.test(form.gst_no)) {
        showToast("Invalid GST format (e.g. 22ABCDE1234F1Z5)", false);
        return;
      }
    } else {
      // B2C - optional, but validate format if entered
      if (form.gst_no.trim() && !GST_REGEX.test(form.gst_no)) {
        showToast("Invalid GST format (e.g. 22ABCDE1234F1Z5)", false);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        admin_id,
        name: form.name.trim(),
        phone: form.phone,
        address: form.address,
        gst_no: form.gst_no,
        type: form.type,
        credit_enabled: form.credit_enabled,
        credit_limit: form.credit_enabled ? form.credit_limit : 0,
        credit_days: form.credit_enabled ? form.credit_days : 0
      };

      const res = await api.post("/customer/create_customer", payload);
      console.log("API Response:", res.data);
      if (res.data.status) {
        showToast("Customer created successfully!");
        setTimeout(() => navigate("/customer"), 1500);
      } else {
        showToast(res.data.message || "Failed to create", false);
      }
    } catch (err) {
      console.error(err);
      showToast("Server error", false);
    }

    setLoading(false);
  };
  return (
    <>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 99999,
          background: toast.ok
            ? "linear-gradient(135deg,#2563eb,#3b82f6)"
            : "linear-gradient(135deg,#dc2626,#ef4444)",
          color: "#fff", padding: "13px 18px", borderRadius: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,.15)",
          display: "flex", alignItems: "center", gap: 10,
          fontWeight: 600, fontSize: 14, animation: "toastIn .25s ease"
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7,
            background: "rgba(255,255,255,.2)",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 700
          }}>
            {toast.ok ? "✓" : "✕"}
          </div>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateY(-10px) scale(.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#eef2f7",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Inter, sans-serif"
      }}>
        <div style={{
          width: 400, background: "#fff", borderRadius: 24,
          overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.08)"
        }}>

          {/* HEADER */}
          <div style={{
            background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            padding: 24, color: "#fff"
          }}>
            <h2 style={{ margin: 0 }}>Add Customer</h2>
            <p style={{ margin: "5px 0 0", fontSize: 13, opacity: 0.8 }}>
              Create a new customer record
            </p>
          </div>

          {/* FORM */}
          <div style={{ padding: 20 }}>

            {/* NAME */}
            <input
              placeholder="Customer Name *"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              style={inputStyle}
            />

            {/* PHONE */}
            <input
              placeholder="Mobile Number *"
              value={form.phone}
              onChange={e =>
                set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              style={inputStyle}
            />



            {/* ADDRESS */}
            <textarea
              placeholder="Address"
              value={form.address}
              onChange={e => set("address", e.target.value)}
              style={{ ...inputStyle, height: 70, resize: "none" }}
            />





            {/* CUSTOMER TYPE */}
            <label style={{
              fontSize: 12, fontWeight: 600,
              color: "#475569", display: "block", marginBottom: 6
            }}>
              Customer Type
            </label>
            <select
              value={form.type}
              onChange={e => set("type", e.target.value)}
              style={inputStyle}
            >
              <option value="B2B">Regular B2B</option>
              <option value="B2C">Regular B2C</option>
            </select>

            {/* GST — label changes based on customer type */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                fontSize: 12, fontWeight: 600,
                color: "#475569", display: "flex",
                alignItems: "center", gap: 6, marginBottom: 6
              }}>
                GST Number
                {form.type === "B2B" ? (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: "#dc2626", background: "#fef2f2",
                    padding: "2px 8px", borderRadius: 20,
                    border: "1px solid #fecaca"
                  }}>
                    Mandatory
                  </span>
                ) : (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: "#16a34a", background: "#f0fdf4",
                    padding: "2px 8px", borderRadius: 20,
                    border: "1px solid #bbf7d0"
                  }}>
                    Optional
                  </span>
                )}
              </label>

              <input
                placeholder="e.g. 22ABCDE1234F1Z5"
                value={form.gst_no}
                maxLength={15}
                onChange={e =>
                  set("gst_no", e.target.value.toUpperCase().slice(0, 15))
                }
                style={{
                  ...inputStyle,
                  marginBottom: 4,
                  border: form.gst_no.length === 15
                    ? "1.5px solid #16a34a"
                    : form.gst_no.length > 0
                      ? "1.5px solid #f59e0b"
                      : "1.5px solid transparent"
                }}
              />

              <div style={{
                fontSize: 11, fontWeight: 600, textAlign: "right",
                color: form.gst_no.length === 15 ? "#16a34a" : "#94a3b8"
              }}>
                {form.gst_no.length} / 15
              </div>
            </div>

            {/* CREDIT ENABLED */}
            <div style={{
              display: "flex", gap: 20,
              alignItems: "center", marginBottom: 12
            }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                Credit Enabled
              </label>
              {[{ label: "Yes", val: 1 }, { label: "No", val: 0 }].map(opt => (
                <label key={opt.val} style={{
                  display: "flex", alignItems: "center", gap: 6, fontSize: 13
                }}>
                  <input
                    type="radio"
                    name="credit_enabled"
                    value={opt.val}
                    checked={form.credit_enabled === opt.val}
                    onChange={e => set("credit_enabled", Number(e.target.value))}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {form.credit_enabled === 1 && (
              <>
                <input
                  type="number"
                  placeholder="Credit Limit (₹)"
                  value={form.credit_limit}
                  onChange={e => set("credit_limit", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Credit Days"
                  value={form.credit_days}
                  onChange={e => set("credit_days", e.target.value)}
                  style={inputStyle}
                />
              </>
            )}

            {/* SUBMIT */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", marginTop: 10, padding: 14,
                border: "none", borderRadius: 14,
                background: loading
                  ? "#93c5fd"
                  : "linear-gradient(135deg,#2563eb,#3b82f6)",
                color: "#fff", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14
              }}
            >
              {loading ? "Creating..." : "Create Customer"}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  marginBottom: 12,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1.5px solid transparent",
  background: "#f1f5f9",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box"
};