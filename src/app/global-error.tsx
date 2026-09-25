"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f5f4f1", color: "#292724" }}>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
          <h1 style={{ fontSize: 48, marginBottom: 16 }}>AI_demo hit a snag.</h1>
          <p style={{ lineHeight: 1.7 }}>
            Please retry. If the problem continues, keep the reference below
            and return to the previous page.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: 24,
              border: 0,
              background: "#087f96",
              color: "white",
              padding: "12px 20px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? <p>Reference: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}
