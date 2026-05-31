// src/components/admin/__tests__/BulkActionConfirmModal.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BulkActionConfirmModal from "../BulkActionConfirmModal";

describe("BulkActionConfirmModal", () => {
  const mockProducts = [
    { id: "1", title: "Product One", price: 99.99, currency: "EUR", status: "available", image: "https://example.com/p1.jpg" },
    { id: "2", title: "Product Two", price: 49.99, currency: "USD", status: "reserved", image: "" },
  ];

  const defaultProps = {
    action: "delete",
    products: mockProducts,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null if action is missing or products list is empty", () => {
    const { container: container1 } = render(
      <BulkActionConfirmModal {...defaultProps} action="" />
    );
    expect(container1.firstChild).toBeNull();

    const { container: container2 } = render(
      <BulkActionConfirmModal {...defaultProps} products={[]} />
    );
    expect(container2.firstChild).toBeNull();
  });

  it("should render correct details for destructive actions (e.g., Delete)", () => {
    render(<BulkActionConfirmModal {...defaultProps} action="delete" />);

    // Header validation
    expect(screen.getByText("Delete 2 products?")).toBeInTheDocument();
    expect(
      screen.getByText("These 2 products will be permanently deleted. This cannot be undone.")
    ).toBeInTheDocument();

    // Products list validation
    expect(screen.getByText("Product One")).toBeInTheDocument();
    expect(screen.getByText("EUR99.99 · available")).toBeInTheDocument();
    expect(screen.getByText("Product Two")).toBeInTheDocument();
    expect(screen.getByText("USD49.99 · reserved")).toBeInTheDocument();

    // Confirm button validation
    const confirmBtn = screen.getByRole("button", { name: /Delete/i });
    expect(confirmBtn).toHaveClass("bg-red-500");
  });

  it("should render correct singular details for non-destructive actions (e.g., Show)", () => {
    render(
      <BulkActionConfirmModal
        {...defaultProps}
        action="show"
        products={[mockProducts[0]]}
      />
    );

    expect(screen.getByText("Show 1 product?")).toBeInTheDocument();
    expect(
      screen.getByText('"Product One" will be made visible to the public.')
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Show/i });
    expect(confirmBtn).toHaveClass("bg-blue-500");
  });

  it("should trigger onConfirm when the confirmation button is clicked", () => {
    render(<BulkActionConfirmModal {...defaultProps} />);
    const confirmBtn = screen.getByRole("button", { name: /Delete/i });
    fireEvent.click(confirmBtn);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should trigger onCancel when the cancel button or backdrop is clicked", () => {
    const { container } = render(<BulkActionConfirmModal {...defaultProps} />);

    // Click cancel button
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);

    // Click backdrop
    // The backdrop is the first child div inside the root wrapper
    const backdrop = container.querySelector(".absolute.inset-0.bg-black\\/50");
    fireEvent.click(backdrop);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(2);
  });
});
