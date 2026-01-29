import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Employee endpoints
  async createEmployee(employeeData) {
    try {
      const response = await this.client.post('/employees', employeeData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getEmployees() {
    try {
      const response = await this.client.get('/employees');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getEmployee(employeeId) {
    try {
      const response = await this.client.get(`/employees/${employeeId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  // Location endpoints
  async createLocation(locationData) {
    try {
      const response = await this.client.post('/locations', locationData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getLocations() {
    try {
      const response = await this.client.get('/locations');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  // Attendance endpoints
  async clockIn(clockInData) {
    try {
      const response = await this.client.post('/attendance/clock-in', clockInData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async clockOut(clockOutData) {
    try {
      const response = await this.client.post('/attendance/clock-out', clockOutData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getAttendanceHistory(employeeId, limit = 50) {
    try {
      const response = await this.client.get(`/attendance/history/${employeeId}?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getAllAttendance(limit = 100) {
    try {
      const response = await this.client.get(`/attendance/all?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  async getAttendanceStatus(employeeId) {
    try {
      const response = await this.client.get(`/attendance/status/${employeeId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }
}

export default new ApiService();
