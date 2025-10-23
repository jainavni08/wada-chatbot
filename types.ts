export enum Language {
  EN = 'English',
  HI = 'Hindi',
  ES = 'Español',
  FR = 'Français',
  BN = 'বাংলা', // Bengali
  TA = 'தமிழ்', // Tamil
  TE = 'తెలుగు', // Telugu
  MR = 'मराठी', // Marathi
  GU = 'ગુજરાતી', // Gujarati
}

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type Message = {
  id: string;
  role: Role;
  text: string;
  imagePreview?: string;
};

export type ImageFile = {
  file: File;
  preview: string;
};
