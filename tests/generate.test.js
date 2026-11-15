import { afterEach, describe, expect, it, vi } from "vitest";
import { generateStudySet } from "../server/generate.js";
import { SAMPLE_SET } from "../src/lib/study.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function providerResponse(text, status = 200) {
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: text === null ? [] : [{ text }] } }],
  }), { status });
}

describe("generateStudySet", () => {
  it("reports missing server credentials without calling the provider", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateStudySet("Photosynthesis")).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining("GEMINI_API_KEY"),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parses and validates the provider's JSON response", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(providerResponse(JSON.stringify(SAMPLE_SET))));

    await expect(generateStudySet("Sleep notes")).resolves.toEqual(SAMPLE_SET);
  });

  it("rejects malformed or empty model responses explicitly", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(providerResponse("not JSON")));
    await expect(generateStudySet("Sleep notes")).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("unreadable"),
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(providerResponse(null)));
    await expect(generateStudySet("Sleep notes")).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("empty response"),
    });
  });

  it("rejects valid JSON that does not match the study-set shape", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(providerResponse(JSON.stringify({ title: "Incomplete" }))));

    await expect(generateStudySet("Sleep notes")).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("study format"),
    });
  });
});
