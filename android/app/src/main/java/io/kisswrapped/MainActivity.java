package io.kisswrapped;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Android 13+ can hide the recent-apps thumbnail without blocking screenshots.
    private static final boolean HAS_RECENTS_SCREENSHOT_API =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppIconPlugin.class);
        super.onCreate(savedInstanceState);
        if (HAS_RECENTS_SCREENSHOT_API) {
            setRecentsScreenshotEnabled(false);
        }
    }

    @Override
    public void onPause() {
        // Older versions (including EMUI): FLAG_SECURE only while backgrounded, so the
        // recents thumbnail is blank but screenshots work in the foreground.
        if (!HAS_RECENTS_SCREENSHOT_API) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        }
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (!HAS_RECENTS_SCREENSHOT_API) {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
        }
    }
}
