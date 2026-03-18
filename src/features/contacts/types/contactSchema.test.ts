import { describe, expect, it } from "vitest";
import { contactSchema } from "./index";

describe("contactSchema", () => {
  it("aceita espectro político como slug", () => {
    const result = contactSchema.safeParse({
      name: "João da Silva",
      politicalSpectrum: "esquerda",
    });

    expect(result.success).toBe(true);
  });
});

