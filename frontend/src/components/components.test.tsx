import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";
import { Price } from "./Price";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Price", () => {
  it("할인 중이면 할인율과 정가를 보여준다", () => {
    render(<Price price={70000} originalPrice={100000} />);
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("70,000원")).toBeInTheDocument();
    expect(screen.getByText("100,000원")).toBeInTheDocument();
  });

  it("할인이 없으면 판매가만", () => {
    render(<Price price={50000} />);
    expect(screen.getByText("50,000원")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).toBeNull();
  });
});

describe("Pagination", () => {
  it("한 페이지면 아무것도 그리지 않는다", () => {
    const { container } = render(<Pagination page={0} totalPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("버튼 방식: 현재 페이지 표시와 이동", async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={10} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "3페이지", current: "page" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "5페이지" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("링크 방식: href를 만든다", () => {
    render(<Pagination page={0} totalPages={3} href={(p) => `/shop/all?page=${p + 1}`} />);
    expect(screen.getByRole("link", { name: "2페이지" })).toHaveAttribute("href", "/shop/all?page=2");
  });
});
