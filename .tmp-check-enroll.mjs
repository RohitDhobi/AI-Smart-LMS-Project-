// Temporary verification helper (deleted after the check).
const API = "http://localhost:8080/api";

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.token;
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

const adminToken = await login("admin@example.com", "admin123");
console.log("admin token:", adminToken ? "ok" : "FAILED");

const courses = await get("/courses", adminToken);
console.log("courses:", courses.map((c) => `${c.id}:${c.title}`).join(" | "));

for (const cid of [6, 11]) {
  const list = await get(`/admin/courses/${cid}/students`, adminToken);
  const rows = Array.isArray(list) ? list : list.students || list.content || [];
  console.log(
    `course ${cid} enrolled=${rows.length}:`,
    rows.map((s) => s.email).join(", ")
  );
}
