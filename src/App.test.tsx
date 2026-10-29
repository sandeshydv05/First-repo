import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { analyzeResume } from "./services/api";

vi.mock("./services/api", () => ({
  analyzeResume: vi.fn(),
  extractFile: vi.fn(),
}));

afterEach(cleanup);

describe("ResumeAI application flow", () => {
  it("takes a visitor from the landing page to resume input", async () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole("button", { name: /analyze my resume/i })[0]);

    expect(await screen.findByLabelText("Resume content")).toBeTruthy();
    expect(screen.getByText("Your resume, treated with care.")).toBeTruthy();
  });

  it("rejects empty or too-short resume text before calling the API", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: /analyze my resume/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /analyze my resume/i }));

    expect(screen.getByRole("alert").textContent).toContain("at least 30 characters");
    expect(analyzeResume).not.toHaveBeenCalled();
  });
});
