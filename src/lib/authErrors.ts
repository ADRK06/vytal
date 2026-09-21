import type { AuthError } from "@supabase/supabase-js";

// Maps Supabase's documented auth error codes to messages worth showing a
// user, rather than the generic "Something went wrong" every form used to
// fall back to. Codes from @supabase/auth-js's ErrorCode type — see
// node_modules/@supabase/auth-js/dist/module/lib/error-codes.d.ts.
export function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please confirm your email before signing in — check your inbox.";
    case "email_exists":
    case "user_already_exists":
    case "identity_already_exists":
      return "An account with this email already exists. Try signing in instead.";
    case "weak_password":
      return "Password is too weak. Use at least 8 characters.";
    case "email_address_invalid":
      return "That email address doesn't look valid.";
    case "same_password":
      return "New password must be different from your current password.";
    case "session_expired":
    case "session_not_found":
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
    case "otp_expired":
      return "This link has expired or already been used. Request a new one.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a moment and try again.";
    case "user_banned":
      return "This account has been disabled.";
    case "signup_disabled":
      return "Sign-ups aren't open right now.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}
