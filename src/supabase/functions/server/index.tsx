import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client helper
const getSupabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify JWT token and get user
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Missing authorization header" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return c.json({ error: "Invalid token" }, 401);
  }

  c.set("userId", user.id);
  c.set("userEmail", user.email);
  await next();
};

// Health check endpoint
app.get("/make-server-a9845035/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ AUTH ROUTES ============

// Sign up
app.post("/make-server-a9845035/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { name }
    });

    if (error) {
      console.log("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error: any) {
    console.log("Signup error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ OFFICE ROUTES ============

// Create office
app.post("/make-server-a9845035/offices", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { name, officeName } = await c.req.json();

    const officeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const officeId = crypto.randomUUID();
    const employeeId = crypto.randomUUID();

    const office = {
      id: officeId,
      code: officeCode,
      creatorId: userId,
      name: officeName
    };

    const employee = {
      id: employeeId,
      userId: userId,
      officeId: officeId,
      name: name,
      employeeNumber: "00001",
      role: "Owner",
      isCreator: true,
      isHeadManager: true,
      payRate: 0
    };

    // Default roles
    const roles = [
      { id: crypto.randomUUID(), officeId, name: "Owner", permissions: ["all"] },
      { id: crypto.randomUUID(), officeId, name: "Manager", permissions: ["manage_shifts", "manage_tasks", "view_inventory"] },
      { id: crypto.randomUUID(), officeId, name: "Cashier", permissions: ["view_shifts", "view_tasks"] },
      { id: crypto.randomUUID(), officeId, name: "Technician", permissions: ["view_shifts", "manage_tasks"] }
    ];

    await kv.set(`office:${officeId}`, office);
    await kv.set(`employee:${employeeId}`, employee);
    await kv.set(`office:${officeId}:employees`, [employee]);
    await kv.set(`office:${officeId}:roles`, roles);
    await kv.set(`user:${userId}:employee:${officeId}`, employeeId);

    return c.json({ office, employee, roles });
  } catch (error: any) {
    console.log("Create office error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Join office
app.post("/make-server-a9845035/offices/join", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { officeCode, name } = await c.req.json();

    // Find office by code
    const allKeys = await kv.getByPrefix("office:");
    let foundOffice = null;
    let officeKey = null;

    for (const office of allKeys) {
      if (office.code === officeCode && !office.employees) {
        foundOffice = office;
        officeKey = `office:${office.id}`;
        break;
      }
    }

    if (!foundOffice) {
      return c.json({ error: "Office not found" }, 404);
    }

    const employees = await kv.get(`office:${foundOffice.id}:employees`) || [];
    const existingEmployee = employees.find((e: any) => e.userId === userId);

    if (existingEmployee) {
      return c.json({ error: "You are already a member of this office" }, 400);
    }

    const employeeNumber = String(employees.length + 1).padStart(5, "0");
    const employeeId = crypto.randomUUID();

    const newEmployee = {
      id: employeeId,
      userId: userId,
      officeId: foundOffice.id,
      name: name,
      employeeNumber: employeeNumber,
      role: "Cashier",
      isCreator: false,
      isHeadManager: false,
      payRate: 0
    };

    employees.push(newEmployee);
    await kv.set(`office:${foundOffice.id}:employees`, employees);
    await kv.set(`employee:${employeeId}`, newEmployee);
    await kv.set(`user:${userId}:employee:${foundOffice.id}`, employeeId);

    const roles = await kv.get(`office:${foundOffice.id}:roles`) || [];

    return c.json({ office: foundOffice, employee: newEmployee, employees, roles });
  } catch (error: any) {
    console.log("Join office error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user's offices
app.get("/make-server-a9845035/offices", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const employeeKeys = await kv.getByPrefix(`user:${userId}:employee:`);
    
    const offices = [];
    for (const empId of employeeKeys) {
      const employee = await kv.get(`employee:${empId}`);
      if (employee) {
        const office = await kv.get(`office:${employee.officeId}`);
        const employees = await kv.get(`office:${employee.officeId}:employees`) || [];
        const roles = await kv.get(`office:${employee.officeId}:roles`) || [];
        offices.push({ office, employee, employees, roles });
      }
    }

    return c.json({ offices });
  } catch (error: any) {
    console.log("Get offices error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get office data
app.get("/make-server-a9845035/offices/:officeId", requireAuth, async (c) => {
  try {
    const officeId = c.req.param("officeId");
    const office = await kv.get(`office:${officeId}`);
    
    if (!office) {
      return c.json({ error: "Office not found" }, 404);
    }

    const employees = await kv.get(`office:${officeId}:employees`) || [];
    const roles = await kv.get(`office:${officeId}:roles`) || [];

    return c.json({ office, employees, roles });
  } catch (error: any) {
    console.log("Get office error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update employee
app.put("/make-server-a9845035/employees/:employeeId", requireAuth, async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const updates = await c.req.json();

    const employee = await kv.get(`employee:${employeeId}`);
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const updatedEmployee = { ...employee, ...updates };
    await kv.set(`employee:${employeeId}`, updatedEmployee);

    // Update in office employees list
    const employees = await kv.get(`office:${employee.officeId}:employees`) || [];
    const updatedEmployees = employees.map((e: any) => 
      e.id === employeeId ? updatedEmployee : e
    );
    await kv.set(`office:${employee.officeId}:employees`, updatedEmployees);

    return c.json({ employee: updatedEmployee, employees: updatedEmployees });
  } catch (error: any) {
    console.log("Update employee error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ CLOCK IN/OUT ROUTES ============

// Clock in
app.post("/make-server-a9845035/clock/in", requireAuth, async (c) => {
  try {
    const { employeeId, officeId } = await c.req.json();
    
    const clockEntry = {
      id: crypto.randomUUID(),
      employeeId,
      officeId,
      clockIn: new Date().toISOString(),
      clockOut: null,
      hoursWorked: 0,
      wagesEarned: 0
    };

    const clockHistory = await kv.get(`office:${officeId}:clock-history`) || [];
    clockHistory.push(clockEntry);
    await kv.set(`office:${officeId}:clock-history`, clockHistory);
    await kv.set(`employee:${employeeId}:active-clock`, clockEntry);

    return c.json({ clockEntry });
  } catch (error: any) {
    console.log("Clock in error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Clock out
app.post("/make-server-a9845035/clock/out", requireAuth, async (c) => {
  try {
    const { employeeId, officeId } = await c.req.json();
    
    const activeClock = await kv.get(`employee:${employeeId}:active-clock`);
    if (!activeClock) {
      return c.json({ error: "No active clock-in found" }, 400);
    }

    const employee = await kv.get(`employee:${employeeId}`);
    const clockOut = new Date();
    const clockIn = new Date(activeClock.clockIn);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    const wagesEarned = hoursWorked * (employee?.payRate || 0);

    const updatedEntry = {
      ...activeClock,
      clockOut: clockOut.toISOString(),
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      wagesEarned: parseFloat(wagesEarned.toFixed(2))
    };

    const clockHistory = await kv.get(`office:${officeId}:clock-history`) || [];
    const updatedHistory = clockHistory.map((entry: any) =>
      entry.id === activeClock.id ? updatedEntry : entry
    );
    await kv.set(`office:${officeId}:clock-history`, updatedHistory);
    await kv.del(`employee:${employeeId}:active-clock`);

    return c.json({ clockEntry: updatedEntry });
  } catch (error: any) {
    console.log("Clock out error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get clock status
app.get("/make-server-a9845035/clock/status/:employeeId", requireAuth, async (c) => {
  try {
    const employeeId = c.req.param("employeeId");
    const activeClock = await kv.get(`employee:${employeeId}:active-clock`);
    
    return c.json({ activeClock: activeClock || null });
  } catch (error: any) {
    console.log("Get clock status error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get clock history
app.get("/make-server-a9845035/clock/history/:officeId", requireAuth, async (c) => {
  try {
    const officeId = c.req.param("officeId");
    const clockHistory = await kv.get(`office:${officeId}:clock-history`) || [];
    
    return c.json({ clockHistory });
  } catch (error: any) {
    console.log("Get clock history error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ============ DATA ROUTES (Shifts, Tasks, etc.) ============

// Generic data endpoints
app.post("/make-server-a9845035/data/:officeId/:type", requireAuth, async (c) => {
  try {
    const officeId = c.req.param("officeId");
    const type = c.req.param("type");
    const data = await c.req.json();

    const key = `office:${officeId}:${type}`;
    const existing = await kv.get(key) || [];
    existing.push(data);
    await kv.set(key, existing);

    return c.json({ success: true, data: existing });
  } catch (error: any) {
    console.log("Create data error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-a9845035/data/:officeId/:type", requireAuth, async (c) => {
  try {
    const officeId = c.req.param("officeId");
    const type = c.req.param("type");

    const key = `office:${officeId}:${type}`;
    const data = await kv.get(key) || [];

    return c.json({ data });
  } catch (error: any) {
    console.log("Get data error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-a9845035/data/:officeId/:type", requireAuth, async (c) => {
  try {
    const officeId = c.req.param("officeId");
    const type = c.req.param("type");
    const newData = await c.req.json();

    const key = `office:${officeId}:${type}`;
    await kv.set(key, newData);

    return c.json({ success: true, data: newData });
  } catch (error: any) {
    console.log("Update data error:", error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);