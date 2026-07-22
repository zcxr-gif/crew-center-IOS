import SwiftUI

/// Decides between the restoring spinner, the sign-in page, and the dashboard.
struct RootView: View {
    @StateObject private var auth = AuthStore()

    var body: some View {
        Group {
            if auth.isRestoring {
                ProgressView()
                    .controlSize(.large)
            } else if let session = auth.session {
                DashboardView(session: session)
                    .environmentObject(auth)
            } else {
                SignInView()
                    .environmentObject(auth)
            }
        }
        .task { await auth.restore() }
    }
}
