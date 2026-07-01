export interface FsNode {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  type: "file" | "directory";
  name: string;
  content: string | null;
  mode: number;
  owner_uid: string;
  group_id: string | null;
  size: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type PermissionAction = "read" | "write" | "execute";

/**
 * Extract the permission digit for a given scope from a 3-digit octal mode.
 */
export function getScopeDigit(mode: number, scope: "owner" | "group" | "others"): number {
  const modeStr = mode.toString().padStart(3, "0");
  if (scope === "owner") return parseInt(modeStr[0] || "0", 10);
  if (scope === "group") return parseInt(modeStr[1] || "0", 10);
  return parseInt(modeStr[2] || "0", 10);
}

/**
 * Validates if the user has the required permission action on a node.
 */
export function hasPermission(
  node: FsNode,
  uid: string,
  action: PermissionAction,
  userGroupIds: string[] = []
): boolean {
  // Determine scope: owner, group, or others
  const scope =
    node.owner_uid === uid
      ? "owner"
      : node.group_id && userGroupIds.includes(node.group_id)
      ? "group"
      : "others";

  const digit = getScopeDigit(node.mode, scope);
  const bit = { read: 4, write: 2, execute: 1 }[action];

  return (digit & bit) === bit;
}
