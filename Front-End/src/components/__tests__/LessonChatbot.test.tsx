import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import LessonChatbot from "../LessonChatbot";
import { chatbotAPI } from "../../services/api";
import type { AxiosResponse } from "axios";

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();
// Mock the API
vi.mock("../../services/api", () => ({
  chatbotAPI: {
    getUsage: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

// Helper to create mock Axios response
const createMockAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {
    headers: {} as any,
  },
});

describe("LessonChatbot", () => {
  const mockProps = {
    lessonId: "lesson-123",
    lessonTitle: "Introduction to Medical Terminology",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getUsage
    vi.mocked(chatbotAPI.getUsage).mockResolvedValue(createMockAxiosResponse({ messageCount: 0 }));
  });

  describe("Initial Render - Closed State", () => {
    it("should render floating button when closed", () => {
      render(<LessonChatbot {...mockProps} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("fixed", "right-6", "bottom-6");
    });

    it("should show tooltip on hover", () => {
      render(<LessonChatbot {...mockProps} />);

      expect(screen.getByText("Ask AI Tutor ✨")).toBeInTheDocument();
    });

    it("should open chatbot when button clicked", async () => {
      const user = userEvent.setup();
      render(<LessonChatbot {...mockProps} />);

      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByText("AI Tutor")).toBeInTheDocument();
      });
    });
  });

  describe("Initial Render - Open State", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);
    });

    it("should display welcome message with lesson title", async () => {
      await waitFor(() => {
        expect(screen.getByText(/Hi! I'm your AI tutor for "Introduction to Medical Terminology"/)).toBeInTheDocument();
      });
    });

    it("should display header with AI Tutor title", async () => {
      await waitFor(() => {
        expect(screen.getByText("AI Tutor")).toBeInTheDocument();
        expect(screen.getByText("Always here to help")).toBeInTheDocument();
      });
    });

    it("should display message counter", async () => {
      await waitFor(() => {
        expect(screen.getByText("0/15")).toBeInTheDocument();
      });
    });

    it("should display input field with placeholder", async () => {
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });
    });

    it("should display disclaimer text", async () => {
      await waitFor(() => {
        expect(screen.getByText(/AI responses may not always be accurate/)).toBeInTheDocument();
      });
    });
  });

  describe("Usage Fetching", () => {
    it("should fetch usage count on mount", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.getUsage).mockResolvedValue(createMockAxiosResponse({ messageCount: 5 }));

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(chatbotAPI.getUsage).toHaveBeenCalledWith("lesson-123");
        expect(screen.getByText("5/15")).toBeInTheDocument();
      });
    });

    it("should show loader while fetching usage", async () => {
      const user = userEvent.setup();
      // Make the promise never resolve to keep loading state
      vi.mocked(chatbotAPI.getUsage).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByText("AI Tutor")).toBeInTheDocument();
      });

      // Should show loading spinner (Loader2 component)
      const loaderContainer = screen.getByText("Always here to help").parentElement?.parentElement;
      expect(loaderContainer?.querySelector("svg")).toBeInTheDocument();
    });

    it("should handle usage fetch error gracefully", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(chatbotAPI.getUsage).mockRejectedValue(new Error("Network error"));

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching usage:", expect.any(Error));
      });

      // Should still render the chatbot (default to 0 messages)
      expect(screen.getByText("AI Tutor")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("Sending Messages", () => {
    it("should send message and display response", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.sendMessage).mockResolvedValue(
        createMockAxiosResponse({
          response: "Medical terminology refers to the language used in healthcare.",
          messageCount: 1,
          timestamp: new Date().toISOString(),
        })
      );

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...");
      const sendButton = screen.getByRole("button", { name: /send message/i });

      await user.type(input, "What is medical terminology?");
      await user.click(sendButton);

      // Should show user message
      await waitFor(() => {
        expect(screen.getByText("What is medical terminology?")).toBeInTheDocument();
      });

      // Should show AI response
      await waitFor(() => {
        expect(screen.getByText("Medical terminology refers to the language used in healthcare.")).toBeInTheDocument();
      });

      // Should update message count
      expect(screen.getByText("1/15")).toBeInTheDocument();
    });

    it("should send message on Enter key press", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.sendMessage).mockResolvedValue(
        createMockAxiosResponse({
          response: "Great question!",
          messageCount: 1,
          timestamp: new Date().toISOString(),
        })
      );

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...");
      await user.type(input, "Hello{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Hello")).toBeInTheDocument();
        expect(screen.getByText("Great question!")).toBeInTheDocument();
      });
    });

    it("should NOT send message on Shift+Enter", async () => {
      const user = userEvent.setup();

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...");
      await user.type(input, "Hello");
      await user.keyboard("{Shift>}{Enter}{/Shift}");

      // Should NOT call API
      expect(chatbotAPI.sendMessage).not.toHaveBeenCalled();
    });

    it("should not send empty message", async () => {
      const user = userEvent.setup();

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const sendButton = screen.getByRole("button", { name: /send message/i });
      await user.click(sendButton);

      expect(chatbotAPI.sendMessage).not.toHaveBeenCalled();
    });

    it("should not send whitespace-only message", async () => {
      const user = userEvent.setup();

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...");
      const sendButton = screen.getByRole("button", { name: /send message/i });

      await user.type(input, "   ");
      await user.click(sendButton);

      expect(chatbotAPI.sendMessage).not.toHaveBeenCalled();
    });

    it("should clear input after sending", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.sendMessage).mockResolvedValue(
        createMockAxiosResponse({
          response: "Response",
          messageCount: 1,
          timestamp: new Date().toISOString(),
        })
      );

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...") as HTMLInputElement;
      const sendButton = screen.getByRole("button", { name: /send message/i });

      await user.type(input, "Test message");
      expect(input.value).toBe("Test message");

      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("should show loading state while sending", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.sendMessage).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  createMockAxiosResponse({
                    response: "Response",
                    messageCount: 1,
                    timestamp: new Date().toISOString(),
                  })
                ),
              1000
            )
          )
      );

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...");
      const sendButton = screen.getByRole("button", { name: /send message/i });

      await user.type(input, "Test");
      await user.click(sendButton);

      // Should show "Thinking..." indicator
      await waitFor(() => {
        expect(screen.getByText("Thinking...")).toBeInTheDocument();
      });
    });

    it("should include conversation history in API call", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.sendMessage).mockResolvedValue(
        createMockAxiosResponse({
          response: "Second response",
          messageCount: 2,
          timestamp: new Date().toISOString(),
        })
      );

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...");
      const sendButton = screen.getByRole("button", { name: /send message/i });

      // Send first message
      await user.type(input, "First question");
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText("Second response")).toBeInTheDocument();
      });

      // Send second message
      await user.type(input, "Second question");
      await user.click(sendButton);

      // Check that conversation history was passed
      await waitFor(() => {
        expect(chatbotAPI.sendMessage).toHaveBeenLastCalledWith("lesson-123", "Second question", expect.arrayContaining([expect.objectContaining({ role: "assistant", content: expect.stringContaining("Introduction to Medical Terminology") }), expect.objectContaining({ role: "user", content: "First question" }), expect.objectContaining({ role: "assistant", content: "Second response" })]));
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message on API failure", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(chatbotAPI.sendMessage).mockRejectedValue(new Error("Network error"));

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...");
      const sendButton = screen.getByRole("button", { name: /send message/i });

      await user.type(input, "Test");
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText("Sorry, I encountered an error. Please try again.")).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("should display specific error for 429 (rate limit)", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = {
        response: { status: 429 },
      };
      vi.mocked(chatbotAPI.sendMessage).mockRejectedValue(error);

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...");
      const sendButton = screen.getByRole("button", { name: /send message/i });

      await user.type(input, "Test");
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText("You have reached your 15-message limit for this lesson. 📚")).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("should re-focus input after error", async () => {
      const user = userEvent.setup();
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(chatbotAPI.sendMessage).mockRejectedValue(new Error("Error"));

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Ask me anything...") as HTMLInputElement;
      const sendButton = screen.getByRole("button", { name: /send message/i });

      await user.type(input, "Test");
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText("Sorry, I encountered an error. Please try again.")).toBeInTheDocument();
      });

      // Input should still be enabled and ready for retry
      expect(input).not.toBeDisabled();
      expect(input.value).toBe("");
    });
  });

  describe("Message Limit", () => {
    it("should show warning when limit reached", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.getUsage).mockResolvedValue(createMockAxiosResponse({ messageCount: 15 }));

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByText("⚠️")).toBeInTheDocument();
        expect(screen.getByText("You've reached your 15-message limit for this lesson")).toBeInTheDocument();
      });
    });

    it("should disable input when limit reached", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.getUsage).mockResolvedValue(createMockAxiosResponse({ messageCount: 15 }));

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText("Message limit reached");
        expect(input).toBeDisabled();
      });
    });

    it("should disable send button when limit reached", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.getUsage).mockResolvedValue(createMockAxiosResponse({ messageCount: 15 }));

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        const sendButton = screen.getByRole("button", { name: /send message/i });
        expect(sendButton).toBeDisabled();
      });
    });

    it("should not send message when at limit", async () => {
      const user = userEvent.setup();
      vi.mocked(chatbotAPI.getUsage).mockResolvedValue(createMockAxiosResponse({ messageCount: 15 }));

      render(<LessonChatbot {...mockProps} />);
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByText("15/15")).toBeInTheDocument();
      });

      // Try to send anyway (shouldn't work)
      expect(chatbotAPI.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe("UI Interactions", () => {
    it("should close chatbot when X button clicked", async () => {
      const user = userEvent.setup();
      render(<LessonChatbot {...mockProps} />);

      // Open chatbot
      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByText("AI Tutor")).toBeInTheDocument();
      });

      // Close chatbot using aria-label
      const closeButton = screen.getByRole("button", { name: /close chat/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("AI Tutor")).not.toBeInTheDocument();
      });
    });

    it("should display timestamps for messages", async () => {
      const user = userEvent.setup();
      render(<LessonChatbot {...mockProps} />);

      const openButton = screen.getByRole("button");
      await user.click(openButton);

      await waitFor(() => {
        // Welcome message should have timestamp
        const welcomeMessage = screen.getByText(/Hi! I'm your AI tutor/);
        const messageContainer = welcomeMessage.parentElement;
        const timestamp = messageContainer?.querySelector(".text-\\[10px\\]");
        expect(timestamp).toBeInTheDocument();
      });
    });
  });
});
