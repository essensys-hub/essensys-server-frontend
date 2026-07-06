import { SidebarMenu } from 'essensys-web-react';

// SidebarMenu is `lg:fixed lg:inset-y-0` (a full-height desktop rail). Rendered
// solo, its fixed positioning resolves against the card mount, so it needs a
// sized, transformed frame to give `inset-y-0` a real height — otherwise the
// flex-1 nav list collapses. The frame mirrors the app shell's left column.
export const Default = () => (
  <div style={{ position: 'relative', width: '240px', height: '720px', transform: 'translateZ(0)' }}>
    <SidebarMenu />
  </div>
);
