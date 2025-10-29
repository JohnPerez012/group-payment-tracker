export function encodeData(obj) {
  const json = JSON.stringify(obj);
  return btoa(encodeURIComponent(json));
}

export function decodeData(encodedStr) {
  try {
    const decoded = decodeURIComponent(atob(encodedStr));
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Decode failed:", err);
    return { members: [], payments: [], tabs: [] };
  }
}
