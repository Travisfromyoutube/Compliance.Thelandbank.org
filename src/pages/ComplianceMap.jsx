import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { Card, StatCard, AdminPageHeader, SelectInput, StatusPill } from '../components/ui';
import ICONS from '../icons/iconMap';
import { PROGRAM_TYPES } from '../data/mockData';
import { computeComplianceTiming } from '../lib/computeDueNow';
import { useProperties } from '../context/PropertyContext';

/* ── enforcement level display config ─────────────────── */

const ENFORCEMENT_COLORS = {
  0: '#10b981', // green  — compliant
  1: '#f59e0b', // amber  — level 1
  2: '#f97316', // orange — level 2
  3: '#ef4444', // red    — level 3
  4: '#991b1b', // dark red — level 4
};

const ENFORCEMENT_RADII = {
  0: 8,
  1: 9,
  2: 10,
  3: 12,
  4: 14,
};

const ENFORCEMENT_LABELS = {
  0: 'Compliant',
  1: 'Level 1 — Notice',
  2: 'Level 2 — Warning',
  3: 'Level 3 — Default',
  4: 'Level 4 — Legal',
};

const LEGEND_ITEMS = [
  { level: 0, label: 'Compliant', colorClass: 'bg-success' },
  { level: 1, label: 'Level 1', colorClass: 'bg-warning' },
  { level: 2, label: 'Level 2', colorClass: 'bg-[#f97316]' },
  { level: 3, label: 'Level 3', colorClass: 'bg-danger' },
  { level: 4, label: 'Level 4', colorClass: 'bg-[#991b1b]' },
];

/* ── Flint, MI center coordinates ─────────────────────── */

const FLINT_CENTER = [43.01, -83.69];
const DEFAULT_ZOOM = 13;

/* ════════════════════════════════════════════════════════ */

export default function ComplianceMap() {
  const { properties } = useProperties();

  /* ── state ─────────────────────────────────────────────── */
  const [programFilter, setProgramFilter] = useState('All');

  /* ── compute compliance timing for all properties ─────── */
  const timingsMap = useMemo(() => {
    const map = {};
    properties.forEach((p) => {
      map[p.id] = computeComplianceTiming(p);
    });
    return map;
  }, [properties]);

  /* ── filter to mappable properties (have lat/lng) ──────── */
  const mappableProperties = useMemo(() => {
    return properties.filter((p) => {
      if (p.lat == null || p.lng == null) return false;
      if (programFilter !== 'All' && p.programType !== programFilter) return false;
      return true;
    });
  }, [properties, programFilter]);

  /* ── stat card counts ──────────────────────────────────── */
  const stats = useMemo(() => {
    let total = 0;
    let actionNeeded = 0;
    let compliant = 0;
    let highRisk = 0;

    mappableProperties.forEach((p) => {
      total++;
      const timing = timingsMap[p.id];
      if (timing && !timing.error) {
        if (timing.isDueNow) actionNeeded++;
      }
      if (p.enforcementLevel === 0) compliant++;
      if (p.enforcementLevel >= 3) highRisk++;
    });

    return { total, actionNeeded, compliant, highRisk };
  }, [mappableProperties, timingsMap]);

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        icon={ICONS.mapPin}
        title="Compliance Map"
        subtitle="Geographic view of property compliance status"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-slide-up admin-stagger-2">
        <StatCard
          label="Total Properties"
          value={stats.total}
          icon={MapPin}
          variant="default"
        />
        <StatCard
          label="Action Needed"
          value={stats.actionNeeded}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          label="Compliant"
          value={stats.compliant}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          label="High Risk"
          value={stats.highRisk}
          icon={AlertOctagon}
          variant="danger"
        />
      </div>

      {/* Program Filter */}
      <div className="animate-fade-slide-up admin-stagger-3">
        <div className="w-full sm:w-56">
          <SelectInput
            value={programFilter}
            onChange={(val) => setProgramFilter(val)}
            options={[
              { value: 'All', label: 'All Programs' },
              ...Object.values(PROGRAM_TYPES).map((t) => ({ value: t, label: t })),
            ]}
          />
        </div>
      </div>

      {/* Map Container */}
      <Card
        padding="p-0"
        className="animate-fade-slide-up admin-stagger-4 overflow-hidden rounded-lg"
      >
        <div className="h-[400px] md:h-[600px] w-full">
          <MapContainer
            center={FLINT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mappableProperties.map((p) => {
              const timing = timingsMap[p.id];
              const level = p.enforcementLevel ?? 0;
              const color = ENFORCEMENT_COLORS[level] || ENFORCEMENT_COLORS[0];
              const radius = ENFORCEMENT_RADII[level] || ENFORCEMENT_RADII[0];

              return (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px] font-sans text-sm">
                      <p className="font-heading font-semibold text-text text-sm mb-1">
                        {p.address}
                      </p>
                      <div className="space-y-1 text-xs text-muted">
                        <p>
                          <span className="font-semibold text-text">Buyer:</span>{' '}
                          {p.buyerName || 'N/A'}
                        </p>
                        <p>
                          <span className="font-semibold text-text">Program:</span>{' '}
                          {p.programType}
                        </p>
                        <p>
                          <span className="font-semibold text-text">Enforcement:</span>{' '}
                          {ENFORCEMENT_LABELS[level] || `Level ${level}`}
                        </p>
                        {timing && !timing.error && timing.currentAction && timing.currentAction !== 'NOT_DUE_YET' && (
                          <p>
                            <span className="font-semibold text-text">Current Action:</span>{' '}
                            {timing.currentAction.replace(/_/g, ' ')}
                          </p>
                        )}
                        {timing && !timing.error && timing.daysOverdue > 0 && (
                          <p className="text-danger font-mono font-semibold">
                            {timing.daysOverdue} days overdue
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </Card>

      {/* Legend */}
      <Card className="animate-fade-slide-up admin-stagger-5">
        <h3 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-3">
          Rate of Compliance
        </h3>
        <div className="flex flex-wrap gap-4">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.level} className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${item.colorClass} inline-block`}
              />
              <span className="text-xs text-text font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Empty state if no mappable properties */}
      {mappableProperties.length === 0 && (
        <Card className="animate-fade-slide-up admin-stagger-5">
          <div className="text-center py-12">
            <MapPin className="w-10 h-10 text-muted mx-auto mb-3" />
            <h3 className="text-lg font-heading font-semibold text-text mb-1">
              No Properties to Display
            </h3>
            <p className="text-sm text-muted">
              {programFilter !== 'All'
                ? `No ${programFilter} properties have geographic coordinates.`
                : 'No properties have geographic coordinates (lat/lng).'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
