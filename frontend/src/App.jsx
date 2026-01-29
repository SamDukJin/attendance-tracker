import React, { useState } from 'react';
import './App.css';
import ClockInOut from './components/ClockInOut';
import EmployeeManagement from './components/EmployeeManagement';
import AttendanceHistory from './components/AttendanceHistory';
import LocationManagement from './components/LocationManagement';

function App() {
  const [currentView, setCurrentView] = useState('clock');

  const renderView = () => {
    switch (currentView) {
      case 'clock':
        return <ClockInOut />;
      case 'employees':
        return <EmployeeManagement />;
      case 'history':
        return <AttendanceHistory />;
      case 'locations':
        return <LocationManagement />;
      default:
        return <ClockInOut />;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">Attendance Tracker</div>
          <nav className="nav">
            <button
              className={`nav-button ${currentView === 'clock' ? 'active' : ''}`}
              onClick={() => setCurrentView('clock')}
            >
              Clock In/Out
            </button>
            <button
              className={`nav-button ${currentView === 'employees' ? 'active' : ''}`}
              onClick={() => setCurrentView('employees')}
            >
              Employees
            </button>
            <button
              className={`nav-button ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentView('history')}
            >
              History
            </button>
            <button
              className={`nav-button ${currentView === 'locations' ? 'active' : ''}`}
              onClick={() => setCurrentView('locations')}
            >
              Locations
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
