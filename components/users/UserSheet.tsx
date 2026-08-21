"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppUser } from "@/types";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Loader2,
  Shield,
  User,
  Briefcase,
  Building2,
  AlertCircle,
} from "lucide-react";

import { useCreateUser, useUpdateUser } from "@/hooks/use-user";
import { useBranches } from "@/hooks/use-branches";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

const createSchema = z
  .object({
    name: z.string().min(1, "Name is required"),

    email: z.string().email("Invalid email"),

    username: z
      .string()
      .regex(
        /^[a-z][a-z0-9_]{2,19}$/,
        "Username must be 3-20 characters and contain only lowercase letters, numbers and underscores",
      ),

    password: z.string().min(8, "Minimum 8 characters"),

    role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),

    branchId: z.string().optional(),

    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "ADMIN" && !data.branchId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Branch is required for this role",
        path: ["branchId"],
      });
    }
  });

const editSchema = z
  .object({
    name: z.string().min(1, "Name is required"),

    email: z.string().email("Invalid email"),

    username: z
      .string()
      .regex(
        /^[a-z][a-z0-9_]{2,19}$/,
        "Username must be 3-20 characters and contain only lowercase letters, numbers and underscores",
      ),

    role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),

    branchId: z.string().optional(),

    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "ADMIN" && !data.branchId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Branch is required for this role",
        path: ["branchId"],
      });
    }
  });

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    value: "ADMIN" as const,
    label: "Admin",
    desc: "Full system access",
    icon: Shield,
    color: "text-red-500",
  },
  {
    value: "MANAGER" as const,
    label: "Manager",
    desc: "No user management",
    icon: Briefcase,
    color: "text-blue-500",
  },
  {
    value: "CASHIER" as const,
    label: "Cashier",
    desc: "POS and orders only",
    icon: User,
    color: "text-green-500",
  },
];

type Role = "ADMIN" | "MANAGER" | "CASHIER";

type Props = {
  open: boolean;
  onClose: () => void;
  user?: AppUser;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const UserSheet = ({ open, onClose, user }: Props) => {
  const isEdit = Boolean(user);

  // ───────────────────────────────────────────────────────────────────────────
  // Mutations
  // ───────────────────────────────────────────────────────────────────────────

  const { mutate: create, isPending: creating } = useCreateUser(onClose);

  const { mutate: update, isPending: updating } = useUpdateUser(
    user?.id ?? "",
    onClose,
  );

  const isPending = creating || updating;

  // ───────────────────────────────────────────────────────────────────────────
  // Branches
  // ───────────────────────────────────────────────────────────────────────────

  const { data: branches = [], isLoading: loadingBranches } = useBranches();

  const activeBranches = branches.filter((branch) => branch.isActive);

  /*

When editing, include the user's current branch even if it has
subsequently become inactive.


This prevents the Select from appearing empty when an existing
user is assigned to an inactive branch.
*/
  const selectableBranches = isEdit
    ? branches.filter(
        (branch) => branch.isActive || branch.id === (user?.branchId ?? ""),
      )
    : activeBranches;

  // ───────────────────────────────────────────────────────────────────────────
  // Create form
  // ───────────────────────────────────────────────────────────────────────────

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),

    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      role: "CASHIER",
      branchId: "",
      isActive: true,
    },
  });

  const createRole = createForm.watch("role");

  // ───────────────────────────────────────────────────────────────────────────
  // Edit form
  // ───────────────────────────────────────────────────────────────────────────

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),

    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      role: (user?.role ?? "CASHIER") as Role,
      branchId: user?.branchId ?? "",
      isActive: user?.isActive ?? true,
    },
  });

  const editRole = editForm.watch("role");

  // ───────────────────────────────────────────────────────────────────────────
  // Reset forms when opening / changing user
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      return;
    }

    if (user) {
      editForm.reset({
        name: user.name ?? "",
        email: user.email ?? "",
        username: user.username ?? "",
        role: user.role as Role,
        branchId: user.branchId ?? "",
        isActive: user.isActive ?? true,
      });

      return;
    }

    createForm.reset({
      name: "",
      email: "",
      username: "",
      password: "",
      role: "CASHIER",
      branchId: "",
      isActive: true,
    });
  }, [open, user, createForm, editForm]);

  // ───────────────────────────────────────────────────────────────────────────
  // Submit handlers
  // ───────────────────────────────────────────────────────────────────────────

  const onCreateSubmit = (values: CreateValues) => {
    create(values);
  };

  const onEditSubmit = (values: EditValues) => {
    update(values);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Close
  // ───────────────────────────────────────────────────────────────────────────

  const handleClose = () => {
    createForm.reset();
    editForm.reset();
    onClose();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Role selector
  // ───────────────────────────────────────────────────────────────────────────

  const renderRoleSelector = ({
    value,
    onChange,
    onAdminSelected,
  }: {
    value: string;
    onChange: (value: Role) => void;
    onAdminSelected: () => void;
  }) => {
    return (
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((role) => {
          const Icon = role.icon;

          const isSelected = value === role.value;

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => {
                onChange(role.value);

                /*
                 * IMPORTANT:
                 *
                 * Only clear the branch when the user actually
                 * selects ADMIN.
                 *
                 * We do NOT use a useEffect based on the role,
                 * because that would clear the existing branch
                 * immediately when editing an existing user.
                 */
                if (role.value === "ADMIN") {
                  onAdminSelected();
                }
              }}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Icon
                size={18}
                className={isSelected ? role.color : "text-muted-foreground"}
              />

              <span
                className={`text-xs font-medium ${
                  isSelected ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {role.label}
              </span>

              <span className="text-[10px] leading-tight text-muted-foreground">
                {role.desc}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Branch selector
  // ───────────────────────────────────────────────────────────────────────────

  const renderBranchSelector = ({
    value,
    onChange,
    invalid,
    errorMessage,
  }: {
    value: string;
    onChange: (value: string) => void;
    invalid: boolean;
    errorMessage?: string;
  }) => {
    return (
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor={isEdit ? "edit-branch" : "branch"}>
          Assigned branch <span className="text-destructive">*</span>
        </FieldLabel>

        {loadingBranches ? (
          <Skeleton className="h-9 w-full rounded-md" />
        ) : selectableBranches.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <AlertCircle size={14} className="shrink-0 text-orange-500" />
            No active branches found. Create a branch first.
          </div>
        ) : (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger
              id={isEdit ? "edit-branch" : "branch"}
              className={invalid ? "border-destructive" : ""}
            >
              <Building2 size={13} className="shrink-0 text-muted-foreground" />

              <SelectValue placeholder="Select a branch..." />
            </SelectTrigger>

            <SelectContent>
              {selectableBranches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex items-center gap-2">
                    <span>{branch.name}</span>

                    <span className="font-mono text-[10px] text-muted-foreground">
                      ({branch.code})
                    </span>

                    {branch.isDefault && (
                      <span className="rounded bg-muted px-1 text-[9px]">
                        Main
                      </span>
                    )}

                    {!branch.isActive && (
                      <span className="rounded bg-destructive/10 px-1 text-[9px] text-destructive">
                        Inactive
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <FieldDescription>
          This user will only see data from the selected branch.
        </FieldDescription>

        {invalid && errorMessage && (
          <FieldError
            errors={[
              {
                message: errorMessage,
              },
            ]}
          />
        )}
      </Field>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
    >
      <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-md">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? "Edit User" : "Add New User"}</SheetTitle>

          <SheetDescription>
            {isEdit
              ? `Editing ${user?.name ?? "user"}`
              : "Create a new user account"}
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-6" />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CREATE USER */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        {!isEdit && (
          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-5"
          >
            <FieldGroup className="space-y-4">
              {/* Name */}
              <Controller
                name="name"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">
                      Full name <span className="text-destructive">*</span>
                    </FieldLabel>

                    <Input
                      {...field}
                      id="name"
                      placeholder="e.g. John Doe"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </FieldLabel>

                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Username */}
              <Controller
                name="username"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username">
                      Username <span className="text-destructive">*</span>
                    </FieldLabel>

                    <Input
                      {...field}
                      id="username"
                      type="text"
                      placeholder="cashier01"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />

                    <FieldDescription>
                      3-20 characters: lowercase letters, numbers and
                      underscores.
                    </FieldDescription>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Password */}
              <Controller
                name="password"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">
                      Password <span className="text-destructive">*</span>
                    </FieldLabel>

                    <Input
                      {...field}
                      id="password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Role */}
              <Field>
                <FieldLabel>
                  Role <span className="text-destructive">*</span>
                </FieldLabel>

                <Controller
                  name="role"
                  control={createForm.control}
                  render={({ field }) =>
                    renderRoleSelector({
                      value: field.value,
                      onChange: field.onChange,
                      onAdminSelected: () => {
                        createForm.setValue("branchId", undefined, {
                          shouldValidate: false,
                          shouldDirty: true,
                        });
                      },
                    })
                  }
                />
              </Field>

              {/* Branch */}
              {createRole !== "ADMIN" && (
                <Controller
                  name="branchId"
                  control={createForm.control}
                  render={({ field, fieldState }) =>
                    renderBranchSelector({
                      value: field.value ?? "",
                      onChange: field.onChange,
                      invalid: fieldState.invalid,
                      errorMessage: fieldState.error?.message,
                    })
                  }
                />
              )}
            </FieldGroup>

            <Separator />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>

              <Button type="submit" className="flex-1" disabled={isPending}>
                {creating && (
                  <Loader2 size={15} className="mr-2 animate-spin" />
                )}

                {creating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* EDIT USER */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        {isEdit && (
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="space-y-5"
          >
            <FieldGroup className="space-y-4">
              {/* Name */}
              <Controller
                name="name"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-name">
                      Full name <span className="text-destructive">*</span>
                    </FieldLabel>

                    <Input
                      {...field}
                      id="edit-name"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-email">
                      Email <span className="text-destructive">*</span>
                    </FieldLabel>

                    <Input
                      {...field}
                      id="edit-email"
                      type="email"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Username */}
              <Controller
                name="username"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-username">
                      Username <span className="text-destructive">*</span>
                    </FieldLabel>

                    <Input
                      {...field}
                      id="edit-username"
                      type="text"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />

                    <FieldDescription>
                      3-20 characters: lowercase letters, numbers and
                      underscores.
                    </FieldDescription>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Role */}
              <Field>
                <FieldLabel>
                  Role <span className="text-destructive">*</span>
                </FieldLabel>

                <Controller
                  name="role"
                  control={editForm.control}
                  render={({ field }) =>
                    renderRoleSelector({
                      value: field.value,
                      onChange: field.onChange,
                      onAdminSelected: () => {
                        editForm.setValue("branchId", undefined, {
                          shouldValidate: false,
                          shouldDirty: true,
                        });
                      },
                    })
                  }
                />
              </Field>

              {/* Branch */}
              {editRole !== "ADMIN" && (
                <Controller
                  name="branchId"
                  control={editForm.control}
                  render={({ field, fieldState }) =>
                    renderBranchSelector({
                      value: field.value ?? "",
                      onChange: field.onChange,
                      invalid: fieldState.invalid,
                      errorMessage: fieldState.error?.message,
                    })
                  }
                />
              )}

              {/* Active */}
              <Controller
                name="isActive"
                control={editForm.control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FieldLabel>Active account</FieldLabel>

                      <FieldDescription>
                        Inactive users cannot log in
                      </FieldDescription>
                    </div>

                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </FieldGroup>

            <Separator />

            {editForm.formState.isDirty && (
              <p className="text-center text-xs text-muted-foreground">
                You have unsaved changes
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || !editForm.formState.isDirty}
              >
                {updating && (
                  <Loader2 size={15} className="mr-2 animate-spin" />
                )}

                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};
