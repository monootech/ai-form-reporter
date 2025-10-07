// FILE: pages/index.js
// Description: Landing page for client validation (Workflow 1), with caching and polished UX.
// Renders HabitForm after successful validation.

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const HabitForm = dynamic(() => import("../components/HabitForm"), { ssr: false });

// Cache helper
const setCache = (key, value, ttlMs) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ...value, expiry: Date.now() + ttlMs }));
  } catch (err) {
    console.warn("Failed to write validation cache:", err);
  }
};

const getCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

export default function Home() {
  const router = useRouter();
  const { email, contactId } = router.query;

  const [validClient, setValidClient] = useState(null); // null = checking, true/false = result
  const [validationError, setValidationError] = useState("");
  const [firstName, setFirstName] = useState("");

  const CACHE_TTL_MS = 62 * 60 * 1000; // 62 minutes

  useEffect(() => {
    if (!router.isReady) return;

    const cacheKey = contactId && email ? `client_validation_${contactId}_${String(email).toLowerCase()}` : null;

    const validateClient = async () => {
      if (!contactId || !email) {
        setValidClient(false);
        setValidationError("Missing parameters. Please use the link sent to your email.");
        return;
      }

      // Try cache first
      const cached = cacheKey ? getCache(cacheKey) : null;
      if (cached?.valid) {
        setValidClient(true);
        setFirstName(cached.firstName || "");
        return;
      } else if (cached && !cached.valid) {
        setValidClient(false);
        setValidationError(cached.error || "Invalid client link.");
        return;
      }

      // No valid cache → call API
      try {
        const res = await fetch("/api/validate-client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId, email }),
        });
        const result = await res.json();

        if (result.valid) {
          setValidClient(true);
          setFirstName(result.firstName || "");
          if (cacheKey) setCache(cacheKey, { valid: true, firstName: result.firstName || "" }, CACHE_TTL_MS);
        } else {
          const errMsg = result.error || result.message || "Invalid client link. Please use the correct email link.";
          setValidClient(false);
          setValidationError(errMsg);
          if (cacheKey) setCache(cacheKey, { valid: false, error: errMsg }, CACHE_TTL_MS);
        }
      } catch (err) {
        console.error("Validation request failed:", err);
        setValidClient(false);
        setValidationError("Unable to validate access. Please try again later.");
      }
    };

    validateClient();
  }, [router.isReady, contactId, email]);

  // Loading state
  if (validClient === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating your access...</p>
        </div>
      </div>
    );
  }

  // Invalid client state
  if (validClient === false) {
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
              <p className="mt-2">Please use the link provided in your purchase confirmation or email.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid client → show HabitForm
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-4">Personalized AI Habit Blueprint</h1>
        <p className="text-center text-gray-600 mb-6">
          {firstName
            ? `Welcome back, ${firstName}!`
            : "Welcome! Complete the short form below to generate your personalized blueprint."}
        </p>
        <HabitForm contactId={contactId} email={email} firstName={firstName} />
      </div>
    </div>
  );
}
