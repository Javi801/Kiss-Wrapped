import UIKit

/// Blanks the app while inactive so the iOS app-switcher snapshot shows a
/// black cover instead of sensitive UI. Counterpart of FLAG_SECURE on Android
/// (MainActivity.java), except iOS cannot block screenshots, only the snapshot.
///
/// Integration (two steps, done on the branch that owns the Xcode project):
///   1. Add this file to the "App" target in Xcode.
///   2. In AppDelegate.application(_:didFinishLaunchingWithOptions:), add:
///          PrivacyScreen.shared.start()
final class PrivacyScreen {
    static let shared = PrivacyScreen()

    private var cover: UIView?
    private init() {}

    func start() {
        let center = NotificationCenter.default
        // willResignActive (not didEnterBackground) is required: the system
        // takes the switcher snapshot after resign-active, and this also
        // covers the app-switcher double-press where the app never backgrounds.
        center.addObserver(forName: UIApplication.willResignActiveNotification,
                           object: nil, queue: .main) { [weak self] _ in
            self?.showCover()
        }
        center.addObserver(forName: UIApplication.didBecomeActiveNotification,
                           object: nil, queue: .main) { [weak self] _ in
            self?.hideCover()
        }
    }

    private func showCover() {
        guard cover == nil, let window = keyWindow() else { return }
        let view = UIView(frame: window.bounds)
        view.backgroundColor = .black
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(view)
        cover = view
    }

    private func hideCover() {
        cover?.removeFromSuperview()
        cover = nil
    }

    private func keyWindow() -> UIWindow? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }
            ?? UIApplication.shared.windows.first
    }
}
