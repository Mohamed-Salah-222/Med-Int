import { checkPasswordStrength, isPasswordValid, PASSWORD_REQUIREMENTS_MESSAGE } from "../passwordValidation";

describe("isPasswordValid", () => {
  it.each([["Password1"], ["Aa1aaaaa"], ["LongerPassw0rd!"], ["Aa1!@#$%^&*"]])("accepts %s", (pwd) => {
    expect(isPasswordValid(pwd)).toBe(true);
  });

  it.each([
    ["Aa1aaaa", "only 7 characters"],
    ["password1", "no uppercase"],
    ["PASSWORD1", "no lowercase"],
    ["Passwordd", "no digit"],
    ["", "empty"],
  ])("rejects %s (%s)", (pwd) => {
    expect(isPasswordValid(pwd)).toBe(false);
  });

  it("requires exactly 8 characters at the boundary", () => {
    expect(isPasswordValid("Aa1bcdef")).toBe(true); // 8
    expect(isPasswordValid("Aa1bcde")).toBe(false); // 7
  });
});

describe("checkPasswordStrength", () => {
  it("scores an empty password at zero with no colour", () => {
    expect(checkPasswordStrength("")).toEqual({ score: 0, color: "" });
  });

  it("awards one point per satisfied rule", () => {
    //* length + lowercase only
    expect(checkPasswordStrength("aaaaaaaa").score).toBe(2);
    //* length + lowercase + uppercase
    expect(checkPasswordStrength("aaaaaaaA").score).toBe(3);
    //* length + lowercase + uppercase + digit
    expect(checkPasswordStrength("aaaaaaA1").score).toBe(4);
    //* all five, including a symbol
    expect(checkPasswordStrength("aaaaaA1!").score).toBe(5);
  });

  it("returns a colour for every non-zero score", () => {
    for (const pwd of ["a", "aaaaaaaa", "aaaaaaaA", "aaaaaaA1", "aaaaaA1!"]) {
      expect(checkPasswordStrength(pwd).color).not.toBe("");
    }
  });

  it("is advisory only — a low score can still be a valid password", () => {
    //* Exactly meets the rules but scores 4 of 5 (no symbol).
    expect(checkPasswordStrength("Aa1bcdef").score).toBe(4);
    expect(isPasswordValid("Aa1bcdef")).toBe(true);
  });
});

describe("PASSWORD_REQUIREMENTS_MESSAGE", () => {
  it("describes the rule the validator actually enforces", () => {
    expect(PASSWORD_REQUIREMENTS_MESSAGE).toMatch(/8 characters/);
    expect(PASSWORD_REQUIREMENTS_MESSAGE).toMatch(/uppercase/);
    expect(PASSWORD_REQUIREMENTS_MESSAGE).toMatch(/lowercase/);
    expect(PASSWORD_REQUIREMENTS_MESSAGE).toMatch(/number/);
  });
});
