export function authErrorKey(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  switch (code) {
    case "invalid_credentials":
      return "auth.invalidCredentials";
    case "email_not_confirmed":
      return "auth.emailNotConfirmed";
    case "user_already_exists":
      return "auth.accountExists";
    case "weak_password":
      return "auth.weakPassword";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "auth.rateLimited";
    default:
      return "auth.requestFailed";
  }
}
