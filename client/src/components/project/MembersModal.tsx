import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addMember, fetchMembers, removeMember } from "../../store/slices/projectSlice";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Avatar from "../common/Avatar";
import { userApi } from "../../services";
import type { Role, User } from "../../types";

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function MembersModal({ open, onClose, projectId }: MembersModalProps) {
  const dispatch = useAppDispatch();
  const members = useAppSelector((s) => s.projects.members);
  const currentUserId = useAppSelector((s) => s.auth.user?.id);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("MEMBER");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) dispatch(fetchMembers(projectId));
  }, [open, projectId, dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      userApi.search(query.trim()).then(setResults).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return null;

  const me = members.find((m) => m.userId === currentUserId);
  const canManage = me?.role === "ADMIN";
  const alreadyMember = (userId: string) => members.some((m) => m.userId === userId);

  async function handleAdd(userId: string) {
    setBusy(true);
    try {
      await dispatch(addMember({ projectId, userId, role }));
      setSelected(null);
      setQuery("");
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeRole(userId: string, newRole: Role) {
    await dispatch(addMember({ projectId, userId, role: newRole }));
  }

  async function handleRemove(userId: string) {
    await dispatch(removeMember({ projectId, userId }));
  }

  const field =
    "w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none";

  return (
    <Modal open={open} onClose={onClose} title={`Members · ${members.length}`}>
      {canManage && (
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Add by email or name
          </label>
          <input
            value={selected ? selected.email : query}
            disabled={!!selected}
            onChange={(e) => setQuery(e.target.value)}
            className={field}
            placeholder="jane@example.com"
          />
          {!selected && results.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-md border border-gray-800 bg-gray-950">
              {results.map((u) => (
                <button
                  key={u.id}
                  disabled={alreadyMember(u.id)}
                  className="flex w-full items-center gap-3 border-b border-gray-800 px-3 py-2 text-left text-sm text-gray-200 last:border-0 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setSelected(u);
                    setQuery("");
                  }}
                >
                  <Avatar name={u.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{u.name}</span>
                    <span className="block truncate text-xs text-gray-500">{u.email}</span>
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    {alreadyMember(u.id) ? "Already a member" : "Add"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar name={selected.name} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
                {selected.name} ({selected.email})
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className={field}
                style={{ width: "auto" }}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <Button variant="secondary" disabled={busy} onClick={() => handleAdd(selected.id)}>
                Add
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      <ul className="divide-y divide-gray-800">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center gap-3 py-3">
            {m.user ? (
              <Avatar name={m.user.name} size="md" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-800" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-200">{m.user?.name ?? m.userId}</p>
              <p className="truncate text-xs text-gray-500">{m.user?.email ?? "Unknown user"}</p>
            </div>
            {canManage ? (
              <select
                value={m.role}
                onChange={(e) => handleChangeRole(m.userId, e.target.value as Role)}
                className={field}
                style={{ width: "auto" }}
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
            ) : (
              <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400">
                {roleLabels[m.role]}
              </span>
            )}
            {canManage && m.userId !== currentUserId && (
              <button
                className="text-xs font-medium text-gray-500 hover:text-red-400"
                onClick={() => handleRemove(m.userId)}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}