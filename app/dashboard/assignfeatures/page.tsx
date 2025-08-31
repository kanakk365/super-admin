"use client";

import { useMemo, useState } from "react";
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

type Feature = {
  key: string;
  name: string;
  description: string;
};

const ALL_FEATURES: Feature[] = [
  {
    key: "ai_tutor",
    name: "AI Tutor Chat",
    description: "Enables students to interact with AI-based tutor",
  },
  {
    key: "quiz_generator",
    name: "Quiz Generator",
    description: "Allows quiz creation and submission",
  },
  {
    key: "personalized_learning",
    name: "Personalized Learning",
    description: "Adaptive recommendations based on performance",
  },
  {
    key: "exam_tab_lock",
    name: "Exam Tab Lock",
    description: "Prevents tab switching during test mode",
  },
  {
    key: "progress_dashboard",
    name: "Progress Dashboard",
    description: "Enables learning graphs for students",
  },
  {
    key: "household_tracking",
    name: "Household Tracking",
    description: "Tracks multiple students per household",
  },
  {
    key: "pbl",
    name: "PBL (Project Based Learning)",
    description: "Enables project submission tools",
  },
  {
    key: "blog_access",
    name: "Blog Access",
    description: "Allows school to publish educational blogs",
  },
];

const INSTITUTIONS = [
  { id: "ins_1", name: "Select Institution" },
  { id: "ins_2", name: "Sunrise High School" },
  { id: "ins_3", name: "Green Valley Academy" },
  { id: "ins_4", name: "Bluebird International" },
];

export default function AssignFeaturesPage() {
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>(
    INSTITUTIONS[0].id
  );

  // Map institution -> feature enabled state
  const [institutionFeatures, setInstitutionFeatures] = useState<
    Record<string, Record<string, boolean>>
  >(() => ({}));

  const featureStatesForSelected = useMemo(() => {
    const current = institutionFeatures[selectedInstitutionId];
    if (current) return current;
    // default: enable all
    const defaults: Record<string, boolean> = {};
    ALL_FEATURES.forEach((f) => (defaults[f.key] = true));
    return defaults;
  }, [institutionFeatures, selectedInstitutionId]);

  const handleToggle = (featureKey: string, checked: boolean) => {
    setInstitutionFeatures((prev) => {
      const nextForInstitution: Record<string, boolean> = {
        ...(prev[selectedInstitutionId] ?? featureStatesForSelected),
        [featureKey]: checked,
      };
      return { ...prev, [selectedInstitutionId]: nextForInstitution };
    });
  };

  return (
    <div className="-m-10 -mx-4 sm:-mx-6 lg:-mx-8 min-h-screen border-none shadow-none ">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Select
            value={selectedInstitutionId}
            onValueChange={(val) => setSelectedInstitutionId(val)}
          >
            <SelectTrigger className="h-12 rounded-lg">
              <SelectValue placeholder="Select Institution" />
            </SelectTrigger>
            <SelectContent>
              {INSTITUTIONS.map((ins) => (
                <SelectItem key={ins.id} value={ins.id}>
                  {ins.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 max-w-7xl mx-auto">
          <Card className="bg-white shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Assigned Features</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="text-gray-900 font-semibold">
                      Feature name
                    </TableHead>
                    <TableHead className="text-gray-900 font-semibold">
                      Description
                    </TableHead>
                    <TableHead className="text-gray-900 font-semibold text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ALL_FEATURES.map((f) => (
                    <TableRow key={f.key}>
                      <TableCell className="text-sm">{f.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {f.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={!!featureStatesForSelected[f.key]}
                          onCheckedChange={(checked) =>
                            handleToggle(f.key, !!checked)
                          }
                          aria-label={`${f.name} status`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
