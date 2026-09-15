export const PET_PHOTOS: Record<string, string> = {
  dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
  cat: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=500&auto=format&fit=crop&q=80',
  dove: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=500&auto=format&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=500&auto=format&fit=crop&q=80',
  rabbit: 'https://images.unsplash.com/photo-1535241749838-299277b6305f?w=500&auto=format&fit=crop&q=80',
}

export function getPetPhoto(key?: string | null): string {
  return (key && PET_PHOTOS[key]) || PET_PHOTOS.dog
}

const ICON_BY_NAME: Record<string, string> = {
  It: 'dog',
  Mushuk: 'cat',
  Qush: 'dove',
  Baliq: 'fish',
  Quyon: 'rabbit',
}

export function animalIconKey(name?: string | null): string {
  return (name && ICON_BY_NAME[name]) || 'paw'
}