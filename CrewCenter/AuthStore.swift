import Foundation

/// Owns the signed-in session and drives which screen `RootView` shows. The
/// token is stored only in the Keychain; the identity fields are cached in
/// UserDefaults so the dashboard can render immediately on relaunch.
@MainActor
final class AuthStore: ObservableObject {
    @Published private(set) var session: Session?
    @Published var isRestoring = true

    private let api = APIClient()
    private let defaults = UserDefaults.standard
    private let lastSlugKey = "cc.lastSlug"

    /// Restore a persisted session on launch and verify the token still works.
    func restore() async {
        defer { isRestoring = false }
        guard let slug = defaults.string(forKey: lastSlugKey),
              var saved = loadSession(slug: slug),
              let token = Keychain.get(account: slug) else { return }
        saved.token = token
        do {
            try await api.me(slug: slug, token: token)
            session = saved
        } catch {
            // Token expired / invalid — clear it and stay signed out.
            signOut()
        }
    }

    func signIn(slug rawSlug: String, username: String, password: String) async throws {
        let slug = rawSlug.trimmingCharacters(in: .whitespaces).lowercased()
        let res = try await api.login(slug: slug, username: username, password: password)
        let s = Session(
            slug: slug, token: res.token, role: res.role, view: res.view,
            name: res.name, vaName: res.va.name, vaCode: res.va.code, oversight: res.oversight
        )
        Keychain.set(res.token, account: slug)
        saveSession(s)
        defaults.set(slug, forKey: lastSlugKey)
        session = s
    }

    func signOut() {
        let slug = session?.slug ?? defaults.string(forKey: lastSlugKey)
        if let slug {
            Keychain.delete(account: slug)
            defaults.removeObject(forKey: sessionKey(slug))
        }
        defaults.removeObject(forKey: lastSlugKey)
        session = nil
    }

    // MARK: - Identity cache (token is NOT persisted here — Keychain only)

    private func sessionKey(_ slug: String) -> String { "cc.session.\(slug)" }

    private func saveSession(_ s: Session) {
        var copy = s
        copy.token = ""   // never persist the token in UserDefaults
        if let data = try? JSONEncoder().encode(copy) {
            defaults.set(data, forKey: sessionKey(s.slug))
        }
    }

    private func loadSession(slug: String) -> Session? {
        guard let data = defaults.data(forKey: sessionKey(slug)) else { return nil }
        return try? JSONDecoder().decode(Session.self, from: data)
    }
}
