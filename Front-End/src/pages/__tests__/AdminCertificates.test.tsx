import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminCertificates from "../AdminCertificates";
import { adminAPI } from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  adminAPI: {
    getAllCertificates: vi.fn(),
  },
}));

// Mock Layout component
vi.mock("../../components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

// Mock certificates data
const mockCertificatesData = {
  data: {
    certificates: [
      {
        _id: "cert-1",
        certificateNumber: "MC-2024-001",
        userName: "John Doe",
        userEmail: "john@example.com",
        courseTitle: "Medical Interpreter Training",
        finalExamScore: 95,
        completionDate: "2024-01-15T00:00:00Z",
        issuedAt: "2024-01-15T10:00:00Z",
      },
      {
        _id: "cert-2",
        certificateNumber: "MC-2024-002",
        userName: "Jane Smith",
        userEmail: "jane@example.com",
        courseTitle: "Medical Interpreter Training",
        finalExamScore: 88,
        completionDate: "2024-01-10T00:00:00Z",
        issuedAt: "2024-01-10T10:00:00Z",
      },
      {
        _id: "cert-3",
        certificateNumber: "MC-2024-003",
        userName: "Bob Johnson",
        userEmail: "bob@example.com",
        courseTitle: "Medical Interpreter Training",
        finalExamScore: 92,
        completionDate: "2024-02-01T00:00:00Z",
        issuedAt: "2024-02-01T10:00:00Z",
      },
    ],
  },
};

// Helper to render with router
const renderAdminCertificates = () => {
  return render(
    <MemoryRouter>
      <AdminCertificates />
    </MemoryRouter>
  );
};

describe("AdminCertificates Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    vi.mocked(adminAPI.getAllCertificates).mockResolvedValue(mockCertificatesData as any);
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching certificates", () => {
      vi.mocked(adminAPI.getAllCertificates).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderAdminCertificates();

      expect(screen.getByText(/loading certificates/i)).toBeInTheDocument();
    });
  });

  describe("Header and Stats", () => {
    it("should render page header", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("Certificates")).toBeInTheDocument();
      });

      expect(screen.getByText(/view and manage all issued certificates/i)).toBeInTheDocument();
    });

    it("should display total certificates count", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });

      expect(screen.getByText(/total certificates/i)).toBeInTheDocument();
    });

    it("should display certificates issued this month", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText(/issued this month/i)).toBeInTheDocument();
      });
    });

    it("should display average score", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        // Average of 95, 88, 92 = 92 (rounded)
        expect(screen.getByText("92%")).toBeInTheDocument();
      });

      expect(screen.getByText(/average score/i)).toBeInTheDocument();
    });

    it("should display high achievers count", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText(/high achievers/i)).toBeInTheDocument();
      });

      // "2" appears in multiple stats cards
      const twos = screen.getAllByText("2");
      expect(twos.length).toBeGreaterThan(0);
    });
  });

  describe("Certificates List", () => {
    it("should render all certificates", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });

    it("should display certificate details", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });

      expect(screen.getByText("MC-2024-001")).toBeInTheDocument();
      expect(screen.getByText("95%")).toBeInTheDocument();
    });

    it("should display high achiever badge for scores >= 90", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        const badges = screen.getAllByText(/high achiever/i);
        // 2 badges (John, Bob) + 1 stats label = 3 total
        expect(badges.length).toBe(3);
      });
    });

    it("should display formatted dates", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        const dates = screen.getAllByText(/january 15, 2024/i);
        expect(dates.length).toBeGreaterThan(0);
      });
    });

    it("should show course title", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        const courseTitles = screen.getAllByText(/medical interpreter training/i);
        expect(courseTitles.length).toBe(3);
      });
    });
  });

  describe("Search Functionality", () => {
    it("should filter certificates by name", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name, email, or number/i);
      await user.type(searchInput, "Jane");

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      expect(screen.queryByText("Bob Johnson")).not.toBeInTheDocument();
    });

    it("should filter certificates by email", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name, email, or number/i);
      await user.type(searchInput, "bob@example.com");

      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });

    it("should filter certificates by certificate number", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name, email, or number/i);
      await user.type(searchInput, "MC-2024-002");

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });

    it("should show no results message when search has no matches", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name, email, or number/i);
      await user.type(searchInput, "nonexistent");

      expect(screen.getByText(/no certificates found matching your search/i)).toBeInTheDocument();
    });

    it("should be case insensitive", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name, email, or number/i);
      await user.type(searchInput, "JOHN");

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  describe("Sort Functionality", () => {
    it("should sort by newest first by default", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const certificates = screen.getAllByRole("heading", { level: 3 });
      // Bob (Feb 1) > John (Jan 15) > Jane (Jan 10)
      expect(certificates[0]).toHaveTextContent("Bob Johnson");
      expect(certificates[1]).toHaveTextContent("John Doe");
      expect(certificates[2]).toHaveTextContent("Jane Smith");
    });

    it("should sort by oldest first", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const sortSelect = screen.getByRole("combobox");
      await user.selectOptions(sortSelect, "oldest");

      const certificates = screen.getAllByRole("heading", { level: 3 });
      // Jane (Jan 10) > John (Jan 15) > Bob (Feb 1)
      expect(certificates[0]).toHaveTextContent("Jane Smith");
      expect(certificates[1]).toHaveTextContent("John Doe");
      expect(certificates[2]).toHaveTextContent("Bob Johnson");
    });

    it("should sort by highest score", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const sortSelect = screen.getByRole("combobox");
      await user.selectOptions(sortSelect, "score");

      const certificates = screen.getAllByRole("heading", { level: 3 });
      // John (95) > Bob (92) > Jane (88)
      expect(certificates[0]).toHaveTextContent("John Doe");
      expect(certificates[1]).toHaveTextContent("Bob Johnson");
      expect(certificates[2]).toHaveTextContent("Jane Smith");
    });
  });

  describe("Certificate Verification", () => {
    it("should open verification page when verify button clicked", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const verifyButtons = screen.getAllByRole("button", { name: /verify/i });
      await user.click(verifyButtons[0]);

      expect(mockWindowOpen).toHaveBeenCalledWith(expect.stringContaining("/verify-certificate?code=MC-2024-"), "_blank");
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no certificates", async () => {
      vi.mocked(adminAPI.getAllCertificates).mockResolvedValue({
        data: { certificates: [] },
      } as any);

      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText(/no certificates issued yet/i)).toBeInTheDocument();
      });
    });

    it("should show 0 for all stats when no certificates", async () => {
      vi.mocked(adminAPI.getAllCertificates).mockResolvedValue({
        data: { certificates: [] },
      } as any);

      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText(/total certificates/i)).toBeInTheDocument();
      });

      // Should show zeros in stats
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  describe("Results Summary", () => {
    it("should show results summary", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText(/showing 3 of 3 certificates/i)).toBeInTheDocument();
      });
    });

    it("should update summary when filtered", async () => {
      const user = userEvent.setup();
      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name, email, or number/i);
      await user.type(searchInput, "Jane");

      expect(screen.getByText(/showing 1 of 3 certificates/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle API error gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(adminAPI.getAllCertificates).mockRejectedValue(new Error("API Error"));

      renderAdminCertificates();

      await waitFor(() => {
        expect(screen.getByText(/no certificates issued yet/i)).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching certificates:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("API Call", () => {
    it("should call getAllCertificates on mount", async () => {
      renderAdminCertificates();

      await waitFor(() => {
        expect(adminAPI.getAllCertificates).toHaveBeenCalled();
      });
    });
  });
});
