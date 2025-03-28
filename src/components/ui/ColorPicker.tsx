import { useState } from "react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presetColors = [
    "#000000",
    "#ffffff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
  ];

  return (
    <div className="relative">
      <div
        className="h-10 w-full rounded-md border border-gray-300 cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <div className="absolute z-10 mt-2 p-2 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="grid grid-cols-4 gap-2">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                className="w-8 h-8 rounded-full border border-gray-300"
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  onChange(presetColor);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2 w-full h-8 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
