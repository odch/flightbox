type UpdatedByItem = {
  by?: string | null;
  uid?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
};

export default function formatUpdatedBy(item: UpdatedByItem): string | null {
  const name = [item.firstname, item.lastname]
    .filter(s => typeof s === 'string' && s.trim().length > 0)
    .join(' ')
    .trim();

  if (name && item.email) return `${name} (${item.email})`;
  if (name) return name;
  if (item.email) return item.email;
  if (item.uid) return item.uid;
  return item.by || null;
}
