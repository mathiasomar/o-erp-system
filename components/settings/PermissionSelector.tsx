"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PERMISSION_GROUPS } from "@/lib/permission-groups";
import { Badge } from "@/components/ui/badge";

type Props = {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  disabled?: boolean;
};

export const PermissionSelector = ({
  selectedPermissions,
  onPermissionsChange,
  disabled = false,
}: Props) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(Object.keys(PERMISSION_GROUPS)),
  );

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const togglePermission = (permission: string) => {
    const updated = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission];
    onPermissionsChange(updated);
  };

  const toggleGroupPermissions = (group: string, permissions: string[]) => {
    const allSelected = permissions.every((p) =>
      selectedPermissions.includes(p),
    );

    if (allSelected) {
      // Deselect all in group
      const updated = selectedPermissions.filter(
        (p) => !permissions.includes(p),
      );
      onPermissionsChange(updated);
    } else {
      // Select all in group
      const updated = Array.from(
        new Set([...selectedPermissions, ...permissions]),
      );
      onPermissionsChange(updated);
    }
  };

  const totalPermissions = Object.values(PERMISSION_GROUPS).flat().length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Custom Permissions</CardTitle>
          <Badge variant="outline">
            {selectedPermissions.length}/{totalPermissions}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => {
          const isExpanded = expandedGroups.has(groupName);
          const groupSelectedCount = permissions.filter((p) =>
            selectedPermissions.includes(p),
          ).length;
          const isGroupFullySelected =
            groupSelectedCount === permissions.length;

          return (
            <div key={groupName} className="space-y-2">
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(groupName)}
                disabled={disabled}
                className="flex items-center gap-3 w-full p-2 rounded-lg
                           hover:bg-accent transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed"
              >
                <Checkbox
                  checked={
                    groupSelectedCount > 0 &&
                    groupSelectedCount < permissions.length
                      ? "indeterminate"
                      : isGroupFullySelected && permissions.length > 0
                  }
                  onChange={() =>
                    toggleGroupPermissions(groupName, permissions)
                  }
                  disabled={disabled}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="font-medium flex-1 text-left text-sm">
                  {groupName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {groupSelectedCount}/{permissions.length}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Permission items */}
              {isExpanded && (
                <div className="ml-6 space-y-2">
                  {permissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center gap-3 p-2 rounded-lg
                                hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        id={permission}
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        disabled={disabled}
                      />
                      <label
                        htmlFor={permission}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {permission}
                        </code>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {selectedPermissions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No permissions selected. Select permissions above to grant
            additional access.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
