import { formatDistanceToNow, format } from "date-fns";

export function timeAgo(value?: string | Date | null) {
  if (!value) return "";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function prettyDate(value?: string | Date | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy");
}

export function initials(name?: string | null) {
  if (!name) return "RH";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
