import { beforeEach, describe, expect, it } from "vitest";
import { getSnapshot, resetForTests, selectUser } from "@/lib/db";
import {
  DEMO_RESET_TOKEN,
  changePassword,
  getCurrentUser,
  login,
  logout,
  register,
  resetPassword,
  verifyPassword,
} from "@/services/auth.service";
import type { RegisterInput } from "@/types/user";

const input: RegisterInput = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "Ada@Example.com",
  phone: "07700 900123",
  password: "Analytical1",
  accountType: "landlord",
};

beforeEach(() => resetForTests());

describe("register", () => {
  it("creates an account and signs it in", async () => {
    const result = await register(input);
    expect(result.ok).toBe(true);

    const user = await getCurrentUser();
    expect(user?.email).toBe("ada@example.com");
    expect(user?.accountType).toBe("landlord");
  });

  it("never stores the password in plain text", async () => {
    await register(input);
    const user = selectUser(getSnapshot());
    expect(user?.passwordDigest).toBeDefined();
    expect(user?.passwordDigest).not.toContain("Analytical1");
  });

  it("rejects a duplicate email regardless of case", async () => {
    await register(input);
    const second = await register({ ...input, email: "ADA@example.com" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.field).toBe("email");
  });

  it("carries a guest shortlist into the new account", async () => {
    resetForTests({ saved: { guest: ["didsbury-semi"] } });
    await register(input);
    expect(getSnapshot().saved["ada@example.com"]).toEqual(["didsbury-semi"]);
  });
});

describe("login and logout", () => {
  beforeEach(async () => {
    await register(input);
    await logout();
  });

  it("signs in with the right password", async () => {
    const result = await login({
      email: "ada@example.com",
      password: "Analytical1",
      remember: true,
    });
    expect(result.ok).toBe(true);
    expect((await getCurrentUser())?.email).toBe("ada@example.com");
  });

  it("is case-insensitive about the email", async () => {
    const result = await login({
      email: "  ADA@EXAMPLE.COM ",
      password: "Analytical1",
      remember: false,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const result = await login({
      email: "ada@example.com",
      password: "wrong",
      remember: true,
    });
    expect(result.ok).toBe(false);
    expect(await getCurrentUser()).toBeNull();
  });

  it("gives the same message for an unknown email as a wrong password", async () => {
    const unknown = await login({
      email: "nobody@example.com",
      password: "Analytical1",
      remember: true,
    });
    const wrong = await login({
      email: "ada@example.com",
      password: "nope",
      remember: true,
    });
    expect(unknown.ok).toBe(false);
    expect(wrong.ok).toBe(false);
    if (!unknown.ok && !wrong.ok) expect(unknown.error).toBe(wrong.error);
  });

  it("clears the session on logout", async () => {
    await login({ email: "ada@example.com", password: "Analytical1", remember: true });
    await logout();
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("changePassword", () => {
  beforeEach(async () => {
    await register(input);
  });

  it("changes the password when the current one is right", async () => {
    const result = await changePassword({
      currentPassword: "Analytical1",
      newPassword: "Difference2",
      confirmPassword: "Difference2",
    });
    expect(result.ok).toBe(true);
    expect(await verifyPassword("Difference2")).toBe(true);
    expect(await verifyPassword("Analytical1")).toBe(false);
  });

  it("refuses when the current password is wrong", async () => {
    const result = await changePassword({
      currentPassword: "nope",
      newPassword: "Difference2",
      confirmPassword: "Difference2",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.field).toBe("currentPassword");
  });

  it("refuses when the confirmation doesn't match", async () => {
    const result = await changePassword({
      currentPassword: "Analytical1",
      newPassword: "Difference2",
      confirmPassword: "Different3",
    });
    expect(result.ok).toBe(false);
  });
});

describe("resetPassword", () => {
  beforeEach(async () => {
    await register(input);
    await logout();
  });

  it("refuses a token it cannot verify", async () => {
    const result = await resetPassword("made-up", "ada@example.com", "Difference2");
    expect(result.ok).toBe(false);
  });

  it("sets a new password with the demo token", async () => {
    const result = await resetPassword(
      DEMO_RESET_TOKEN,
      "ada@example.com",
      "Difference2",
    );
    expect(result.ok).toBe(true);

    const signedIn = await login({
      email: "ada@example.com",
      password: "Difference2",
      remember: false,
    });
    expect(signedIn.ok).toBe(true);
  });
});
