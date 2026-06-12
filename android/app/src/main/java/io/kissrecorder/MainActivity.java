package io.kissrecorder;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // FLAG_SECURE makes the recent-apps thumbnail blank and blocks screen
        // capture system-wide, including on OEM skins such as EMUI.
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        registerPlugin(AppIconPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
