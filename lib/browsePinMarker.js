import iconData from "@/components/icons/hugeicons-data.json";

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function iconSvgHtml(name, size = 15) {
  const icon = iconData[name] || iconData.Sparkles;
  const body = String(icon.body || "")
    .replace(/stroke="currentColor"/g, 'stroke="#F7F4EC"')
    .replace(/stroke-width="1\.5"/g, 'stroke-width="1.8"');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${esc(icon.viewBox || "0 0 24 24")}" width="${size}" height="${size}" fill="none" aria-hidden="true">${body}</svg>`;
}

/** Leaflet divIcon HTML: navy pin with category glyph + budget. */
export function browsePinMarkerHtml({ icon, priceLabel, selected }) {
  const fill = selected ? "#2F8AD4" : "#163044";
  const width = selected ? 56 : 50;
  const glyph = iconSvgHtml(icon, selected ? 16 : 14);
  const price = esc(priceLabel || "₱0");
  const state = selected ? "is-selected" : "";
  return `<div class="browse-map-pin ${state}" style="--pin-fill:${fill};min-width:${width}px">
    <div class="browse-map-pin__body">
      ${glyph}
      <span class="browse-map-pin__price">${price}</span>
    </div>
    <div class="browse-map-pin__tip"></div>
  </div>`;
}

export function browsePinIconSize(selected) {
  return selected ? [64, 66] : [56, 58];
}

export function browsePinIconAnchor(selected) {
  const [, h] = browsePinIconSize(selected);
  return [selected ? 32 : 28, h];
}
