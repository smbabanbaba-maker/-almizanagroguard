export function humanizeClientError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.trim() : "";
  const technicalResponse =
    /unexpected token|unexpected end|not valid json|failed to fetch|function invocation failed|err_require_esm|a server error/i.test(
      message
    ) || message.startsWith("<!");

  if (technicalResponse) return fallback;

  try {
    const issues = JSON.parse(message) as Array<{
      code?: string;
      path?: string[];
      message?: string;
    }>;
    const issue = Array.isArray(issues) ? issues[0] : undefined;
    if (issue?.code === "too_small" && issue.path?.includes("question")) {
      return "Please type a short agricultural question first.";
    }
  } catch {
    // Keep a safe, server-supplied message when it is not a technical parser error.
  }

  return message || fallback;
}
