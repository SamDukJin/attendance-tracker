import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setIsLoading(true);
    const result = await ApiService.getEmployees();
    if (result.success) {
      setEmployees(result.data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const result = await ApiService.createEmployee(formData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Employee created successfully' });
      setFormData({ employee_id: '', name: '', email: '' });
      setShowForm(false);
      loadEmployees();
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Employee Management</h2>
        <p className="card-subtitle">Manage employee records</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <button
        className="button"
        onClick={() => setShowForm(!showForm)}
        style={{ marginBottom: '1.5rem' }}
      >
        {showForm ? 'Cancel' : 'Add New Employee'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div className="form-group">
            <label className="form-label">Employee ID</label>
            <input
              type="text"
              name="employee_id"
              className="form-input"
              value={formData.employee_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="button">
            Create Employee
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="loading">Loading employees...</div>
      ) : employees.length === 0 ? (
        <div className="empty-state">No employees found</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.employee_id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{new Date(employee.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
