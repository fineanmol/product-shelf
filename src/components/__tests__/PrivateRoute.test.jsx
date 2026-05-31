// src/components/__tests__/PrivateRoute.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import PrivateRoute from "../PrivateRoute";

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render checking authentication loader when auth state is unresolved (loading)", () => {
    onAuthStateChanged.mockImplementationOnce((auth, cb) => {
      // Simulate no auth state changes yet (loading)
      return jest.fn();
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <PrivateRoute>
          <div>Protected Area</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Checking authentication...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Area")).not.toBeInTheDocument();
  });

  it("should redirect to /login when user is not authenticated", () => {
    onAuthStateChanged.mockImplementationOnce((auth, cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <div>Protected Area</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Area")).not.toBeInTheDocument();
  });

  it("should render children when user is authenticated", () => {
    onAuthStateChanged.mockImplementationOnce((auth, cb) => {
      cb({ uid: "user-456", email: "user@example.com" });
      return jest.fn();
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <div>Protected Area</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Area")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
