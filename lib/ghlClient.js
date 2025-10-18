// /lib/ghlClient.js
const GHL_API_KEY = process.env.GHL_API_KEY;
const API_VERSION = "2021-07-28"; // Keep consistent with your workflows
const BASE_URL = "https://services.leadconnectorhq.com";

async function fetchGHL(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: API_VERSION,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.warn(`[GHL Client] Error ${res.status}:`, data || options);
    }
    return data;
  } catch (err) {
    console.error("[GHL Client] Fetch failed:", err);
    return null;
  }
}

/**
 * Add tag(s) to a contact
 * @param {string} contactId 
 * @param {string|string[]} tags
 */
async function addTag(contactId, tags) {
  if (!contactId || !tags) return null;
  const tagArray = Array.isArray(tags) ? tags : [tags];
  return fetchGHL(`/contacts/${contactId}/tags`, {
    method: "POST",
    body: JSON.stringify({ tags: tagArray }),
  });
}

/**
 * Remove tag(s) from a contact
 * @param {string} contactId 
 * @param {string|string[]} tags
 */
async function removeTag(contactId, tags) {
  if (!contactId || !tags) return null;
  const tagArray = Array.isArray(tags) ? tags : [tags];
  return fetchGHL(`/contacts/${contactId}/tags/remove`, {
    method: "POST",
    body: JSON.stringify({ tags: tagArray }),
  });
}

/**
 * Update custom fields on a contact
 * @param {string} contactId 
 * @param {Object} fields - key: value pairs of custom fields
 */
async function updateFields(contactId, fields = {}) {
  if (!contactId || !fields || Object.keys(fields).length === 0) return null;
  return fetchGHL(`/contacts/${contactId}/custom-fields`, {
    method: "POST",
    body: JSON.stringify({ customFields: fields }),
  });
}

/**
 * Increment numerical custom field (for counters)
 * @param {string} contactId 
 * @param {string} fieldKey 
 * @param {number} incrementBy 
 */
async function incrementField(contactId, fieldKey, incrementBy = 1) {
  if (!contactId || !fieldKey) return null;

  // Get current value first
  const contact = await fetchGHL(`/contacts/${contactId}`);
  let currentValue = Number(contact?.contact?.customFields?.[fieldKey] || 0);
  const newValue = currentValue + incrementBy;

  return updateFields(contactId, { [fieldKey]: newValue });
}

export default {
  addTag,
  removeTag,
  updateFields,
  incrementField,
};
