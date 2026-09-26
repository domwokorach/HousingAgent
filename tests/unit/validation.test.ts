import { describe, expect, it } from "vitest";
import { validate } from "@/validation";
import {
  loginSchema,
  passwordStrength,
  registerSchema,
} from "@/validation/auth.schema";
import { propertyFormSchema } from "@/validation/property.schema";

const validRegistration = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "07700 900123",
  password: "Analytical1",
  confirmPassword: "Analytical1",
  accountType: "tenant" as const,
  acceptedTerms: true,
};

describe("registerSchema", () => {
  it("accepts a complete registration", () => {
    expect(validate(registerSchema, validRegistration).ok).toBe(true);
  });

  it("rejects mismatched passwords against the confirm field", () => {
    const result = validate(registerSchema, {
      ...validRegistration,
      confirmPassword: "Different1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.confirmPassword).toMatch(/match/i);
  });

  it("requires the terms checkbox", () => {
    const result = validate(registerSchema, {
      ...validRegistration,
      acceptedTerms: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.acceptedTerms).toMatch(/Terms/);
  });

  it.each(["not-an-email", "missing@tld", "@example.com"])(
    "rejects the email %s",
    (email) => {
      expect(validate(registerSchema, { ...validRegistration, email }).ok).toBe(false);
    },
  );

  it.each(["07700 900123", "+447700900123", "(020) 7946 0112"])(
    "accepts the phone number %s",
    (phone) => {
      expect(validate(registerSchema, { ...validRegistration, phone }).ok).toBe(true);
    },
  );

  it.each(["12345", "hello", "07700 9001234567"])(
    "rejects the phone number %s",
    (phone) => {
      expect(validate(registerSchema, { ...validRegistration, phone }).ok).toBe(false);
    },
  );

  it("rejects a password with no digit", () => {
    const result = validate(registerSchema, {
      ...validRegistration,
      password: "Analytical",
      confirmPassword: "Analytical",
    });
    expect(result.ok).toBe(false);
  });

  it("trims whitespace from names", () => {
    const result = validate(registerSchema, {
      ...validRegistration,
      firstName: "  Ada  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.firstName).toBe("Ada");
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    const result = validate(loginSchema, {
      email: "ada@example.com",
      password: "",
      remember: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toBeDefined();
  });
});

describe("passwordStrength", () => {
  it("scores an empty password at zero", () => {
    expect(passwordStrength("").score).toBe(0);
  });

  it("scores a long mixed password at full marks", () => {
    const strength = passwordStrength("Analytical1!");
    expect(strength.score).toBe(4);
    expect(strength.label).toBe("Strong");
    expect(strength.missing).toHaveLength(0);
  });

  it("reports what is missing", () => {
    expect(passwordStrength("alllowercase").missing).toContain("a number");
  });
});

describe("propertyFormSchema", () => {
  const validListing = {
    title: "Bright two-bedroom garden flat",
    intent: "rent",
    price: "1450",
    addressLine1: "Flat 2, 19 Alma Road",
    addressLine2: "",
    town: "Battersea, London",
    postcode: "SW11 4PJ",
    type: "flat",
    bedrooms: "2",
    bathrooms: "1",
    sizeSqFt: "720",
    description:
      "A bright ground-floor flat with its own entrance and sole use of a west-facing garden.",
    availableFrom: "2026-11-01",
    furnished: "",
    energyRating: "",
    agentId: "harper-quinn",
  };

  it("accepts a complete listing and coerces the numbers", () => {
    const result = validate(propertyFormSchema, validListing);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.price).toBe(1450);
      expect(result.data.bedrooms).toBe(2);
    }
  });

  it.each(["SW1A 1AA", "sw11 3rx", "M1 4BT", "EH36QG"])(
    "accepts the well-formed postcode %s",
    (postcode) => {
      expect(validate(propertyFormSchema, { ...validListing, postcode }).ok).toBe(true);
    },
  );

  it.each(["SW11", "not a postcode", "12345", ""])(
    "rejects the malformed postcode %s",
    (postcode) => {
      const result = validate(propertyFormSchema, { ...validListing, postcode });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.postcode).toBeDefined();
    },
  );

  it("leaves whether a postcode exists to geocoding, not the schema", () => {
    // ZZ99 9ZZ is well-formed but not a real postcode; the schema passes it
    // and src/services/geocode.service.ts is what rejects it.
    expect(validate(propertyFormSchema, { ...validListing, postcode: "ZZ99 9ZZ" }).ok).toBe(
      true,
    );
  });

  it("rejects a short description", () => {
    const result = validate(propertyFormSchema, { ...validListing, description: "Nice" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.description).toMatch(/40 characters/);
  });

  it("rejects a zero price", () => {
    expect(validate(propertyFormSchema, { ...validListing, price: "0" }).ok).toBe(false);
  });
});
