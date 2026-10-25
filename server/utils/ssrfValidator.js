/**
 * SSRF and Loopback Protection Validator
 * Rejects loopback (127.0.0.1, localhost), link-local (169.254.x.x), 
 * private network ranges (10.x, 172.16-31.x, 192.168.x), broadcast,
 * and internal top-level domains.
 */

function isSafeWebhookUrl(urlString) {
  try {
    if (!urlString || typeof urlString !== "string") return false;
    const trimmed = urlString.trim();
    const parsed = new URL(trimmed);

    // Only allow HTTP and HTTPS protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Loopback, wildcard, and undefined hostnames
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]"
    ) {
      return false;
    }

    // Prohibit internal domain suffixes
    if (
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan") ||
      hostname.endsWith(".home.arpa") ||
      hostname.endsWith(".corp")
    ) {
      return false;
    }

    // Raw hex, octal, or integer IP formats (e.g. 0x7f000001, 2130706433)
    if (/^0x[0-9a-f]+$/i.test(hostname) || /^\d+$/.test(hostname)) {
      return false;
    }

    // IPv4 address checks
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      const c = parseInt(match[3], 10);
      const d = parseInt(match[4], 10);

      if (a > 255 || b > 255 || c > 255 || d > 255) return false;

      // 127.0.0.0/8 (Loopback)
      if (a === 127) return false;

      // 0.0.0.0/8 (Broadcast/Current network)
      if (a === 0) return false;

      // 10.0.0.0/8 (Private Network)
      if (a === 10) return false;

      // 172.16.0.0/12 (Private Network: 172.16.0.0 - 172.31.255.255)
      if (a === 172 && b >= 16 && b <= 31) return false;

      // 192.168.0.0/16 (Private Network)
      if (a === 192 && b === 168) return false;

      // 169.254.0.0/16 (Link-Local / AWS/GCP/Azure Cloud Metadata API)
      if (a === 169 && b === 254) return false;

      // 100.64.0.0/10 (Carrier-Grade NAT)
      if (a === 100 && b >= 64 && b <= 127) return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

module.exports = { isSafeWebhookUrl };
