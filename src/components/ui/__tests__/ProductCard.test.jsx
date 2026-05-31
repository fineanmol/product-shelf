// src/components/ui/__tests__/ProductCard.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductCard from "../ProductCard";

describe("ProductCard", () => {
  const mockProduct = {
    id: "prod-1",
    title: "Sony Headphones",
    description: "Active noise cancelling wireless headphones",
    price: 150.0,
    currency: "EUR",
    status: "available",
    image: "https://example.com/headphones.jpg",
    timestamp: 1780250400000,
    url: "https://amazon.com/dp/123",
    source: "Amazon",
    visible: true,
  };

  const defaultProps = {
    product: mockProduct,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onToggleVisibility: jest.fn(),
    onToggleStatus: jest.fn(),
    canEdit: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render product title, description, and price with correct currency symbol", () => {
    render(<ProductCard {...defaultProps} />);

    expect(screen.getByText("Sony Headphones")).toBeInTheDocument();
    expect(
      screen.getByText("Active noise cancelling wireless headphones")
    ).toBeInTheDocument();
    expect(screen.getByText("€150")).toBeInTheDocument();
  });

  it("should render placeholder image when product has no image", () => {
    const productWithoutImage = { ...mockProduct, image: "" };
    render(<ProductCard {...defaultProps} product={productWithoutImage} />);

    const img = screen.getByRole("img", { name: "Sony Headphones" });
    expect(img).toHaveAttribute("src", "/placeholder.png");
  });

  it("should fallback to placeholder image when image failing to load triggers onError", () => {
    render(<ProductCard {...defaultProps} />);

    const img = screen.getByRole("img", { name: "Sony Headphones" });
    expect(img).toHaveAttribute("src", "https://example.com/headphones.jpg");

    // Trigger error event on image element
    fireEvent.error(img);

    expect(img).toHaveAttribute("src", "/placeholder.png");
  });

  it("should render visit website link when product has a valid HTTP/HTTPS URL", () => {
    render(<ProductCard {...defaultProps} />);

    const link = screen.getByRole("link", { name: "View on Amazon" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://amazon.com/dp/123");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should NOT render visit website link when url is missing or invalid", () => {
    // Missing URL
    const productNoUrl = { ...mockProduct, url: "" };
    const { rerender } = render(
      <ProductCard {...defaultProps} product={productNoUrl} />
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    // Invalid protocol/URL
    const productInvalidUrl = { ...mockProduct, url: "not-a-link" };
    rerender(<ProductCard {...defaultProps} product={productInvalidUrl} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should show selection checkbox when selectable and toggle onSelect when clicked", () => {
    const onSelectMock = jest.fn();
    const { rerender } = render(
      <ProductCard {...defaultProps} onSelect={onSelectMock} selected={false} />
    );

    // Unselected state - verify the checkbox button exists and doesn't render checked icon
    const checkboxBtn = screen.getByRole("button", { name: "Select product" });
    expect(checkboxBtn).toBeInTheDocument();
    expect(checkboxBtn.querySelector(".text-\\[10px\\]")).not.toBeInTheDocument(); // FaCheck not present

    // Click checkbox
    fireEvent.click(checkboxBtn);
    expect(onSelectMock).toHaveBeenCalledWith("prod-1");

    // Selected state - render with selected=true
    rerender(
      <ProductCard {...defaultProps} onSelect={onSelectMock} selected={true} />
    );
    const checkedBtn = screen.getByRole("button", { name: "Select product" });
    expect(checkedBtn.querySelector("svg")).toBeInTheDocument();
    
    // Simple verification that selection ring class is applied on root card
    const card = screen.getByText("Sony Headphones").closest(".glass-card");
    expect(card).toHaveClass("ring-2");
    expect(card).toHaveClass("ring-brand-sky");
  });
});
