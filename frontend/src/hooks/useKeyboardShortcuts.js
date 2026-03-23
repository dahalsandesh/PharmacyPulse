import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when user is typing in input fields
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.contentEditable === 'true'
      ) {
        return;
      }

      const key = [];
      if (event.ctrlKey || event.metaKey) key.push('ctrl');
      if (event.shiftKey) key.push('shift');
      if (event.altKey) key.push('alt');
      key.push(event.key.toLowerCase());

      const keyCombo = key.join('+');

      const shortcut = shortcuts.find(s => s.key === keyCombo);
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const useGlobalShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts = [
    { key: 'ctrl+n', action: () => navigate('/sales'), description: 'New Sale' },
    { key: 'ctrl+m', action: () => navigate('/medicines'), description: 'Medicines' },
    { key: 'ctrl+p', action: () => navigate('/purchases'), description: 'Purchases' },
    { key: 'ctrl+d', action: () => navigate('/damage'), description: 'Damage Log' },
    { key: 'ctrl+r', action: () => navigate('/reports'), description: 'Reports' },
    { key: 'ctrl+h', action: () => navigate('/'), description: 'Dashboard' },
    { key: 'escape', action: () => {
      // Close any open modals by triggering escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
    }, description: 'Close Modal' },
  ];

  useKeyboardShortcuts(shortcuts);
  return shortcuts;
};
