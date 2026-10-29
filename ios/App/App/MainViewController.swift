import Capacitor
import UIKit

/// Bridge view controller that registers the app's local plugins.
/// Counterpart of MainActivity.java on Android.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppIconPlugin())
    }
}
