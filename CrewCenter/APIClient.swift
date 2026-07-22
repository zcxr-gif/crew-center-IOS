import Foundation

enum APIError: LocalizedError {
    case server(String)
    case badResponse

    var errorDescription: String? {
        switch self {
        case .server(let m): return m
        case .badResponse:   return "Something went wrong. Please try again."
        }
    }
}

/// Thin client over the Inflight Crew Center API. Everything is Bearer-token /
/// JSON, so there are no cookies to manage.
struct APIClient {
    /// Base URL of the backend that serves the Crew Center API.
    static let baseURL = URL(string: "https://inflight.info")!

    private let session: URLSession = .shared

    /// Public branding for a crew center (text + colour), used to theme the UI.
    func branding(slug: String) async throws -> Branding {
        let url = APIClient.baseURL.appendingPathComponent("/api/va-ads/by-slug/\(slug.lowercased())")
        let (data, resp) = try await session.data(from: url)
        try Self.check(resp, data)
        return try JSONDecoder().decode(Branding.self, from: data)
    }

    /// Sign in against a crew center. Returns a bearer token + identity.
    func login(slug: String, username: String, password: String) async throws -> LoginResponse {
        let url = APIClient.baseURL.appendingPathComponent("/api/crew/\(slug.lowercased())/login")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["username": username, "password": password])
        let (data, resp) = try await session.data(for: req)
        try Self.check(resp, data)
        return try JSONDecoder().decode(LoginResponse.self, from: data)
    }

    /// Verify an existing token is still valid for this crew center.
    func me(slug: String, token: String) async throws {
        let url = APIClient.baseURL.appendingPathComponent("/api/crew/\(slug.lowercased())/me")
        var req = URLRequest(url: url)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, resp) = try await session.data(for: req)
        try Self.check(resp, data)
    }

    /// Turn a non-2xx into a readable error, surfacing the API's `{ error }` text.
    private static func check(_ resp: URLResponse, _ data: Data) throws {
        guard let http = resp as? HTTPURLResponse else { throw APIError.badResponse }
        guard (200...299).contains(http.statusCode) else {
            if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = (obj["error"] ?? obj["message"]) as? String {
                throw APIError.server(msg)
            }
            throw APIError.badResponse
        }
    }
}
