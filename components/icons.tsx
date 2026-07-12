export function BrandMarkIcon(props: { role?: string } = {}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role={props.role}
      aria-hidden={props.role ? undefined : "true"}
    >
      <path d="M5 5.75A2.75 2.75 0 0 1 7.75 3h8.5A2.75 2.75 0 0 1 19 5.75v12.5A2.75 2.75 0 0 1 16.25 21h-8.5A2.75 2.75 0 0 1 5 18.25V5.75Z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  );
}

export function ThemeIcons() {
  return (
    <>
      <svg
        class="theme-icon theme-icon-sun"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg
        class="theme-icon theme-icon-moon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.4 15.1A8.5 8.5 0 0 1 8.9 3.6 8.5 8.5 0 1 0 20.4 15.1Z" />
      </svg>
    </>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}
export function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v12M7.5 11.5 12 16l4.5-4.5M5 19h14" />
    </svg>
  );
}
export function DatasetIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11Z" />
      <path d="M8.5 9h7M8.5 12h7M8.5 15h4" />
    </svg>
  );
}
export function VisibleIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M7 17 17 7M8 7h9v9" />
      <path d="M5 5v14h14" />
    </svg>
  );
}
export function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 3 4.5 7v5c0 4.6 3.2 7.7 7.5 9 4.3-1.3 7.5-4.4 7.5-9V7L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
export function EmptyFileIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <path d="M17 13h22l8 8v30H17V13Z" />
      <path d="M39 13v10h8M24 31h16M24 38h16M24 45h10" />
    </svg>
  );
}
export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}
export function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9" />
    </svg>
  );
}
export function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h12l2 2v14H5V4Z" />
      <path d="M8 4v6h8V4M8 20v-6h8v6" />
    </svg>
  );
}
export function PollIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v6h-6" />
    </svg>
  );
}
export function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}
export function ModerateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4.5 7v5c0 4.6 3.2 7.7 7.5 9 4.3-1.3 7.5-4.4 7.5-9V7L12 3Z" />
      <path d="M9 12h6" />
    </svg>
  );
}
export function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}
