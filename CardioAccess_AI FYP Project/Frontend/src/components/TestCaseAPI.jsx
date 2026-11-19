
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function TestCaseAPI() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function testCreateCase() {
    if (loading) return;

    setLoading(true);
    setResult(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Please sign in with Google first.");
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/cases",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            notes: "Temporary test case for backend verification",
          }),
        }
      );

      const data = await response.json();

      setResult({
        status: response.status,
        data,
      });
    } catch (error) {
      setResult({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h3>FastAPI Case Creation Test</h3>

      <button
        type="button"
        onClick={testCreateCase}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: "#2563eb",
          color: "white",
          borderRadius: "8px",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Testing..." : "Create Test Case"}
      </button>

      {result && (
        <pre style={{
          marginTop: "20px",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
