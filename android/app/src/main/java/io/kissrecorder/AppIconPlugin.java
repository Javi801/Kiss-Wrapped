package io.kissrecorder;

import android.content.ComponentName;
import android.content.pm.PackageManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;
import java.util.List;

@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {

    private static final List<String> COLORS = Arrays.asList("yellow", "pink", "blue", "purple");

    @PluginMethod
    public void setColor(PluginCall call) {
        String color = call.getString("color", "yellow");
        if (!COLORS.contains(color)) {
            call.reject("Unknown color: " + color);
            return;
        }

        PackageManager pm = getContext().getPackageManager();
        String pkg = getContext().getPackageName();

        for (String c : COLORS) {
            int state = c.equals(color)
                    ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                    : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            pm.setComponentEnabledSetting(
                    new ComponentName(pkg, pkg + ".Alias" + capitalize(c)),
                    state,
                    PackageManager.DONT_KILL_APP
            );
        }

        call.resolve();
    }

    private static String capitalize(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
