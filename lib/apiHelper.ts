/**
 * Safely parses the Response from fetch.
 * If the response is not JSON (e.g. 404 HTML page), it throws an error containing the status and body preview.
 * If the response status is not OK, it throws an error with the backend error message.
 */
export async function parseApiResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error(`Non-JSON response from API (Status ${res.status}):`, text.slice(0, 500));
    throw new Error("API production error. Cek Vercel Runtime Logs dan Environment Variables.");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
