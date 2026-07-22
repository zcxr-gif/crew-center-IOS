import SwiftUI

/// The post-login home. The VA's identity is shown as TEXT over its brand
/// colour — no logo or livery artwork is ever rendered.
struct DashboardView: View {
    @EnvironmentObject var auth: AuthStore
    let session: Session

    private let api = APIClient()
    @State private var branding: Branding?

    private var accent: Color { BrandTheme(accentHex: branding?.accent).accent }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    vaHeader
                    welcomeCard
                    if let branding, !branding.tagline.isEmpty || !branding.website.isEmpty {
                        aboutCard(branding)
                    }
                }
                .padding()
                .frame(maxWidth: 700)
                .frame(maxWidth: .infinity)   // keep content centred on iPad
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(role: .destructive, action: auth.signOut) {
                            Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    } label: {
                        Image(systemName: "person.crop.circle")
                    }
                }
            }
            .tint(accent)
            .task { branding = try? await api.branding(slug: session.slug) }
        }
        .tint(accent)
    }

    // VA identity — TEXT NAME + a neutral aircraft glyph over the brand colour.
    private var vaHeader: some View {
        VStack(spacing: 10) {
            Image(systemName: "airplane")
                .font(.system(size: 30, weight: .semibold))
                .foregroundStyle(.white)
            Text(session.vaName)
                .font(.title2.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            if let code = session.vaCode, !code.isEmpty {
                Text(code)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .background(
            LinearGradient(colors: [accent, accent.opacity(0.8)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private var welcomeCard: some View {
        Card {
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(accent.opacity(0.15)).frame(width: 48, height: 48)
                    Text(initials(session.name)).font(.headline).foregroundStyle(accent)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("Welcome back").font(.caption).foregroundStyle(.secondary)
                    Text(session.name).font(.headline)
                }
                Spacer()
                RoleBadge(role: session.oversight ? "oversight" : session.role, accent: accent)
            }
        }
    }

    private func aboutCard(_ b: Branding) -> some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                Text("About").font(.headline)
                if !b.tagline.isEmpty {
                    Text(b.tagline).font(.subheadline).foregroundStyle(.secondary)
                }
                if !b.website.isEmpty, let url = URL(string: b.website) {
                    Link(destination: url) {
                        Label("Visit website", systemImage: "safari")
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func initials(_ name: String) -> String {
        let letters = name.split(separator: " ").prefix(2).compactMap { $0.first }
        let s = String(letters).uppercased()
        return s.isEmpty ? "?" : s
    }
}
