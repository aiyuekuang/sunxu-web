import { createContext, useContext, type ReactNode } from 'react';

/**
 * Who owns the visible workspace frame (the inset between the app shell and page content).
 *
 * - `container`: Sunxu page containers own the frame and apply the workspace gutter.
 * - `host`: the host shell already owns the frame; page containers must not add a second inset.
 */
export type WorkspaceFrame = 'container' | 'host';

export const WorkspaceFrameContext = createContext<WorkspaceFrame>('container');

export function useWorkspaceFrame(): WorkspaceFrame {
  return useContext(WorkspaceFrameContext);
}

export function WorkspaceFrameProvider({
  value,
  children,
}: {
  value: WorkspaceFrame;
  children: ReactNode;
}) {
  return (
    <WorkspaceFrameContext.Provider value={value}>
      {children}
    </WorkspaceFrameContext.Provider>
  );
}
