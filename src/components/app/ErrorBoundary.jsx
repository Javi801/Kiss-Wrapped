import React from "react";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { COPY, detectDeviceLanguage } from "@/lib/constants";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, sharing: false };
    this.handleShareLog = this.handleShareLog.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (import.meta.env.DEV) {
      console.error("App crash caught by ErrorBoundary:", error, errorInfo);
    }
  }

  async handleShareLog() {
    const { error, errorInfo } = this.state;
    this.setState({ sharing: true });
    try {
      const timestamp = new Date().toISOString();
      const platform = Capacitor.getPlatform?.() ?? "unknown";
      const content = [
        "KissRecorder Crash Report",
        `Timestamp: ${timestamp}`,
        `Platform: ${platform}`,
        `Error: ${error?.message || String(error)}`,
        "",
        "Stack trace:",
        error?.stack || "(no stack trace available)",
        "",
        "Component stack:",
        errorInfo?.componentStack || "(not available)",
      ].join("\n");

      const fileName = `kiss-recorder-crash-${timestamp.slice(0, 10)}.txt`;
      await Filesystem.writeFile({
        path: fileName,
        directory: Directory.Cache,
        data: content,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({ files: [uri] });
      Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
    } catch {
      // sharing failed silently
    } finally {
      this.setState({ sharing: false });
    }
  }

  render() {
    const { error, sharing } = this.state;

    if (!error) return this.props.children;

    let t;
    try {
      const lang = detectDeviceLanguage();
      t = COPY[lang] ?? COPY.en;
    } catch {
      t = COPY.en;
    }

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "linear-gradient(180deg, #ffddea, #fff8fb, #bde0fe)",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💔</div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#43384a", margin: "0 0 0.5rem" }}>
          {t.crashTitle}
        </h1>

        <p style={{ color: "#6b6270", fontSize: "0.875rem", maxWidth: "22rem", margin: "0 0 2rem", lineHeight: "1.5" }}>
          {t.crashDesc}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "18rem" }}>
          <button
            onClick={this.handleShareLog}
            disabled={sharing}
            style={{
              height: "3.25rem",
              borderRadius: "1rem",
              border: "1.5px solid #ecd6e0",
              backgroundColor: "rgba(255,255,255,0.88)",
              color: "#43384a",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: sharing ? "default" : "pointer",
              opacity: sharing ? 0.6 : 1,
              transition: "opacity 150ms",
            }}
          >
            {sharing ? "…" : t.crashShare}
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              height: "3.25rem",
              borderRadius: "1rem",
              border: "none",
              background: "linear-gradient(90deg, #e27396, #f8abc7)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(226,115,150,0.35)",
            }}
          >
            {t.crashReload}
          </button>
        </div>
      </div>
    );
  }
}
