import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Global mocks for Firebase App, Analytics, Auth, and Database
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({})),
}));

const mockAuth = {
  currentUser: null,
};

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => mockAuth),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb(mockAuth.currentUser);
    return jest.fn(); // Unsubscribe function
  }),
  signInWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn((db, path) => ({ db, path })),
  get: jest.fn(() =>
    Promise.resolve({
      exists: () => false,
      val: () => null,
    })
  ),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
  push: jest.fn((ref, value) => ({ key: "mock-key", ref })),
}));

