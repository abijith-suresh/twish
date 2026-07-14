export type HttpStatusCategory =
  | "Informational"
  | "Success"
  | "Redirection"
  | "Client Error"
  | "Server Error";

export interface HttpStatusCodeEntry {
  code: number;
  name: string;
  category: HttpStatusCategory;
  description: string;
}

export const HTTP_STATUS_CODES: HttpStatusCodeEntry[] = [
  {
    code: 100,
    name: "Continue",
    category: "Informational",
    description: "The initial part of the request was received and the client may continue.",
  },
  {
    code: 101,
    name: "Switching Protocols",
    category: "Informational",
    description: "The server is switching to a different protocol requested by the client.",
  },
  {
    code: 102,
    name: "Processing",
    category: "Informational",
    description: "The server received the request and is still working on it.",
  },
  {
    code: 103,
    name: "Early Hints",
    category: "Informational",
    description: "The server is sending preload hints before the final response.",
  },
  { code: 200, name: "OK", category: "Success", description: "The request succeeded." },
  {
    code: 201,
    name: "Created",
    category: "Success",
    description: "The request succeeded and created a new resource.",
  },
  {
    code: 202,
    name: "Accepted",
    category: "Success",
    description: "The request was accepted for asynchronous processing.",
  },
  {
    code: 203,
    name: "Non-Authoritative Information",
    category: "Success",
    description: "The response payload was transformed by a proxy.",
  },
  {
    code: 204,
    name: "No Content",
    category: "Success",
    description: "The request succeeded and there is no response body.",
  },
  {
    code: 205,
    name: "Reset Content",
    category: "Success",
    description: "The request succeeded and the client should reset the document view.",
  },
  {
    code: 206,
    name: "Partial Content",
    category: "Success",
    description: "The response contains the requested byte range.",
  },
  {
    code: 207,
    name: "Multi-Status",
    category: "Success",
    description: "The response contains multiple status codes for independent operations.",
  },
  {
    code: 208,
    name: "Already Reported",
    category: "Success",
    description: "Members of a DAV binding were already reported earlier in the response.",
  },
  {
    code: 226,
    name: "IM Used",
    category: "Success",
    description: "The server fulfilled the GET request using an instance-manipulation result.",
  },
  {
    code: 300,
    name: "Multiple Choices",
    category: "Redirection",
    description: "The request has more than one possible response.",
  },
  {
    code: 301,
    name: "Moved Permanently",
    category: "Redirection",
    description: "The resource now lives at a new permanent URL.",
  },
  {
    code: 302,
    name: "Found",
    category: "Redirection",
    description: "The resource temporarily lives at a different URL.",
  },
  {
    code: 303,
    name: "See Other",
    category: "Redirection",
    description: "The response can be found at another URI with a GET request.",
  },
  {
    code: 304,
    name: "Not Modified",
    category: "Redirection",
    description: "The cached representation is still valid.",
  },
  {
    code: 305,
    name: "Use Proxy",
    category: "Redirection",
    description: "The requested resource must be accessed through the listed proxy.",
  },
  {
    code: 307,
    name: "Temporary Redirect",
    category: "Redirection",
    description: "Repeat the request at another URI without changing the method.",
  },
  {
    code: 308,
    name: "Permanent Redirect",
    category: "Redirection",
    description: "Repeat the request at another URI and preserve the method.",
  },
  {
    code: 400,
    name: "Bad Request",
    category: "Client Error",
    description: "The server could not understand the request.",
  },
  {
    code: 401,
    name: "Unauthorized",
    category: "Client Error",
    description: "Authentication is required to access the resource.",
  },
  {
    code: 402,
    name: "Payment Required",
    category: "Client Error",
    description: "Reserved for future use or digital payment workflows.",
  },
  {
    code: 403,
    name: "Forbidden",
    category: "Client Error",
    description: "The server understood the request but refuses to authorize it.",
  },
  {
    code: 404,
    name: "Not Found",
    category: "Client Error",
    description: "The requested resource could not be found.",
  },
  {
    code: 405,
    name: "Method Not Allowed",
    category: "Client Error",
    description: "The request method is not allowed for this resource.",
  },
  {
    code: 406,
    name: "Not Acceptable",
    category: "Client Error",
    description: "No available representation matches the request headers.",
  },
  {
    code: 407,
    name: "Proxy Authentication Required",
    category: "Client Error",
    description: "Authentication is required with the proxy.",
  },
  {
    code: 408,
    name: "Request Timeout",
    category: "Client Error",
    description: "The server timed out while waiting for the request.",
  },
  {
    code: 409,
    name: "Conflict",
    category: "Client Error",
    description: "The request conflicts with the current resource state.",
  },
  {
    code: 410,
    name: "Gone",
    category: "Client Error",
    description: "The resource is gone and will not be available again.",
  },
  {
    code: 411,
    name: "Length Required",
    category: "Client Error",
    description: "A Content-Length header is required.",
  },
  {
    code: 412,
    name: "Precondition Failed",
    category: "Client Error",
    description: "One of the request preconditions evaluated to false.",
  },
  {
    code: 413,
    name: "Content Too Large",
    category: "Client Error",
    description: "The request entity is larger than the server is willing to process.",
  },
  {
    code: 414,
    name: "URI Too Long",
    category: "Client Error",
    description: "The target URI is longer than the server is willing to interpret.",
  },
  {
    code: 415,
    name: "Unsupported Media Type",
    category: "Client Error",
    description: "The request payload format is not supported.",
  },
  {
    code: 416,
    name: "Range Not Satisfiable",
    category: "Client Error",
    description: "The requested range cannot be served.",
  },
  {
    code: 417,
    name: "Expectation Failed",
    category: "Client Error",
    description: "The Expect request-header field could not be met.",
  },
  {
    code: 418,
    name: "I'm a Teapot",
    category: "Client Error",
    description: "The server refuses to brew coffee because it is a teapot.",
  },
  {
    code: 421,
    name: "Misdirected Request",
    category: "Client Error",
    description: "The request was directed at a server that cannot produce a response.",
  },
  {
    code: 422,
    name: "Unprocessable Content",
    category: "Client Error",
    description: "The request syntax is valid but semantically invalid.",
  },
  {
    code: 423,
    name: "Locked",
    category: "Client Error",
    description: "The target resource is locked.",
  },
  {
    code: 424,
    name: "Failed Dependency",
    category: "Client Error",
    description: "The request failed because a dependent request failed.",
  },
  {
    code: 425,
    name: "Too Early",
    category: "Client Error",
    description: "The server is unwilling to risk processing a replayable request.",
  },
  {
    code: 426,
    name: "Upgrade Required",
    category: "Client Error",
    description: "The server requires the client to switch protocols.",
  },
  {
    code: 428,
    name: "Precondition Required",
    category: "Client Error",
    description: "The origin server requires the request to be conditional.",
  },
  {
    code: 429,
    name: "Too Many Requests",
    category: "Client Error",
    description: "The user has sent too many requests in a given amount of time.",
  },
  {
    code: 431,
    name: "Request Header Fields Too Large",
    category: "Client Error",
    description: "The request headers are too large to process.",
  },
  {
    code: 451,
    name: "Unavailable For Legal Reasons",
    category: "Client Error",
    description: "The resource is unavailable due to legal demands.",
  },
  {
    code: 500,
    name: "Internal Server Error",
    category: "Server Error",
    description: "The server encountered an unexpected condition.",
  },
  {
    code: 501,
    name: "Not Implemented",
    category: "Server Error",
    description: "The server does not support the requested functionality.",
  },
  {
    code: 502,
    name: "Bad Gateway",
    category: "Server Error",
    description: "The server received an invalid response from an upstream server.",
  },
  {
    code: 503,
    name: "Service Unavailable",
    category: "Server Error",
    description: "The server is temporarily unavailable.",
  },
  {
    code: 504,
    name: "Gateway Timeout",
    category: "Server Error",
    description: "An upstream server failed to send a timely response.",
  },
  {
    code: 505,
    name: "HTTP Version Not Supported",
    category: "Server Error",
    description: "The server does not support the HTTP protocol version used.",
  },
  {
    code: 506,
    name: "Variant Also Negotiates",
    category: "Server Error",
    description: "Transparent content negotiation for the request results in a circular reference.",
  },
  {
    code: 507,
    name: "Insufficient Storage",
    category: "Server Error",
    description: "The server cannot store the representation needed to complete the request.",
  },
  {
    code: 508,
    name: "Loop Detected",
    category: "Server Error",
    description: "The server detected an infinite loop while processing the request.",
  },
  {
    code: 510,
    name: "Not Extended",
    category: "Server Error",
    description: "Further extensions to the request are required for fulfillment.",
  },
  {
    code: 511,
    name: "Network Authentication Required",
    category: "Server Error",
    description: "The client needs to authenticate to gain network access.",
  },
];

export function searchHttpStatusCodes(query: string): HttpStatusCodeEntry[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (normalizedQuery.length === 0) {
    return HTTP_STATUS_CODES;
  }

  return HTTP_STATUS_CODES.filter((entry) => {
    const haystack = [String(entry.code), entry.name, entry.category, entry.description]
      .join(" ")
      .toLocaleLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
