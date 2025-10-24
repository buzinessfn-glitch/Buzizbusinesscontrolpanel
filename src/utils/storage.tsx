// Storage abstraction layer with automatic fallback to localStorage
import * as api from './api';

let useLocalStorage = false;
let hasTestedConnection = false;

const testConnection = async () => {
  if (hasTestedConnection) return !useLocalStorage;
  
  try {
    await api.healthCheck();
    useLocalStorage = false;
    hasTestedConnection = true;
    return true;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to localStorage');
    useLocalStorage = true;
    hasTestedConnection = true;
    return false;
  }
};

// Auth operations
export const signup = async (email: string, password: string, name: string) => {
  await testConnection();
  
  if (useLocalStorage) {
    // Simulate signup with localStorage
    const userId = crypto.randomUUID();
    const user = { id: userId, email, name };
    localStorage.setItem(`user:${email}`, JSON.stringify({ user, password }));
    return { user };
  }
  
  try {
    return await api.signup(email, password, name);
  } catch (error) {
    console.error('Signup failed, switching to localStorage');
    useLocalStorage = true;
    return signup(email, password, name);
  }
};

// Office operations
export const createOffice = async (name: string, officeName: string) => {
  await testConnection();
  
  if (useLocalStorage) {
    const officeId = crypto.randomUUID();
    const officeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const employeeId = crypto.randomUUID();
    
    const office = { id: officeId, code: officeCode, creatorId: 'local', name: officeName };
    const employee = {
      id: employeeId,
      userId: 'local',
      officeId: officeId,
      name: name,
      employeeNumber: "00001",
      role: "Owner",
      isCreator: true,
      isHeadManager: true,
      payRate: 0
    };
    
    const roles = [
      { id: crypto.randomUUID(), officeId, name: "Owner", permissions: ["all"], color: "#FFD700" },
      { id: crypto.randomUUID(), officeId, name: "Manager", permissions: ["manage_shifts", "manage_tasks", "view_inventory"], color: "#4169E1" },
      { id: crypto.randomUUID(), officeId, name: "Cashier", permissions: ["view_shifts", "view_tasks"], color: "#32CD32" },
      { id: crypto.randomUUID(), officeId, name: "Technician", permissions: ["view_shifts", "manage_tasks"], color: "#FF4500" }
    ];
    
    localStorage.setItem(`office:${officeId}`, JSON.stringify(office));
    localStorage.setItem(`office:${officeId}:employees`, JSON.stringify([employee]));
    localStorage.setItem(`office:${officeId}:roles`, JSON.stringify(roles));
    localStorage.setItem('buziz:current-office', officeId);
    
    return { office, employee, roles };
  }
  
  try {
    return await api.createOffice(name, officeName);
  } catch (error) {
    console.error('Create office failed, switching to localStorage');
    useLocalStorage = true;
    return createOffice(name, officeName);
  }
};

export const joinOffice = async (officeCode: string, name: string) => {
  await testConnection();
  
  if (useLocalStorage) {
    // Find office by code in localStorage
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('office:') && !key.includes(':')) {
        const office = JSON.parse(localStorage.getItem(key) || '{}');
        if (office.code === officeCode) {
          const employees = JSON.parse(localStorage.getItem(`office:${office.id}:employees`) || '[]');
          const roles = JSON.parse(localStorage.getItem(`office:${office.id}:roles`) || '[]');
          
          const employeeNumber = String(employees.length + 1).padStart(5, "0");
          const newEmployee = {
            id: crypto.randomUUID(),
            userId: 'local',
            officeId: office.id,
            name: name,
            employeeNumber: employeeNumber,
            role: "Cashier",
            isCreator: false,
            isHeadManager: false,
            payRate: 0
          };
          
          employees.push(newEmployee);
          localStorage.setItem(`office:${office.id}:employees`, JSON.stringify(employees));
          return { office, employee: newEmployee, employees, roles };
        }
      }
    }
    throw new Error('Office not found');
  }
  
  try {
    return await api.joinOffice(officeCode, name);
  } catch (error) {
    console.error('Join office failed, switching to localStorage');
    useLocalStorage = true;
    return joinOffice(officeCode, name);
  }
};

export const getUserOffices = async () => {
  await testConnection();
  
  if (useLocalStorage) {
    const currentOfficeId = localStorage.getItem('buziz:current-office');
    if (!currentOfficeId) return { offices: [] };
    
    const office = JSON.parse(localStorage.getItem(`office:${currentOfficeId}`) || 'null');
    if (!office) return { offices: [] };
    
    const employees = JSON.parse(localStorage.getItem(`office:${currentOfficeId}:employees`) || '[]');
    const roles = JSON.parse(localStorage.getItem(`office:${currentOfficeId}:roles`) || '[]');
    
    return {
      offices: [{
        office,
        employee: employees[0],
        employees,
        roles
      }]
    };
  }
  
  try {
    return await api.getUserOffices();
  } catch (error) {
    console.error('Get offices failed, switching to localStorage');
    useLocalStorage = true;
    return getUserOffices();
  }
};

export const updateEmployee = async (employeeId: string, updates: any) => {
  await testConnection();
  
  if (useLocalStorage) {
    const currentOfficeId = localStorage.getItem('buziz:current-office');
    const employees = JSON.parse(localStorage.getItem(`office:${currentOfficeId}:employees`) || '[]');
    const updatedEmployees = employees.map((e: any) => 
      e.id === employeeId ? { ...e, ...updates } : e
    );
    localStorage.setItem(`office:${currentOfficeId}:employees`, JSON.stringify(updatedEmployees));
    return { employees: updatedEmployees };
  }
  
  try {
    return await api.updateEmployee(employeeId, updates);
  } catch (error) {
    console.error('Update employee failed, switching to localStorage');
    useLocalStorage = true;
    return updateEmployee(employeeId, updates);
  }
};

// Clock operations
export const clockIn = async (employeeId: string, officeId: string) => {
  await testConnection();
  
  if (useLocalStorage) {
    const clockEntry = {
      id: crypto.randomUUID(),
      employeeId,
      officeId,
      clockIn: new Date().toISOString(),
      clockOut: null,
      hoursWorked: 0,
      wagesEarned: 0
    };
    
    const history = JSON.parse(localStorage.getItem(`office:${officeId}:clock-history`) || '[]');
    history.push(clockEntry);
    localStorage.setItem(`office:${officeId}:clock-history`, JSON.stringify(history));
    localStorage.setItem(`employee:${employeeId}:active-clock`, JSON.stringify(clockEntry));
    
    return { clockEntry };
  }
  
  try {
    return await api.clockIn(employeeId, officeId);
  } catch (error) {
    console.error('Clock in failed, switching to localStorage');
    useLocalStorage = true;
    return clockIn(employeeId, officeId);
  }
};

export const clockOut = async (employeeId: string, officeId: string) => {
  await testConnection();
  
  if (useLocalStorage) {
    const activeClock = JSON.parse(localStorage.getItem(`employee:${employeeId}:active-clock`) || 'null');
    if (!activeClock) throw new Error('No active clock-in found');
    
    const employees = JSON.parse(localStorage.getItem(`office:${officeId}:employees`) || '[]');
    const employee = employees.find((e: any) => e.id === employeeId);
    
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
    
    const history = JSON.parse(localStorage.getItem(`office:${officeId}:clock-history`) || '[]');
    const updatedHistory = history.map((entry: any) =>
      entry.id === activeClock.id ? updatedEntry : entry
    );
    localStorage.setItem(`office:${officeId}:clock-history`, JSON.stringify(updatedHistory));
    localStorage.removeItem(`employee:${employeeId}:active-clock`);
    
    return { clockEntry: updatedEntry };
  }
  
  try {
    return await api.clockOut(employeeId, officeId);
  } catch (error) {
    console.error('Clock out failed, switching to localStorage');
    useLocalStorage = true;
    return clockOut(employeeId, officeId);
  }
};

export const getClockStatus = async (employeeId: string) => {
  await testConnection();
  
  if (useLocalStorage) {
    const activeClock = JSON.parse(localStorage.getItem(`employee:${employeeId}:active-clock`) || 'null');
    return { activeClock };
  }
  
  try {
    return await api.getClockStatus(employeeId);
  } catch (error) {
    useLocalStorage = true;
    return getClockStatus(employeeId);
  }
};

export const getClockHistory = async (officeId: string) => {
  await testConnection();
  
  if (useLocalStorage) {
    const clockHistory = JSON.parse(localStorage.getItem(`office:${officeId}:clock-history`) || '[]');
    return { clockHistory };
  }
  
  try {
    return await api.getClockHistory(officeId);
  } catch (error) {
    useLocalStorage = true;
    return getClockHistory(officeId);
  }
};

// Data operations
export const getData = async (officeId: string, type: string) => {
  await testConnection();
  
  if (useLocalStorage) {
    const data = JSON.parse(localStorage.getItem(`office:${officeId}:${type}`) || '[]');
    return { data };
  }
  
  try {
    return await api.getData(officeId, type);
  } catch (error) {
    useLocalStorage = true;
    return getData(officeId, type);
  }
};

export const updateData = async (officeId: string, type: string, data: any) => {
  await testConnection();
  
  if (useLocalStorage) {
    localStorage.setItem(`office:${officeId}:${type}`, JSON.stringify(data));
    return { success: true, data };
  }
  
  try {
    return await api.updateData(officeId, type, data);
  } catch (error) {
    useLocalStorage = true;
    return updateData(officeId, type, data);
  }
};

export const isUsingLocalStorage = () => useLocalStorage;
