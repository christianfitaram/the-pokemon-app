export function capitalizeFirstLetter(text: string | null | undefined) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
