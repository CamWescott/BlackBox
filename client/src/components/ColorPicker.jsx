import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const colors = [
  '#22c55e', '#3b82f6', '#ef4444', '#f97316', '#a855f7',
  '#ec4899', '#14b8a6', '#eab308', '#06b6d4', '#f43f5e',
  '#8b5cf6', '#10b981', '#64748b', '#ffffff',
];

export default function ColorPicker({ currentColor, onColorChange }) {
  const { updateUser } = useAuth();

  const handleColor = async (color) => {
    try {
      await api.patch('/api/users/color', { icon_color: color });
      updateUser({ icon_color: color });
      if (onColorChange) onColorChange(color);
    } catch (err) {
      console.error('Failed to update color:', err);
    }
  };

  return (
    <div>
      <label className="block text-sm text-theme-muted mb-2">Your Icon Color</label>
      <div className="flex flex-wrap gap-2">
        {colors.map(c => (
          <button
            key={c}
            onClick={() => handleColor(c)}
            className={`w-7 h-7 rounded-full border-2 transition ${
              currentColor === c ? 'scale-110 border-theme-primary' : 'border-theme hover:border-theme-primary'
            }`}
            style={{
              backgroundColor: c,
              borderColor: currentColor === c ? 'var(--text-primary)' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
