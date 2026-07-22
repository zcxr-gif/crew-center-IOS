import Foundation

/// VA branding from `GET /api/va-ads/by-slug/:slug`.
/// We deliberately keep only the text + colour fields (name, code, tagline,
/// website, accent) and never render the `logo`/`banner` image URLs.
struct Branding: Decodable {
    let slug: String?
    let code: String?
    let name: String
    let tagline: String
    let website: String
    let accent: String

    enum CodingKeys: String, CodingKey { case slug, code, name, tagline, website, accent }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        slug = try c.decodeIfPresent(String.self, forKey: .slug)
        code = try c.decodeIfPresent(String.self, forKey: .code)
        name = try c.decode(String.self, forKey: .name)
        tagline = (try? c.decode(String.self, forKey: .tagline)) ?? ""
        website = (try? c.decode(String.self, forKey: .website)) ?? ""
        accent = (try? c.decode(String.self, forKey: .accent)) ?? ""
    }
}

/// Response from `POST /api/crew/:slug/login`.
struct LoginResponse: Decodable {
    let token: String
    let view: String
    let role: String
    let oversight: Bool
    let name: String
    let va: VAStub

    struct VAStub: Decodable {
        let name: String
        let slug: String?
        let code: String?
    }
}

/// The signed-in session. The token also lives in the Keychain; the identity
/// fields are cached in UserDefaults so the dashboard can render before the
/// branding fetch returns.
struct Session: Codable, Equatable {
    var slug: String
    var token: String
    var role: String
    var view: String
    var name: String      // signed-in user's display name
    var vaName: String
    var vaCode: String?
    var oversight: Bool
}
