// Curated collection of educational/study-themed stock photos
const studyImages = [
  'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5212656/pexels-photo-5212656.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5212324/pexels-photo-5212324.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5212623/pexels-photo-5212623.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5212349/pexels-photo-5212349.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5212344/pexels-photo-5212344.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5212651/pexels-photo-5212651.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5212320/pexels-photo-5212320.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145354/pexels-photo-4145354.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145197/pexels-photo-4145197.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145356/pexels-photo-4145356.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145355/pexels-photo-4145355.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145353/pexels-photo-4145353.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145352/pexels-photo-4145352.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145351/pexels-photo-4145351.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145350/pexels-photo-4145350.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145349/pexels-photo-4145349.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145348/pexels-photo-4145348.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4145347/pexels-photo-4145347.jpeg?auto=compress&cs=tinysrgb&w=800'
];

const mathImages = [
  'https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729558/pexels-photo-3729558.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729559/pexels-photo-3729559.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729560/pexels-photo-3729560.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729561/pexels-photo-3729561.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729562/pexels-photo-3729562.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729563/pexels-photo-3729563.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729564/pexels-photo-3729564.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729565/pexels-photo-3729565.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3729566/pexels-photo-3729566.jpeg?auto=compress&cs=tinysrgb&w=800'
];

const educationImages = [
  'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/301926/pexels-photo-301926.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/207662/pexels-photo-207662.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/267507/pexels-photo-267507.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1370297/pexels-photo-1370297.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1370298/pexels-photo-1370298.jpeg?auto=compress&cs=tinysrgb&w=800'
];

export const getRandomImage = (category: 'study' | 'math' | 'education' = 'study'): string => {
  let imageArray: string[];
  
  switch (category) {
    case 'math':
      imageArray = mathImages;
      break;
    case 'education':
      imageArray = educationImages;
      break;
    default:
      imageArray = studyImages;
  }
  
  const randomIndex = Math.floor(Math.random() * imageArray.length);
  return imageArray[randomIndex];
};

export const getRandomImages = (count: number, category: 'study' | 'math' | 'education' = 'study'): string[] => {
  let imageArray: string[];
  
  switch (category) {
    case 'math':
      imageArray = mathImages;
      break;
    case 'education':
      imageArray = educationImages;
      break;
    default:
      imageArray = studyImages;
  }
  
  // Shuffle array and return requested count
  const shuffled = [...imageArray].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const getRandomImageWithFallback = (category: 'study' | 'math' | 'education' = 'study'): string => {
  try {
    return getRandomImage(category);
  } catch (error) {
    // Fallback to a reliable Pexels image
    return 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
};