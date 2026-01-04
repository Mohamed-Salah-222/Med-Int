import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import GlossaryTooltip from "../GlossaryTooltip";
import { glossaryAPI } from "../../services/api";
import type { AxiosResponse } from "axios";

// Mock the API
vi.mock("../../services/api", () => ({
  glossaryAPI: {
    getTerm: vi.fn(),
  },
}));

// Helper function to create mock Axios response
const createMockAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {
    headers: {} as any,
  },
});

describe("GlossaryTooltip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing initially", () => {
    const { container } = render(<GlossaryTooltip />);
    expect(container.firstChild).toBeNull();
  });

  it("should not show tooltip when selecting non-highlighted text", async () => {
    render(
      <div>
        <GlossaryTooltip />
        <p>Regular text without highlighting</p>
      </div>
    );

    const textElement = screen.getByText("Regular text without highlighting");
    const range = document.createRange();
    range.selectNodeContents(textElement);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    await waitFor(() => {
      expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();
    });
  });

  it("should show tooltip when selecting highlighted text", async () => {
    const mockResponse = createMockAxiosResponse({
      term: "HIPAA",
      explanation: "Health Insurance Portability and Accountability Act",
    });
    vi.mocked(glossaryAPI.getTerm).mockResolvedValue(mockResponse);

    render(
      <div>
        <GlossaryTooltip />
        <p>
          This is about{" "}
          <span className="highlight" data-term="HIPAA">
            HIPAA
          </span>{" "}
          regulations
        </p>
      </div>
    );

    const highlightedText = screen.getByText("HIPAA");
    const range = document.createRange();
    range.selectNodeContents(highlightedText);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    // Check for the explanation text (unique to tooltip)
    await waitFor(() => {
      expect(screen.getByText("Health Insurance Portability and Accountability Act")).toBeInTheDocument();
    });

    expect(glossaryAPI.getTerm).toHaveBeenCalledWith("HIPAA");
  });

  it("should show tooltip for highlight-critical class", async () => {
    const mockResponse = createMockAxiosResponse({
      term: "PHI",
      explanation: "Protected Health Information",
    });
    vi.mocked(glossaryAPI.getTerm).mockResolvedValue(mockResponse);

    render(
      <div>
        <GlossaryTooltip />
        <p>
          This contains{" "}
          <span className="highlight-critical" data-term="PHI">
            PHI
          </span>
        </p>
      </div>
    );

    const highlightedText = screen.getByText("PHI");
    const range = document.createRange();
    range.selectNodeContents(highlightedText);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByText("Protected Health Information")).toBeInTheDocument();
    });
  });

  it("should hide tooltip when API call fails", async () => {
    vi.mocked(glossaryAPI.getTerm).mockRejectedValue(new Error("Term not found"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <div>
        <GlossaryTooltip />
        <p>
          <span className="highlight" data-term="unknown">
            unknown term
          </span>
        </p>
      </div>
    );

    const highlightedText = screen.getByText("unknown term");
    const range = document.createRange();
    range.selectNodeContents(highlightedText);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Term not found:", expect.any(Error));
    });

    expect(screen.queryByText("unknown term")).toBeInTheDocument();
    expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("should close tooltip on scroll", async () => {
    const mockResponse = createMockAxiosResponse({
      term: "MRI",
      explanation: "Magnetic Resonance Imaging",
    });
    vi.mocked(glossaryAPI.getTerm).mockResolvedValue(mockResponse);

    render(
      <div>
        <GlossaryTooltip />
        <p>
          <span className="highlight" data-term="MRI">
            MRI
          </span>
        </p>
      </div>
    );

    const highlightedText = screen.getByText("MRI");
    const range = document.createRange();
    range.selectNodeContents(highlightedText);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByText("Magnetic Resonance Imaging")).toBeInTheDocument();
    });

    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(screen.queryByText("Magnetic Resonance Imaging")).not.toBeInTheDocument();
    });
  });

  it("should close tooltip when clicking outside highlighted area", async () => {
    const mockResponse = createMockAxiosResponse({
      term: "CT",
      explanation: "Computed Tomography",
    });
    vi.mocked(glossaryAPI.getTerm).mockResolvedValue(mockResponse);

    render(
      <div>
        <GlossaryTooltip />
        <p>
          <span className="highlight" data-term="CT">
            CT
          </span>
        </p>
        <div data-testid="outside">Click outside</div>
      </div>
    );

    const highlightedText = screen.getByText("CT");
    const range = document.createRange();
    range.selectNodeContents(highlightedText);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByText("Computed Tomography")).toBeInTheDocument();
    });

    const outsideElement = screen.getByTestId("outside");
    document.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        target: outsideElement,
      } as any)
    );

    await waitFor(() => {
      expect(screen.queryByText("Computed Tomography")).not.toBeInTheDocument();
    });
  });

  it("should not show tooltip when selecting empty text", async () => {
    render(
      <div>
        <GlossaryTooltip />
        <p>
          <span className="highlight" data-term="test">
            test
          </span>
        </p>
      </div>
    );

    window.getSelection()?.removeAllRanges();

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    await waitFor(() => {
      expect(glossaryAPI.getTerm).not.toHaveBeenCalled();
    });
  });

  it("should prevent multiple simultaneous API calls", async () => {
    const mockResponse = createMockAxiosResponse({
      term: "test",
      explanation: "Test explanation",
    });

    vi.mocked(glossaryAPI.getTerm).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100)));

    render(
      <div>
        <GlossaryTooltip />
        <p>
          <span className="highlight" data-term="test">
            test
          </span>
        </p>
      </div>
    );

    const highlightedText = screen.getByText("test");
    const range = document.createRange();
    range.selectNodeContents(highlightedText);
    const selection = window.getSelection();

    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByText("Test explanation")).toBeInTheDocument();
    });

    expect(glossaryAPI.getTerm).toHaveBeenCalledTimes(1);
  });

  it("should position tooltip correctly", async () => {
    const mockResponse = createMockAxiosResponse({
      term: "position",
      explanation: "Position test",
    });
    vi.mocked(glossaryAPI.getTerm).mockResolvedValue(mockResponse);

    const mockRect = {
      left: 100,
      right: 200,
      top: 50,
      bottom: 70,
      width: 100,
      height: 20,
      x: 100,
      y: 50,
      toJSON: () => {},
    };

    Element.prototype.getBoundingClientRect = vi.fn(() => mockRect);

    const { container } = render(
      <div>
        <GlossaryTooltip />
        <p>
          <span className="highlight" data-term="position">
            position
          </span>
        </p>
      </div>
    );

    const highlightedText = screen.getByText("position");
    const range = document.createRange();
    range.selectNodeContents(highlightedText);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    await waitFor(() => {
      const tooltip = container.querySelector(".fixed");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveStyle({
        left: "6px",
        top: "80px",
      });
    });
  });
});
