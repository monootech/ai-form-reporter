
// FILE: pages/index.js
// Description: Lightweight landing page that validates client (Workflow 1),
// caches the validation, and renders the multi-step form (HabitForm) when valid.
//
// Requirements:
// - Workflow 1 should be reachable at: /api/validate-client (or change the fetch URL below).
// - Set NEXT_PUBLIC_WORKFLOW2_URL in Vercel to the Workflow 2 endpoint (used by HabitForm).
// - This file imports the actual form UI from /components/HabitForm.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Load HabitForm dynamically to keep index.js lightweight and avoid SSR issues with router.query
const HabitForm = dynamic(() => import("../components/HabitForm"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const { email, contactId } = router.query;

  const [validClient, setValidClient] = useState(null); // null = checking, true = valid, false = invalid
  const [validationError, setValidationError] = useState("");
  const [firstName, setFirstName] = useState("");

  const CACHE_EXPIRY_MS = 62 * 60 * 1000; // 62 minutes

  useEffect(() => {
    // wait for router to be ready (query params available)
    if (!router.isReady) return;

    const cacheKey = contactId && email ? `client_validation_${contactId}_${String(email).toLowerCase()}` : null;

    const validateClient = async () => {
      if (!contactId || !email) {
        setValidClient(false);
        setValidationError("Missing required parameters. Please use the link sent to your email.");
        return;
      }

      // Check cache first
      if (cacheKey) {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            if (cached && cached.valid && Date.now() < cached.expiry) {
              setValidClient(true);
              setFirstName(cached.firstName || "");
              return; // use cached result
            } else {
              localStorage.removeItem(cacheKey);
            }
          } catch (err) {
            console.warn("Failed to parse validation cache:", err);
            localStorage.removeItem(cacheKey);
          }
        }
      }

      // No valid cache: call Workflow 1 endpoint to validate
      try {
        const res = await fetch("/api/validate-client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId, email })
        });

        // Expecting a plain object from Workflow 1: { valid, message, contactId, email, firstName, error }
        const result = await res.json();

        if (result.valid) {
          setValidClient(true);
          setFirstName(result.firstName || "");

          if (cacheKey) {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                valid: true,
                firstName: result.firstName || "",
                expiry: Date.now() + CACHE_EXPIRY_MS
              })
            );
          }
        } else {
          setValidClient(false);
          setValidationError(result.error || result.message || "Invalid client. Please use the correct link from your email or purchase page.");

          if (cacheKey) {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                valid: false,
                error: result.error || result.message || "Invalid client",
                expiry: Date.now() + CACHE_EXPIRY_MS
              })
            );
          }
        }
      } catch (err) {
        console.error("Validation request failed:", err);
        setValidClient(false);
        setValidationError("Unable to validate your access. Please try again or contact support.");
      }
    };

    validateClient();
  }, [router.isReady, contactId, email]);

  // Render states
  if (validClient === null) {
    // still validating
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating your access...</p>
        </div>
      </div>
    );
  }

  if (validClient === false) {
    // invalid access
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h1>
            <p className="text-gray-600 mb-6">{validationError}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p>
                <strong>Note:</strong> You must be an existing client to access this form.
              </p>
              <p className="mt-2">Please click the correct link found in your email or purchase summary page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // valid client → render form component
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-4">Personalized AI Habit Blueprint</h1>
        <p className="text-center text-gray-600 mb-6">
          {firstName ? `Welcome back, ${firstName}!` : "Welcome! Please complete the short form to generate your personalized blueprint."}
        </p>

        <HabitForm contactId={contactId} email={email} firstName={firstName} />
      </div>
    </div>
  );
}

