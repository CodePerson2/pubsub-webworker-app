export const WORKER_TYPES = {
  IMAGE_TO_GREYSCALE: 'image-to-greyscale',
  PASSWORD_HASH: 'password-hash',
  TEXT_SUMMARIZATION: 'text-summarization'
};

export const WORKER_TYPE_LABELS = {
  [WORKER_TYPES.IMAGE_TO_GREYSCALE]: 'Image to GreyScale',
  [WORKER_TYPES.PASSWORD_HASH]: 'Hash Password',
  [WORKER_TYPES.TEXT_SUMMARIZATION]: 'Text Summarization'
}; 

export const MAX_WORKERS = 3;