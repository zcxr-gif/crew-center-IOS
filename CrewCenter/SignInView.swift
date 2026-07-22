import SwiftUI

/// Crew Center sign-in. The pilot enters their crew-center handle plus the
/// username/password of their existing account. As soon as we know the handle
/// we pull the VA's public branding so the page themes to the VA's own colour.
struct SignInView: View {
    @EnvironmentObject var auth: AuthStore
    private let api = APIClient()

    @State private var slug = ""
    @State private var username = ""
    @State private var password = ""
    @State private var branding: Branding?
    @State private var isLoading = false
    @State private var error: String?

    private var accent: Color { BrandTheme(accentHex: branding?.accent).accent }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                header
                fields
                if let error {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                signInButton
            }
            .padding(24)
            .frame(maxWidth: 440)
            .frame(maxWidth: .infinity)   // centre the column on iPad
        }
        .background(Color(.systemGroupedBackground))
        .tint(accent)
        .animation(.easeInOut, value: branding?.accent)
    }

    private var header: some View {
        VStack(spacing: 10) {
            Image(systemName: "airplane")
                .font(.system(size: 44, weight: .semibold))
                .foregroundStyle(accent)
                .padding(.top, 40)
            Text(branding?.name ?? "Crew Center")
                .font(.title.bold())
                .multilineTextAlignment(.center)
            Text((branding?.tagline).flatMap { $0.isEmpty ? nil : $0 } ?? "Sign in to your VA")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private var fields: some View {
        VStack(spacing: 14) {
            LabeledField(title: "Crew Center", systemImage: "building.2") {
                TextField("your-va", text: $slug)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.next)
                    .onSubmit(loadBranding)
            }
            LabeledField(title: "Username", systemImage: "person") {
                TextField("username", text: $username)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            LabeledField(title: "Password", systemImage: "lock") {
                SecureField("password", text: $password)
                    .onSubmit(signIn)
            }
        }
    }

    private var signInButton: some View {
        Button(action: signIn) {
            HStack {
                if isLoading { ProgressView().tint(.white) }
                Text(isLoading ? "Signing in\u{2026}" : "Sign In").bold()
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)
        .disabled(isLoading || slug.isEmpty || username.isEmpty || password.isEmpty)
    }

    private func loadBranding() {
        let s = slug.trimmingCharacters(in: .whitespaces)
        guard !s.isEmpty else { return }
        Task { branding = try? await api.branding(slug: s) }
    }

    private func signIn() {
        guard !slug.isEmpty, !username.isEmpty, !password.isEmpty else { return }
        error = nil
        isLoading = true
        Task {
            defer { isLoading = false }
            do {
                try await auth.signIn(slug: slug, username: username, password: password)
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
