/**
 * Generates a consistent owl-themed avatar URL using DiceBear's avataaars API
 * @param {string} seed - The seed for generating the avatar (usually user ID or email)
 * @returns {string} - URL of the generated owl avatar
 */
export const getOwlAvatar = (seed) => {
  const baseUrl = 'https://api.dicebear.com/7.x/avataaars/svg';
  const options = {
    seed: seed || 'default',
    // Owl-like features
    top: 'hat',
    accessories: 'round',
    hairColor: 'a95f34',
    facialHair: 'none',
    clothes: 'shirtVNeck',
    eyes: 'winkWacky',
    eyebrow: 'upDown',
    mouth: 'smile',
    skin: 'light',
    // Customizations for owl theme
    backgroundType: 'gradientLinear',
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9'],
    // Ensure consistent owl-like appearance
    features: ['hat', 'glasses', 'earrings'],
    // Randomize some aspects while keeping the owl theme
    randomizeIds: true,
  };

  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else {
      params.append(key, value);
    }
  });

  return `${baseUrl}?${params.toString()}`;
};

export default getOwlAvatar;
