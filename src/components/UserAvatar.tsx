export function UserAvatar({
  name,
  initials,
  color,
  size = 36,
}: {
  name: string;
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      title={name}
    >
      {initials}
    </span>
  );
}
