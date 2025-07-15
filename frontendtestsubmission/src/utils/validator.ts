export const isValidUrl = (url: string) => /^https?:\/\/.+\..+/.test(url);
export const isValidShortcode = (code: string) => /^[a-zA-Z0-9]{1,10}$/.test(code);
