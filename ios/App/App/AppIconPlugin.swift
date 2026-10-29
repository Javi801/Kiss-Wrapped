import Capacitor
import UIKit

/// Switches the home screen icon to one of the variants in Assets.xcassets.
/// Counterpart of AppIconPlugin.java: the default variant is the primary AppIcon set,
/// every other variant is the alternate set "AppIcon-<variant>".
@objc(AppIconPlugin)
public class AppIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppIconPlugin"
    public let jsName = "AppIcon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setColor", returnType: CAPPluginReturnPromise)
    ]

    private static let colors = [
        "notebookPink", "notebookLavender", "notebookGreen",
        "chartPink", "chartLavender", "chartGreen",
        "orbitPink", "orbitLavender", "orbitGreen"]
    private static let defaultColor = "notebookPink"

    @objc func setColor(_ call: CAPPluginCall) {
        let color = call.getString("color", Self.defaultColor)
        guard Self.colors.contains(color) else {
            call.reject("Unknown color: \(color)")
            return
        }
        let iconName: String? = color == Self.defaultColor ? nil : "AppIcon-\(color)"

        DispatchQueue.main.async {
            let app = UIApplication.shared
            guard app.supportsAlternateIcons else {
                call.unavailable("Alternate icons are not supported")
                return
            }
            // iOS shows a system alert on every change, so skip a no-op switch.
            guard app.alternateIconName != iconName else {
                call.resolve()
                return
            }
            app.setAlternateIconName(iconName) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }
}
