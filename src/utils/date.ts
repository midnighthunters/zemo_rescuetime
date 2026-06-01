export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatRescueDate(dateKey?: string) {
  if (!dateKey) {
    return "Today";
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

export function getCurrentWeekDateKeys(date = new Date()) {
  const keys: string[] = [];
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  for (let index = 0; index < 7; index += 1) {
    const item = new Date(monday);
    item.setDate(monday.getDate() + index);
    keys.push(getLocalDateKey(item));
  }

  return keys;
}
