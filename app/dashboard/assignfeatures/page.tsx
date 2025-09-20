"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import type { Feature, Institution, InstitutionFeatureAssignment } from "@/lib/types";

export default function AssignFeaturesPage() {
  // View mode state
  const [viewMode, setViewMode] = useState<'overall' | 'institution'>('institution');

  // Institutions state
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState<boolean>(true);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);

  // Selected institution
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");

  // Features state
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState<boolean>(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);

  // Institution feature assignments
  const [institutionFeatureAssignments, setInstitutionFeatureAssignments] = useState<InstitutionFeatureAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState<boolean>(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);

  // Map institution -> feature enabled state (for local overrides)
  const [featureOverrides, setFeatureOverrides] = useState<
    Record<string, Record<string, boolean>>
  >(() => ({}));

  // Update (save) loading and error states
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Fetch institutions on component mount
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setInstitutionsLoading(true);
        setInstitutionsError(null);
        const response = await apiClient.getAllInstitutions(1, 100); // Get all institutions
        if (response.success && response.data) {
          setInstitutions(response.data.data);
          // Auto-select first institution if available
          if (response.data.data.length > 0) {
            setSelectedInstitutionId(response.data.data[0].id);
          }
        } else {
          setInstitutionsError("Failed to fetch institutions");
        }
      } catch (err) {
        setInstitutionsError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setInstitutionsLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  // Fetch all features on component mount
  useEffect(() => {
    const fetchAllFeatures = async () => {
      try {
        setFeaturesLoading(true);
        setFeaturesError(null);
        const response = await apiClient.getFeatures();
        if (response.success && response.data) {
          setAllFeatures(response.data);
        } else {
          setFeaturesError("Failed to fetch features");
        }
      } catch (err) {
        setFeaturesError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setFeaturesLoading(false);
      }
    };

    fetchAllFeatures();
  }, []);

  // Fetch institution feature assignments when institution changes
  useEffect(() => {
    if (!selectedInstitutionId) return;

    const fetchInstitutionFeatures = async () => {
      try {
        setAssignmentsLoading(true);
        setAssignmentsError(null);
        const response = await apiClient.getInstitutionFeatures(selectedInstitutionId);
        if (response.success && response.data) {
          setInstitutionFeatureAssignments(response.data);
        } else {
          setAssignmentsError("Failed to fetch institution features");
        }
      } catch (err) {
        setAssignmentsError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchInstitutionFeatures();
  }, [selectedInstitutionId]);

  // Original feature states (without local overrides)
  const originalFeatureStates = useMemo(() => {
    const defaults: Record<string, boolean> = {};

    if (viewMode === 'overall') {
      allFeatures.forEach((feature) => {
        defaults[feature.key] = feature.isActive;
      });
    } else {
      institutionFeatureAssignments.forEach((assignment) => {
        defaults[assignment.feature.key] = assignment.enabled;
      });
      allFeatures.forEach((feature) => {
        if (!(feature.key in defaults)) {
          defaults[feature.key] = feature.isActive;
        }
      });
    }

    return defaults;
  }, [institutionFeatureAssignments, allFeatures, viewMode]);

  // Current states are overrides if present, else original defaults
  const currentFeatureStatesForSelected = useMemo(() => {
    return featureOverrides[selectedInstitutionId] ?? originalFeatureStates;
  }, [featureOverrides, selectedInstitutionId, originalFeatureStates]);

  // Detect unsaved changes for the selected institution
  const hasUnsavedChanges = useMemo(() => {
    const overrides = featureOverrides[selectedInstitutionId];
    if (!overrides) return false;
    // Compare with original
    for (const feature of allFeatures) {
      const key = feature.key;
      const original = originalFeatureStates[key] ?? false;
      const current = overrides[key] ?? false;
      if (original !== current) return true;
    }
    return false;
  }, [featureOverrides, selectedInstitutionId, originalFeatureStates, allFeatures]);

  const handleToggle = (featureKey: string, checked: boolean) => {
    // Only allow toggling in institution view mode
    if (viewMode === 'overall' || !selectedInstitutionId) return;

    setUpdateError(null);
    setUpdateSuccess(null);

    const currentFeatures = featureOverrides[selectedInstitutionId] ?? originalFeatureStates;
    const updatedFeatures = { ...currentFeatures, [featureKey]: checked };

    setFeatureOverrides((prev) => ({
      ...prev,
      [selectedInstitutionId]: updatedFeatures,
    }));
  };

  const handleUpdate = async () => {
    if (!selectedInstitutionId) return;
    const current = featureOverrides[selectedInstitutionId] ?? originalFeatureStates;
    const featuresArray = Object.entries(current).map(([key, enabled]) => ({ key, enabled }));

    try {
      setUpdateLoading(true);
      setUpdateError(null);
      setUpdateSuccess(null);

      const response = await apiClient.assignInstitutionFeatures({
        institutionId: selectedInstitutionId,
        features: featuresArray,
      });

      if (!response.success) {
        throw new Error('Failed to update features');
      }

      setUpdateSuccess(response.data?.message || 'Updated successfully');

      // Refresh assignments and clear overrides for this institution
      const refreshed = await apiClient.getInstitutionFeatures(selectedInstitutionId);
      if (refreshed.success && refreshed.data) {
        setInstitutionFeatureAssignments(refreshed.data);
      }
      setFeatureOverrides((prev) => {
        const next = { ...prev } as typeof prev;
        delete next[selectedInstitutionId];
        return next;
      });
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (institutionsLoading || featuresLoading) {
    return (
      <div className="-m-10 -mx-4 sm:-mx-6 lg:-mx-8 min-h-screen border-none shadow-none">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading institutions and features...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (institutionsError || featuresError) {
    return (
      <div className="-m-10 -mx-4 sm:-mx-6 lg:-mx-8 min-h-screen border-none shadow-none">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-600 font-semibold">Error loading data</p>
                <p className="text-gray-600 mt-2">
                  {institutionsError || featuresError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (assignmentsLoading && selectedInstitutionId && viewMode === 'institution') {
    return (
      <div className="-m-10 -mx-4 sm:-mx-6 lg:-mx-8 min-h-screen border-none shadow-none">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading institution features...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (assignmentsError && selectedInstitutionId && viewMode === 'institution') {
    return (
      <div className="-m-10 -mx-4 sm:-mx-6 lg:-mx-8 min-h-screen border-none shadow-none">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <p className="text-red-600 font-semibold">Error loading institution features</p>
                <p className="text-gray-600 mt-2">{assignmentsError}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-10 -mx-4 sm:-mx-6 lg:-mx-8 min-h-screen border-none shadow-none ">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* View Mode Toggle */}
          <div className="flex justify-end">
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
              <button
                onClick={() => setViewMode('overall')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'overall'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:text-orange-500'
                }`}
              >
                Overall Features
              </button>
              <button
                onClick={() => setViewMode('institution')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'institution'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:text-orange-500'
                }`}
                disabled={!selectedInstitutionId}
              >
                Institution Features
              </button>
            </div>
          </div>

          {/* View Mode Description */}
          <div className="text-center text-sm text-gray-600">
            {viewMode === 'overall'
              ? 'Showing all available features with their global activation status'
              : 'Showing features for the selected institution with their specific activation status'
            }
          </div>

          {/* Update status messages */}
          {updateError && viewMode === 'institution' && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-2 rounded">
              {updateError}
            </div>
          )}
          {updateSuccess && viewMode === 'institution' && (
            <div className="text-center text-sm text-green-700 bg-green-50 p-2 rounded">
              {updateSuccess}
            </div>
          )}

          {/* Institution Selector - only show when in institution view */}
          {viewMode === 'institution' && (
            <Select
              value={selectedInstitutionId}
              onValueChange={(val) => setSelectedInstitutionId(val)}
            >
              <SelectTrigger className="h-12 rounded-lg">
                <SelectValue placeholder={institutionsLoading ? "Loading institutions..." : "Select Institution"} />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((ins) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="mt-6 max-w-7xl mx-auto">
          <Card className="bg-white shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">
                {viewMode === 'overall' ? 'Overall Features' : 'Institution Features'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                <TableHeader>
                  <TableRow className="bg-brand-gradient text-white">
                    <TableHead className="text-white font-semibold">
                      Feature name
                    </TableHead>
                    <TableHead className="text-white font-semibold">
                      Description
                    </TableHead>
                    <TableHead className="text-white font-semibold text-right">
                      {viewMode === 'overall' ? 'Global Status' : 'Status'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFeatures.map((f) => (
                    <TableRow key={f.key}>
                      <TableCell className="text-sm">{f.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {f.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={!!currentFeatureStatesForSelected[f.key]}
                          onCheckedChange={(checked) =>
                            handleToggle(f.key, !!checked)
                          }
                          disabled={
                            viewMode === 'overall' || updateLoading
                          }
                          aria-label={`${f.name} status`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                  </Table>
                </div>
              </div>
              {viewMode === 'institution' && (
                <div className="mt-4 flex items-center justify-end gap-3">
                  <Button
                    variant="default"
                    onClick={handleUpdate}
                    disabled={!hasUnsavedChanges || updateLoading}
                  >
                    {updateLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
