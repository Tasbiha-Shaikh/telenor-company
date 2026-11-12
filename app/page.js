"use client";

import { useEffect, useMemo, useState } from "react";

const STATUS_HELP = {
  active: "SIM chal rahi hai, service use ho rahi hai",
  inactive: "SIM kaafi dino se use nahi hui (company ne roki nahi)",
  suspended: "Company ne service temporarily band ki hui hai",
};
const STATUS_OPTIONS = ["active", "inactive", "suspended"];

const emptyForm = {
  name: "", gender: "Male", age: 18, city: "", province: "", phone: "",
  email: "", package_id: "PKG001", connection_type: "prepaid",
  monthly_spend_pkr: 0, status: "active",
};

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(null); // null = modal band
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }
      setAuthenticated(true);
    } catch {
      setLoginError("Server se connect nahi ho saka.");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setCustomers([]);
  };

  const load = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        setError((data.error || "Data load nahi ho saka") + (data.detail ? ` — ${data.detail}` : ""));
        return;
      }
      setCustomers(data);
      setError("");
    } catch {
      setError("Server se connect nahi ho saka.");
    }
  };

  useEffect(() => {
    if (authenticated) load();
  }, [authenticated]);

  // Stats (customers se hi calculate hote hain)
  const stats = useMemo(() => {
    const cities = {};
    customers.forEach((c) => { cities[c.city] = (cities[c.city] || 0) + 1; });
    const count = (s) => customers.filter((c) => c.status === s).length;
    return {
      total: customers.length,
      active: count("active"),
      inactive: count("inactive"),
      suspended: count("suspended"),
      cities: Object.entries(cities).sort((a, b) => b[1] - a[1]),
    };
  }, [customers]);

  // Search + filters
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return customers.filter(
      (c) =>
        (!city || c.city === city) &&
        (!status || c.status === status) &&
        (!s || c.name.toLowerCase().includes(s) || c.phone.includes(s))
    );
  }, [customers, search, city, status]);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(""); };
  const openEdit = (c) => { setForm({ ...c, status: c.status || "active" }); setEditId(c.customer_id); setError(""); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(editId ? `/api/customers/${editId}` : "/api/customers", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data.error || "Something went wrong") + (data.detail ? ` — ${data.detail}` : ""));
        return;
      }
      setCustomers((prev) => editId
        ? prev.map((c) => (c.customer_id === editId ? data : c))
        : [...prev, data]);
      setForm(null);
    } catch {
      setError("Server se connect nahi ho saka.");
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`${c.name} ko delete karna hai?`)) return;
    await fetch(`/api/customers/${c.customer_id}`, { method: "DELETE" });
    load();
  };

  if (!authenticated) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={login}>
          <div className="brand-mark">T</div>
          <p className="eyebrow">TELENOR CUSTOMER MANAGER</p>
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to view and manage customer data.</p>
          {loginError && <p className="error">{loginError}</p>}
          <label>
            Username
            <input autoComplete="username" value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
          </label>
          <button className="primary login-button" disabled={loggingIn}>
            {loggingIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1>📱 Telenor Customer Manager</h1>
        <button onClick={logout}>Sign out</button>
      </header>
      {error && !form && <p className="error">{error}</p>}

      <div className="cards">
        <div className="card"><span>Total</span><b>{stats.total}</b></div>
        <div className="card"><span>Active</span><b>{stats.active}</b></div>
        <div className="card"><span>Inactive</span><b>{stats.inactive}</b></div>
        <div className="card"><span>Suspended</span><b>{stats.suspended}</b></div>
        <div className="card"><span>Cities</span><b>{stats.cities.length}</b></div>
      </div>

      <div className="toolbar">
        <input placeholder="Name ya phone se search..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All cities</option>
          {stats.cities.map(([name, n]) => (
            <option key={name} value={name}>{name} ({n})</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="suspended">suspended</option>
        </select>
        <button className="primary" onClick={openAdd}>+ Add customer</button>
      </div>

      <p className="count">{filtered.length} customers dikh rahe hain</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>City</th><th>Phone</th>
              <th>Package</th><th>Type</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.customer_id}>
                <td>{c.customer_id}</td>
                <td>{c.name}</td>
                <td>{c.city}</td>
                <td>{c.phone}</td>
                <td>{c.package_id}</td>
                <td>{c.connection_type}</td>
                <td>
                  <span className={`badge ${c.status}`} title={STATUS_HELP[c.status]}>
                    {c.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => openEdit(c)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>City-wise customers</h2>
      <div className="city-list">
        {stats.cities.map(([name, n]) => (
          <div key={name} className="city-row">
            <span className="city-name">{name}</span>
            <div className="bar"><div style={{ width: `${(n / stats.cities[0][1]) * 100}%` }} /></div>
            <span>{n}</span>
          </div>
        ))}
      </div>

      {form && (
        <div className="overlay" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2>{editId ? `Edit ${editId}` : "Add customer"}</h2>
            {error && <p className="error">{error}</p>}
            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
            <input name="phone" placeholder="Phone (0345-1234567)" value={form.phone} onChange={handleChange} required />
            <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
            <input name="province" placeholder="Province" value={form.province} onChange={handleChange} />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <input name="age" type="number" min="18" placeholder="Age" value={form.age} onChange={handleChange} />
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option>Male</option><option>Female</option>
            </select>
            <select name="package_id" value={form.package_id} onChange={handleChange}>
              <option>PKG001</option><option>PKG002</option><option>PKG003</option><option>PKG004</option>
            </select>
            <select name="connection_type" value={form.connection_type} onChange={handleChange}>
              <option>prepaid</option><option>postpaid</option>
            </select>
            <select name="status" value={form.status} onChange={handleChange}>
              <option>active</option><option>inactive</option><option>suspended</option>
            </select>
            <input name="monthly_spend_pkr" type="number" placeholder="Monthly spend (PKR)"
              value={form.monthly_spend_pkr} onChange={handleChange} />
            <div className="actions">
              <button type="button" onClick={() => setForm(null)}>Cancel</button>
              <button className="primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}