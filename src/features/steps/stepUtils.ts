export type PermissionStatus = "granted" | "denied" | "undetermined";

export function normalizePermissionStatus(status?: string): PermissionStatus {
  if (status === "granted" || status === "denied") {
    return status;
  }

  return "undetermined";
}
