const API_BASE = 'https://attendance-management-system-mern.onrender.com/api/auth';
const FACE_REGISTER_URL = 'http://localhost:5050/register';

export interface User {
  _id: string;
  email: string;
  regNo: string;
  username?: string;
  role: 'Admin' | 'Faculty' | 'Student';
  proctor?: { _id: string; email: string; regNo: string; username?: string } | string;
  assignedStudents?: {
    _id: string;
    email: string;
    regNo: string;
    username?: string;
  }[] | string[];
  isValid?: boolean;
}


export interface AttendanceRecord {
  _id: string;
  regNo: string; // ✅ primary identifier
  date: string;
  time?: string;
  status: 'present' | 'absent' | 'late';
  studentName?: string;
  email?: string; // optional (safe during transition)
}



export interface LoginResponse {
  status: string;
  token: string;
  user: User;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response, s: string) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  console.log(s, 'API response data:', data);
  return data;
};

// Auth API
export const authApi = {
  // Register - user must already exist in DB (created by admin/faculty)
  register: async (
    email: string,
    password: string,
    regNo: string,
    username?: string
  ) => {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, regNo, username }),
    });

    return handleResponse(res, "Auth API - register");
  },


  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    const trimmed = identifier.trim();
    const body = trimmed.includes('@')
      ? { email: trimmed, password }
      : { regno: trimmed.toUpperCase(), password };


    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return handleResponse(res, "Auth API - login");
  },


  getMe: async (): Promise<User> => {
    const res = await fetch(`${API_BASE}/me`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res, "Auth API - getMe");
    return data.user;
  },

  updateMe: async (updateData: {
    username?: string;
    email?: string;
    password?: string;
    regNo?: string;
  }) => {
    const res = await fetch(`${API_BASE}/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    const data = await handleResponse(res, "Auth API - updateMe");
    return data.user;
  },


  checkFaceprint: async (): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/check-faceprint`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.hasFaceprint === true;
  },

  redirectToFaceRegister: (regNo: string, token: string, email?: string) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = FACE_REGISTER_URL;
    form.target = '_blank';

    const regNoInput = document.createElement('input');
    regNoInput.type = 'hidden';
    regNoInput.name = 'regNo';
    regNoInput.value = regNo.toUpperCase();
    form.appendChild(regNoInput);

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    form.appendChild(tokenInput);

    console.log("Redirecting to face register", { regNo: regNo.toUpperCase(), token, email });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  },
};

// Users API
export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res, "Users API - getUsers");
    return data.users;
  },

  getUserById: async (userId: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res, "Users API - getUserById");
    return data.user;
  },

  addUsers: async (
    users: { email: string; username: string; regNo: string; role: string }[],
    proctorId?: string
  ) => {
    
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ users, proctorId }),
    });

    return handleResponse(res, "Users API - addUsers");
  },


  adminUpdateUser: async (data: {
    userId: string;
    username?: string;
    email?: string;
    role?: string;
    password?: string;
    proctor?: string;
  }) => {
    const res = await fetch(`${API_BASE}/admin/update-user`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Users API - adminUpdateUser");
  },
};

// Attendance API
export const attendanceApi = {
  getMyAttendance: async (): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_BASE}/attendance`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res, "Attendance API - getMyAttendance");
    return data.attendance;
  },

  getFacultyAttendance: async (): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_BASE}/attendance/faculty`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res, "Attendance API - getFacultyAttendance");
    return data.attendance;
  },

  getFullAttendance: async (): Promise<AttendanceRecord[]> => {
    const res = await fetch(`${API_BASE}/attendance/full`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res, "Attendance API - getFullAttendance");
    return data.attendance;
  },
};
