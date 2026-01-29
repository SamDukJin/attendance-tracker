import * as faceapi from 'face-api.js';

class FaceRecognitionService {
  constructor() {
    this.modelsLoaded = false;
    this.modelPath = '/models';
  }

  async loadModels() {
    if (this.modelsLoaded) return true;

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath),
      ]);
      this.modelsLoaded = true;
      console.log('Face recognition models loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading face recognition models:', error);
      return false;
    }
  }

  async detectFace(videoElement) {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection;
    } catch (error) {
      console.error('Error detecting face:', error);
      return null;
    }
  }

  async getFaceDescriptor(videoElement) {
    const detection = await this.detectFace(videoElement);
    if (!detection) return null;

    // Convert descriptor to array and then to JSON string
    return JSON.stringify(Array.from(detection.descriptor));
  }

  compareFaces(descriptor1, descriptor2, threshold = 0.6) {
    try {
      const desc1 = typeof descriptor1 === 'string' ? JSON.parse(descriptor1) : descriptor1;
      const desc2 = typeof descriptor2 === 'string' ? JSON.parse(descriptor2) : descriptor2;

      const distance = faceapi.euclideanDistance(desc1, desc2);
      return distance < threshold;
    } catch (error) {
      console.error('Error comparing faces:', error);
      return false;
    }
  }

  async startCamera(videoElement) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      videoElement.srcObject = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }

  stopCamera(stream) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }
}

export default new FaceRecognitionService();
