# Crew Center (iOS)

A native SwiftUI app (universal — iPhone + iPad) for Virtual Airline crews. It
signs a pilot into their VA's Crew Center and shows a dashboard themed with the
VA's own brand colour.

## What it does

- **Sign in** against a crew center: `POST /api/crew/:slug/login` returns a
  bearer token that's stored in the Keychain (no cookies).
- **Dashboard** greeting the signed-in pilot, with their role, over the VA's
  brand colour pulled from `GET /api/va-ads/by-slug/:slug`.
- Session is restored on launch and re-verified via `GET /api/crew/:slug/me`.

## Branding policy

The VA's identity is shown as **text only** (name + callsign), tinted with the
VA's chosen accent colour. The app never renders VA logos, banners, or aircraft
liveries — the branding API's `logo`/`banner` fields are intentionally ignored.
This keeps the same experience for everyone, reviewers included.

## Project layout

```
CrewCenter.xcodeproj          # Xcode project (file-system-synchronized group)
CrewCenter/
  CrewCenterApp.swift         # @main entry point
  RootView.swift              # restoring / sign-in / dashboard router
  SignInView.swift            # crew-center handle + username/password
  DashboardView.swift         # branded home
  Components.swift             # Card, LabeledField, RoleBadge
  Theme.swift                 # Color(hex:) + BrandTheme (accent + fallback)
  Models.swift                # Branding, LoginResponse, Session
  APIClient.swift             # login / branding / me
  AuthStore.swift             # session state + persistence
  Keychain.swift              # bearer-token storage
  Assets.xcassets             # AppIcon + AccentColor placeholders
```

## Build & run

Requires **Xcode 16+** (the project uses a file-system-synchronized group, so
new Swift files added to `CrewCenter/` are picked up automatically).

1. Open `CrewCenter.xcodeproj`.
2. Select the **CrewCenter** scheme and a simulator (or a device).
3. Set your signing team under *Signing & Capabilities* if running on device.
4. Build & run (⌘R).

The backend base URL is `https://inflight.info` (see `APIClient.baseURL`).
