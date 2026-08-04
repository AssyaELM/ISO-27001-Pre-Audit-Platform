export type WorkspaceIdentity = {
  workspaceCreationId: string;
  workspaceCreatedAt: string;
};

export function ensureWorkspaceIdentity(
  current: Partial<WorkspaceIdentity>,
  createId: () => string,
  createTimestamp: () => string,
): WorkspaceIdentity {
  return {
    workspaceCreationId: current.workspaceCreationId || createId(),
    workspaceCreatedAt: current.workspaceCreatedAt || createTimestamp(),
  };
}
