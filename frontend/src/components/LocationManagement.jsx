import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    location_name: '',
    latitude: '',
    longitude: '',
    radius_meters: '200',
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setIsLoading(true);
    const result = await ApiService.getLocations();
    if (result.success) {
      setLocations(result.data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const locationData = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      radius_meters: parseFloat(formData.radius_meters),
    };

    const result = await ApiService.createLocation(locationData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Location added successfully' });
      setFormData({ location_name: '', latitude: '', longitude: '', radius_meters: '200' });
      setShowForm(false);
      loadLocations();
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

  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        setMessage({ type: 'success', text: 'Current location captured' });
      },
      (error) => {
        setMessage({ type: 'error', text: 'Failed to get location: ' + error.message });
      }
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Location Management</h2>
        <p className="card-subtitle">Manage authorized locations for attendance</p>
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
        {showForm ? 'Cancel' : 'Add New Location'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div className="form-group">
            <label className="form-label">Location Name</label>
            <input
              type="text"
              name="location_name"
              className="form-input"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="e.g., Main Office"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                className="form-input"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="13.7563"
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                className="form-input"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="100.5018"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Radius (meters)</label>
            <input
              type="number"
              name="radius_meters"
              className="form-input"
              value={formData.radius_meters}
              onChange={handleChange}
              min="1"
              max="1000"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="button button-secondary" onClick={useCurrentLocation}>
              Use Current Location
            </button>
            <button type="submit" className="button">
              Add Location
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="loading">Loading locations...</div>
      ) : locations.length === 0 ? (
        <div className="empty-state">No authorized locations found</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Radius (m)</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td>{location.id}</td>
                  <td>{location.location_name}</td>
                  <td>{location.latitude.toFixed(6)}</td>
                  <td>{location.longitude.toFixed(6)}</td>
                  <td>{location.radius_meters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LocationManagement;
