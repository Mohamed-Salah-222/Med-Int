import { getRedirectPathForRole } from "../roleRedirect";

describe("getRedirectPathForRole", () => {
  it.each([
    ["Admin", "/admin"],
    ["SuperVisor", "/admin"],
    ["Student", "/dashboard"],
    ["User", "/course"],
  ])("maps %s to %s", (role, expected) => {
    expect(getRedirectPathForRole(role)).toBe(expected);
  });

  //* The three former copies agreed on every real role and disagreed only here.
  it.each([[undefined], [null], [""], ["InvalidRole"]])("falls back to /course for %o", (role) => {
    expect(getRedirectPathForRole(role as any)).toBe("/course");
  });

  it("never returns an empty path", () => {
    for (const role of ["Admin", "SuperVisor", "Student", "User", undefined, "nonsense"]) {
      expect(getRedirectPathForRole(role as any)).toMatch(/^\//);
    }
  });
});
