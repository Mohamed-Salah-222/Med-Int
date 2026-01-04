import { useState, useEffect, useRef } from "react";
import { glossaryAPI } from "../services/api";

function GlossaryTooltip() {
  const [tooltip, setTooltip] = useState<{
    term: string;
    explanation: string;
    x: number;
    y: number;
  } | null>(null);

  const processingRef = useRef(false);

  useEffect(() => {
    const handleSelection = async () => {
      // Prevent multiple simultaneous calls
      if (processingRef.current) return;

      const selection = window.getSelection();
      let selectedText = selection?.toString();

      // If nothing selected, hide tooltip
      if (!selectedText || selectedText.trim().length === 0) {
        setTooltip(null);
        return;
      }

      // Trim spaces for comparison but keep original for finding element
      const trimmedText = selectedText.trim();

      // Check if the selected text is inside a highlighted span
      const range = selection?.getRangeAt(0);
      if (!range) return;

      const container = range.commonAncestorContainer;
      const parentElement = container.nodeType === 3 ? container.parentElement : (container as HTMLElement);

      // Check if parent or any ancestor has highlight class
      let highlightedElement: HTMLElement | null = null;
      let currentElement: HTMLElement | null = parentElement;

      while (currentElement && currentElement !== document.body) {
        if (currentElement.classList?.contains("highlight") || currentElement.classList?.contains("highlight-critical")) {
          highlightedElement = currentElement;
          break;
        }
        currentElement = currentElement.parentElement;
      }

      // If no highlighted element found directly, check if selection contains a highlighted element
      if (!highlightedElement) {
        // Get all elements within the selection
        const rangeContents = range.cloneContents();
        const spans = rangeContents.querySelectorAll(".highlight, .highlight-critical");

        if (spans.length > 0) {
          // Find the original element in the document
          const firstSpan = spans[0] as HTMLElement;
          const dataTermValue = firstSpan.getAttribute("data-term");

          if (dataTermValue) {
            // Find the actual element in the DOM
            highlightedElement = document.querySelector(`.highlight[data-term="${dataTermValue}"], .highlight-critical[data-term="${dataTermValue}"]`) as HTMLElement;
          }
        }
      }

      // Only show tooltip if text is from a highlighted element
      if (!highlightedElement) {
        setTooltip(null);
        return;
      }

      const term = highlightedElement.getAttribute("data-term");
      if (!term) return;

      // Verify that the trimmed selection matches the element's text (with or without spaces)
      const elementText = highlightedElement.textContent?.trim() || "";
      if (!elementText.toLowerCase().includes(trimmedText.toLowerCase()) && !trimmedText.toLowerCase().includes(elementText.toLowerCase())) {
        setTooltip(null);
        return;
      }

      // Get position of selection - Use element position
      const rect = highlightedElement.getBoundingClientRect();

      processingRef.current = true;

      try {
        const response = await glossaryAPI.getTerm(term);
        setTooltip({
          term: response.data.term,
          explanation: response.data.explanation,
          x: rect.left + rect.width / 2,
          y: rect.bottom,
        });
      } catch (error) {
        console.error("Term not found:", error);
        setTooltip(null);
      } finally {
        processingRef.current = false;
      }
    };

    const handleScroll = () => {
      // Close tooltip on scroll
      setTooltip(null);
      // Clear any text selection
      window.getSelection()?.removeAllRanges();
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Close tooltip when clicking outside
      const target = e.target as HTMLElement;

      // Ensure target is an HTMLElement before using closest
      if (!(target instanceof HTMLElement)) {
        setTooltip(null);
        return;
      }

      if (!target.closest(".highlight") && !target.closest(".highlight-critical")) {
        setTooltip(null);
      }
    };

    // Only listen to mouseup (when selection is complete)
    document.addEventListener("mouseup", handleSelection);
    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!tooltip) return null;

  return (
    <div
      className="fixed z-[9999] w-72 p-4 bg-white rounded-lg shadow-2xl border-2 border-[#E76F51]"
      style={{
        left: `${tooltip.x - 144}px`,
        top: `${tooltip.y + 10}px`,
      }}
    >
      <div className="text-sm font-bold text-[#E76F51] mb-2 capitalize">{tooltip.term}</div>
      <div className="text-sm text-[#2C2C2C] leading-relaxed">{tooltip.explanation}</div>
      {/* Arrow pointing up */}
      <div
        className="absolute w-3 h-3 bg-white border-l-2 border-t-2 border-[#E76F51] transform rotate-45"
        style={{
          top: "-7px",
          left: "50%",
          marginLeft: "-6px",
        }}
      />
    </div>
  );
}

export default GlossaryTooltip;
