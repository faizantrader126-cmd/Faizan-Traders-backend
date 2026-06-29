export const LIVE_SERVER_URL = "https://ais-pre-gjrx2a6tugveeqc7qhlfxe-411638771549.asia-east1.run.app";

/**
 * Returns a fully qualified API URL when running outside the server's environment (like on Vercel),
 * and relative path when running directly inside the AI Studio development server.
 */
export function getApiUrl(path: string): string {
  if (typeof window === "undefined") {
    return path;
  }

  const hostname = window.location.hostname;
  
  // If we are in the primary AI Studio live preview container, use relative routing
  const isLocalContainer = 
    (hostname.includes("run.app") && !hostname.includes("vercel.app")) ||
    hostname.includes("gjrx2a6tugveeqc7qhlfxe") ||
    hostname === "localhost" && window.location.port === "3000";

  if (isLocalContainer) {
    return path;
  }

  // If running on Vercel or any other domain, point directly to the permanent live container backend URL
  return `${LIVE_SERVER_URL}${path}`;
}
