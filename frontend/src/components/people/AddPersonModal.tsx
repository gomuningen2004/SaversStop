type AddPersonModalProps = {
  name: string;
  saving: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function AddPersonModal({
  name,
  saving,
  onNameChange,
  onClose,
  onSubmit,
}: AddPersonModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Add Person</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add someone you have an outstanding IOU with.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !saving) {
                onSubmit();
              }
            }}
            autoFocus
            placeholder="Rahul"
            disabled={saving}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Person'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddPersonModal;
