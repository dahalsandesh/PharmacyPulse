import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Ctrl+N', description: 'New Sale', global: true },
    { key: 'Ctrl+M', description: 'Medicines', global: true },
    { key: 'Ctrl+P', description: 'Purchases', global: true },
    { key: 'Ctrl+D', description: 'Damage Log', global: true },
    { key: 'Ctrl+R', description: 'Reports', global: true },
    { key: 'Ctrl+H', description: 'Dashboard', global: true },
    { key: 'Enter', description: 'Complete Sale', global: false },
    { key: 'Escape', description: 'Clear Cart/Close Modal', global: false },
    { key: 'Ctrl+/', description: 'Focus Search', global: false },
    { key: 'F1', description: 'Cash Payment', global: false },
    { key: 'F2', description: 'eSewa Payment', global: false },
    { key: 'F3', description: 'Khalti Payment', global: false },
    { key: 'F4', description: 'Card Payment', global: false },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Speed up your workflow with these keyboard shortcuts. They work throughout the application.
        </div>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded shadow-sm">
                  {shortcut.key}
                </kbd>
                <span className="text-sm font-medium text-gray-900">{shortcut.description}</span>
              </div>
              {shortcut.global && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Global</span>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Shortcuts don't work when typing in input fields</p>
            <p>• Use Ctrl on Windows/Linux, Cmd on Mac</p>
            <p>• Press Escape to close any modal or dialog</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Got it!</Button>
        </div>
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsHelp;
