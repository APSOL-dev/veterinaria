export function getSidebarWidthClass(isCollapsed: boolean): string {
  return isCollapsed ? 'w-16' : 'w-64';
}

export function getMainPaddingClass(isCollapsed: boolean): string {
  return isCollapsed ? 'pl-16' : 'pl-64';
}

export function calculateWorkspaceLayout(isCollapsed: boolean, windowWidth: number) {
  const sidebarWidthPx = isCollapsed ? 64 : 256;
  const mainPaddingPx = isCollapsed ? 64 : 256;
  const availableWorkspaceWidthPx = windowWidth - sidebarWidthPx;

  return {
    sidebarWidthPx,
    mainPaddingPx,
    availableWorkspaceWidthPx,
    hasGap: sidebarWidthPx !== mainPaddingPx
  };
}
