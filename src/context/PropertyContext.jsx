/**
 * PropertyContext - mutable state layer for property records.
 *
 * Attempts to fetch from /api/properties on mount.
 * Falls back to mockData for offline / local-dev / pre-migration.
 *
 * All mutations are dispatched locally AND persisted to the API
 * when available (non-blocking fire-and-forget).
 */

import React, { createContext, useContext, useReducer, useMemo, useEffect, useState } from 'react';
import { allProperties as seedProperties } from '../data/mockData';

/* ── action types ──────────────────────────────────────── */
export const ACTIONS = {
  SET_PROPERTIES:         'SET_PROPERTIES',
  ADD_COMMUNICATION:      'ADD_COMMUNICATION',
  UPDATE_PROPERTY_FIELD:  'UPDATE_PROPERTY_FIELD',
  BATCH_UPDATE_PROPERTIES:'BATCH_UPDATE_PROPERTIES',
};

/* ── reducer ───────────────────────────────────────────── */
function propertyReducer(state, action) {
  switch (action.type) {

    case ACTIONS.SET_PROPERTIES:
      return action.payload;

    case ACTIONS.ADD_COMMUNICATION: {
      const { propertyId, communication } = action.payload;
      return state.map((p) =>
        p.id === propertyId
          ? { ...p, communications: [...(p.communications || []), communication] }
          : p
      );
    }

    case ACTIONS.UPDATE_PROPERTY_FIELD: {
      const { propertyId, field, value } = action.payload;
      return state.map((p) =>
        p.id === propertyId ? { ...p, [field]: value } : p
      );
    }

    case ACTIONS.BATCH_UPDATE_PROPERTIES: {
      const updateMap = {};
      action.payload.forEach(({ propertyId, updates }) => {
        updateMap[propertyId] = updates;
      });
      return state.map((p) =>
        updateMap[p.id] ? { ...p, ...updateMap[p.id] } : p
      );
    }

    default:
      return state;
  }
}

/* ── API helpers (fire-and-forget) ─────────────────────── */
const API_BASE = '/api';

/** Build headers for admin API calls, including auth if configured. */
function adminHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const key = typeof window !== 'undefined' && window.__ADMIN_API_KEY;
  if (key) headers['Authorization'] = `Bearer ${key}`;
  return headers;
}

async function apiPatch(propertyId, data) {
  try {
    await fetch(`${API_BASE}/properties/${propertyId}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify(data),
    });
  } catch {
    // silently ignore - local state is source of truth during session
  }
}

/* ── context ───────────────────────────────────────────── */
const PropertyContext = createContext(null);

export function PropertyProvider({ children }) {
  const [properties, dispatch] = useReducer(
    propertyReducer,
    seedProperties,
    // Deep-clone seed data so we never mutate the import
    (seed) => JSON.parse(JSON.stringify(seed))
  );

  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);

  /* ── Fetch from API on mount ───────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function fetchProperties() {
      try {
        const res = await fetch(`${API_BASE}/properties`, { headers: adminHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          // Ensure communications array exists on each record
          const normalized = data.map((p) => ({
            ...p,
            communications: p.communications || [],
          }));
          dispatch({ type: ACTIONS.SET_PROPERTIES, payload: normalized });
          setApiAvailable(true);
        }
      } catch {
        // Fall back to mockData (already loaded as initial state)
        console.info('[PropertyContext] API unavailable - using local mockData');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProperties();
    return () => { cancelled = true; };
  }, []);

  /* ── convenience dispatchers ─────────────────────────── */
  const actions = useMemo(() => ({
    /**
     * Log a communication against a property.
     * Also updates compliance1stAttempt / compliance2ndAttempt if applicable.
     */
    logCommunication(propertyId, { templateId, templateName, action, subject, body, status = 'sent', recipientEmail }) {
      const now = new Date().toISOString();
      const comm = {
        id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: now.slice(0, 10),
        timestamp: now,
        type: 'email',
        template: templateName || templateId,
        templateId,
        action,
        subject,
        body,
        status,
        recipientEmail,
        approvedAt: status === 'sent' ? now : null,
      };

      dispatch({ type: ACTIONS.ADD_COMMUNICATION, payload: { propertyId, communication: comm } });

      // Update attempt date fields
      const dateStr = now.slice(0, 10);
      if (status === 'sent') {
        if (action === 'ATTEMPT_1') {
          dispatch({ type: ACTIONS.UPDATE_PROPERTY_FIELD, payload: { propertyId, field: 'compliance1stAttempt', value: dateStr } });
          dispatch({ type: ACTIONS.UPDATE_PROPERTY_FIELD, payload: { propertyId, field: 'lastContactDate', value: dateStr } });
          apiPatch(propertyId, { compliance1stAttempt: dateStr, lastContactDate: dateStr });
        } else if (action === 'ATTEMPT_2') {
          dispatch({ type: ACTIONS.UPDATE_PROPERTY_FIELD, payload: { propertyId, field: 'compliance2ndAttempt', value: dateStr } });
          dispatch({ type: ACTIONS.UPDATE_PROPERTY_FIELD, payload: { propertyId, field: 'lastContactDate', value: dateStr } });
          apiPatch(propertyId, { compliance2ndAttempt: dateStr, lastContactDate: dateStr });
        } else {
          dispatch({ type: ACTIONS.UPDATE_PROPERTY_FIELD, payload: { propertyId, field: 'lastContactDate', value: dateStr } });
          apiPatch(propertyId, { lastContactDate: dateStr });
        }
      }

      return comm;
    },

    /**
     * Batch-approve and send emails, then log communications for multiple properties.
     * Calls /api/email with action=send-batch, then logs results locally.
     */
    async batchLogCommunications(entries) {
      // Build email payloads for the API
      const emailPayloads = entries
        .filter(e => e.recipientEmail)
        .map(e => ({
          propertyId: e.propertyId,
          to: e.recipientEmail,
          subject: e.subject,
          body: e.body,
          templateId: e.templateId,
          templateName: e.templateName,
          action: e.action,
        }));

      let apiResults = [];
      let apiCallSucceeded = false;

      // Call the email API if we have emails to send
      if (emailPayloads.length > 0) {
        try {
          const res = await fetch(`${API_BASE}/email`, {
            method: 'POST',
            headers: adminHeaders(),
            body: JSON.stringify({ action: 'send-batch', emails: emailPayloads }),
          });

          if (res.ok) {
            const data = await res.json();
            apiResults = data.results || [];
            apiCallSucceeded = true;
            console.info(`[BatchEmail] Sent ${data.sent}/${data.total}, failed ${data.failed}`);
          } else {
            console.error('[BatchEmail] API error:', res.status);
            // Fall through - still log locally even if API fails
          }
        } catch (err) {
          console.error('[BatchEmail] Network error:', err.message);
          // Fall through - still log locally
        }
      }

      // Log each entry locally (whether API succeeded or not)
      return entries.map((entry) => {
        const apiResult = apiResults.find(r => r.propertyId === entry.propertyId);
        const status = apiCallSucceeded
          ? (apiResult?.success ? 'sent' : 'failed')
          : 'failed';
        return actions.logCommunication(entry.propertyId, { ...entry, status });
      });
    },

    /**
     * Update a single field on a property.
     */
    updateField(propertyId, field, value) {
      dispatch({ type: ACTIONS.UPDATE_PROPERTY_FIELD, payload: { propertyId, field, value } });
      apiPatch(propertyId, { [field]: value });
    },

    /**
     * Get a property by ID from the current state.
     */
    getProperty(id) {
      return properties.find((p) => p.id === id) || null;
    },

  }), [properties, dispatch]);

  const pendingSubmissions = useMemo(
    () => properties.filter((p) => p.submissions?.some((s) => s.status === 'received')).length,
    [properties]
  );

  const value = useMemo(
    () => ({ properties, dispatch, loading, apiAvailable, pendingSubmissions, ...actions }),
    [properties, actions, loading, apiAvailable, pendingSubmissions]
  );

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

/** Hook to access property state and actions. */
export function useProperties() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperties must be used within PropertyProvider');
  return ctx;
}
