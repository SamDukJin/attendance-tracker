import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'employee'

  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    setIsLoading(true);
    const result = await ApiService.getAllAttendance(100);
    if (result.success) {
      setRecords(result.data);
    }
    setIsLoading(false);
  };

  const loadEmployeeRecords = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    const result = await ApiService.getAttendanceHistory(employeeId, 50);
    if (result.success) {
      setRecords(result.data);
    }
    setIsLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (viewMode === 'employee') {
      loadEmployeeRecords();
    } else {
      loadAllRecords();
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateDuration = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Attendance History</h2>
        <p className="card-subtitle">View and verify attendance records</p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">View Mode</label>
            <select
              className="form-select"
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                if (e.target.value === 'all') {
                  loadAllRecords();
                }
              }}
            >
              <option value="all">All Employees</option>
              <option value="employee">Specific Employee</option>
            </select>
          </div>

          {viewMode === 'employee' && (
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Employee ID</label>
              <input
                type="text"
                className="form-input"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter employee ID"
              />
            </div>
          )}

          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="loading">Loading records...</div>
      ) : records.length === 0 ? (
        <div className="empty-state">No attendance records found</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Session</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Duration</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.employee_id}</td>
                  <td style={{ textTransform: 'capitalize' }}>{record.session_type}</td>
                  <td>{formatDateTime(record.clock_in_time)}</td>
                  <td>{formatDateTime(record.clock_out_time)}</td>
                  <td>{calculateDuration(record.clock_in_time, record.clock_out_time)}</td>
                  <td>{new Date(record.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
