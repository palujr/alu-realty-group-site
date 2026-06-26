"use client";

import { useState } from "react";

type BrandColorFieldProps = {
  label: string;
  name: string;
  defaultValue: string;
};

function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toLowerCase() : "#17221f";
}

export function BrandColorField({ label, name, defaultValue }: BrandColorFieldProps) {
  const [color, setColor] = useState(normalizeHexColor(defaultValue));

  return (
    <label className="admin-color-field">
      {label}
      <div className="admin-color-control">
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
        <input
          aria-label={`${label} hex code`}
          name={name}
          type="text"
          value={color}
          pattern="#?[0-9a-fA-F]{6}"
          onChange={(event) => setColor(event.target.value)}
        />
      </div>
    </label>
  );
}
