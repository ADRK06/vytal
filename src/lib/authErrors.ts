import type { AuthError } from "@supabase/supabase-js";

// Maps Supabase's documented auth error codes to messages worth showing a
// user, rather than a generic fallback. Codes from @supabase/auth-js's
// ErrorCode type — see
// node_modules/@supabase/auth-js/dist/module/lib/error-codes.d.ts.
//
// This project never sends real email (sign-up/sign-in are both
// username+password, with an internally generated, never-shown email under
// the hood — see lib/username.ts), so link/confirmation-flow codes
// (email_not_confirmed, session_expired, flow_state_expired,
// bad_code_verifier, otp_expired, same_password, over_email_send_rate_limit)
// can't occur here and are intentionally not handled.
export function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect username or password.";
    case "email_exists":
    case "user_already_exists":
    case "identity_already_exists":
      return "Username already taken.";
    case "weak_password":
      return "Password is too weak. Use at least 8 characters.";
    case "email_address_invalid":
      return "That username can't be used. Try a different one.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a moment and try again.";
    case "user_banned":
      return "This account has been disabled.";
    case "signup_disabled":
      return "Sign-ups aren't open right now.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}
