export const retroHighContrastPalette = [
  "#FF4242", // Bright Red
  "#00B4A6", // Deep Turquoise
  "#0096C7", // Strong Sky Blue
  "#FF7043", // Deep Coral
  "#2A9D8F", // Dark Mint
  "#FFB800", // Golden Yellow
  "#D62828", // Dark Crimson
  "#2271B3", // Royal Blue
  "#198754", // Forest Green
  "#8338EC", // Rich Purple
  "#F05E23", // Burnt Orange
  "#087F8C", // Deep Teal
]

export const getColorForPerson = (index: number): string => {
  return retroHighContrastPalette[index % retroHighContrastPalette.length]
}
