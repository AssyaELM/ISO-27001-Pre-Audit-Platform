import type { AuthError } from "@supabase/supabase-js";
import { authCopy, type AuthLanguage } from "@/content/auth";

export function getAuthErrorMessage(error: AuthError, language: AuthLanguage) {
  const copy = authCopy[language];

  switch (error.code) {
    case "invalid_credentials":
      return copy.invalidCredentials;
    case "email_not_confirmed":
      return copy.emailNotConfirmed;
    case "user_already_exists":
    case "email_exists":
      return copy.accountExists;
    case "weak_password":
      return copy.weakPassword;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return copy.tooManyRequests;
    case "otp_expired":
    case "otp_disabled":
      return copy.checkEmail.invalidCode;
    case "session_not_found":
      return copy.sessionExpired;
    default:
      return copy.genericError;
  }
}
