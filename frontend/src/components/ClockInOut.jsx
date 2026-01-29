import React, { useState, useRef, useEffect } from 'react';
import ApiService from '../services/ApiService';
import FaceRecognitionService from '../services/FaceRecognitionService';
import LocationService from '../services/LocationService';

const ClockInOut = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [sessionType, setSessionType] = useState('morning');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Load face recognition models
    FaceRecognitionService.loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (employeeId) {
      loadEmployeeStatus();
    }
  }, [employeeId]);

  const loadEmployeeStatus = async () => {
    const result = await ApiService.getAttendanceStatus(employeeId);
    if (result.success) {
      setCurrentStatus(result.data);
    }
  };

  const startCamera = async () => {
    try {
      // Set camera active first so video element renders
      setIsCameraActive(true);
      
      // Small delay to ensure video element is mounted
      setTimeout(async () => {
        try {
          const stream = await FaceRecognitionService.startCamera(videoRef.current);
          streamRef.current = stream;
          detectFace();
        } catch (error) {
          setMessage({ type: 'error', text: 'Failed to access camera: ' + error.message });
          setIsCameraActive(false);
        }
      }, 100);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start camera: ' + error.message });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      FaceRecognitionService.stopCamera(streamRef.current);
      streamRef.current = null;
      setIsCameraActive(false);
      setFaceDetected(false);
    }
  };

  const detectFace = async () => {
    if (!videoRef.current || !isCameraActive) return;

    const detection = await FaceRecognitionService.detectFace(videoRef.current);
    setFaceDetected(!!detection);

    // Continue detecting
    if (isCameraActive) {
      setTimeout(detectFace, 100);
    }
  };

  const handleClockIn = async () => {
    if (!employeeId || !sessionType) {
      setMessage({ type: 'error', text: 'Please enter employee ID and select session' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Get location
      const location = await LocationService.getCurrentPosition();

      // Get face descriptor
      let faceDescriptor = null;
      if (isCameraActive && videoRef.current) {
        faceDescriptor = await FaceRecognitionService.getFaceDescriptor(videoRef.current);
        if (!faceDescriptor) {
          setMessage({ type: 'error', text: 'No face detected. Please ensure your face is visible.' });
          setIsLoading(false);
          return;
        }
      }

      // Clock in
      const result = await ApiService.clockIn({
        employee_id: employeeId,
        session_type: sessionType,
        latitude: location.latitude,
        longitude: location.longitude,
        face_descriptor: faceDescriptor,
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.data.message });
        loadEmployeeStatus();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!employeeId || !sessionType) {
      setMessage({ type: 'error', text: 'Please enter employee ID and select session' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Get location
      const location = await LocationService.getCurrentPosition();

      // Clock out
      const result = await ApiService.clockOut({
        employee_id: employeeId,
        session_type: sessionType,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.data.message });
        loadEmployeeStatus();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const isSessionClockedIn = () => {
    if (!currentStatus || !currentStatus.sessions) return false;
    return currentStatus.sessions[sessionType]?.clocked_in && !currentStatus.sessions[sessionType]?.clocked_out;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Clock In/Out</h2>
        <p className="card-subtitle">Use facial recognition and GPS to track attendance</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Employee ID</label>
        <input
          type="text"
          className="form-input"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="Enter your employee ID"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Session</label>
        <select
          className="form-select"
          value={sessionType}
          onChange={(e) => setSessionType(e.target.value)}
        >
          <option value="morning">Morning</option>
          <option value="lunch">Lunch</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>

      <div className="video-container">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              className="video-feed"
              autoPlay
              muted
              playsInline
            />
            {faceDetected && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(16, 185, 129, 0.9)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Face Detected ✓
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <p>Camera not active</p>
            <button
              className="button"
              onClick={startCamera}
              style={{ marginTop: '1rem' }}
            >
              Start Camera
            </button>
          </div>
        )}
      </div>

      {isCameraActive && (
        <button
          className="button button-secondary"
          onClick={stopCamera}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          Stop Camera
        </button>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          className="button button-success"
          onClick={handleClockIn}
          disabled={isLoading || isSessionClockedIn()}
          style={{ flex: 1 }}
        >
          {isLoading ? 'Processing...' : 'Clock In'}
        </button>
        <button
          className="button button-error"
          onClick={handleClockOut}
          disabled={isLoading || !isSessionClockedIn()}
          style={{ flex: 1 }}
        >
          {isLoading ? 'Processing...' : 'Clock Out'}
        </button>
      </div>

      {currentStatus && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Today's Status
          </h3>
          <div className="session-grid">
            {Object.entries(currentStatus.sessions).map(([session, status]) => (
              <div key={session} className="session-card">
                <div className="session-name">{session}</div>
                <div className="session-status">
                  <span className={`status-badge ${
                    status.clocked_out ? 'status-clocked-out' :
                    status.clocked_in ? 'status-clocked-in' :
                    'status-pending'
                  }`}>
                    {status.clocked_out ? 'Completed' :
                     status.clocked_in ? 'In Progress' :
                     'Not Started'}
                  </span>
                </div>
                {status.clock_in_time && (
                  <div className="session-time">
                    In: {new Date(status.clock_in_time).toLocaleTimeString()}
                  </div>
                )}
                {status.clock_out_time && (
                  <div className="session-time">
                    Out: {new Date(status.clock_out_time).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClockInOut;
