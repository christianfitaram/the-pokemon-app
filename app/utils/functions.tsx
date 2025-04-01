export function capitalizeFirstLetter(text: string | null | undefined) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

export function getRandomNumber() {
    return Math.floor(Math.random() * 1302) + 1;
  }
  