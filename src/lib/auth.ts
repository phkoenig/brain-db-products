export type AllowlistConfig = {
  emails: string[];
  domains: string[];
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^\./, "");
}

function extractDomainFromEmail(email: string): string | null {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1 || atIndex === email.length - 1) {
    return null;
  }
  return email.slice(atIndex + 1).toLowerCase();
}

function parseEnvList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,\n;]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export class AuthService {
  static getAllowlistConfig(): AllowlistConfig {
    const emailList = parseEnvList(process.env.ALLOWLIST_EMAILS).map(normalizeEmail);
    const domainList = parseEnvList(process.env.ALLOWLIST_DOMAINS).map(normalizeDomain);
    return { emails: emailList, domains: domainList };
  }

  /**
   * Checks if the provided email is allowed to sign up based on configured allowlists.
   * - Exact email matches in ALLOWLIST_EMAILS
   * - Domain matches in ALLOWLIST_DOMAINS (supports subdomains)
   * If no allowlist envs are set, default to deny-by-default for safety.
   */
  static checkAllowlist(email: string): boolean {
    const normalizedEmail = normalizeEmail(email);
    const config = this.getAllowlistConfig();

    // If no allowlist entries exist, prevent signups by default
    if (config.emails.length === 0 && config.domains.length === 0) {
      return false;
    }

    // Exact email allow
    if (config.emails.includes(normalizedEmail)) {
      return true;
    }

    // Domain allow
    const domain = extractDomainFromEmail(normalizedEmail);
    if (!domain) return false;

    const normalizedDomain = normalizeDomain(domain);

    // Match exact domain or parent domain segments
    // e.g., if allowlist has "example.com", then user@sub.example.com is allowed
    return config.domains.some((allowedDomain) => {
      if (normalizedDomain === allowedDomain) return true;
      return normalizedDomain.endsWith(`.${allowedDomain}`);
    });
  }
}

export default AuthService;