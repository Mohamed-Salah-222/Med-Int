//* Single source of truth for "where does this user belong after auth?",
//* previously copy-pasted into Login.tsx, AuthCallback.tsx and PublicOnlyRoute.
//*
//* The four real roles (the backend enum in models/User.ts) were mapped
//* identically in all three copies. They disagreed only on the fallback for a
//* role that is missing or unrecognised: Login and AuthCallback sent those
//* users to /dashboard, PublicOnlyRoute sent them to /course.
//*
//* Unified on /course, the more conservative destination: /dashboard is the
//* student view and ProtectedRoute only turns away the exact role "User", so
//* an unrecognised role would otherwise be shown student content we have no
//* evidence it is entitled to. /course works for anyone.
export const getRedirectPathForRole = (role?: string | null): string => {
  switch (role) {
    case "Admin":
    case "SuperVisor":
      return "/admin";
    case "Student":
      return "/dashboard";
    case "User":
      return "/course";
    default:
      return "/course";
  }
};
