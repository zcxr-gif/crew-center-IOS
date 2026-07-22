import SwiftUI

extension Color {
    /// Parse "#RRGGBB" / "RRGGBB" (and optional "#RRGGBBAA"). Returns nil on failure
    /// so callers can fall back to the default accent when a VA sends no colour.
    init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6 || s.count == 8, let v = UInt64(s, radix: 16) else { return nil }
        let r, g, b, a: Double
        if s.count == 6 {
            r = Double((v & 0xFF0000) >> 16) / 255
            g = Double((v & 0x00FF00) >> 8) / 255
            b = Double(v & 0x0000FF) / 255
            a = 1
        } else {
            r = Double((v & 0xFF000000) >> 24) / 255
            g = Double((v & 0x00FF0000) >> 16) / 255
            b = Double((v & 0x0000FF00) >> 8) / 255
            a = Double(v & 0x000000FF) / 255
        }
        self = Color(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}

/// The VA-chosen brand colour, with a sensible fallback when the API sends "".
/// This is the only branding we theme with — text + colour, never logos/liveries.
struct BrandTheme {
    static let fallbackAccent = Color(hex: "#2563EB")!   // neutral blue

    let accent: Color

    init(accentHex: String?) {
        self.accent = accentHex.flatMap { Color(hex: $0) } ?? Self.fallbackAccent
    }
}
