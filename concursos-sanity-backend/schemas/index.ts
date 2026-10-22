import post from './documents/post';
import category from './documents/category';
import author from './documents/author';
import imageLibrary from './documents/imageLibrary';
import subscriber from './documents/subscriber';
import siteSettings from './documents/siteSettings';
import seo from './objects/seo';
import vacancyByRole from './objects/vacancyByRole';
import dynamicRelatedPost from './objects/dynamicRelatedPost';
import codeBlock from './objects/codeBlock';

export const schemaTypes = [
  // Documentos
  post,
  category,
  author,
  imageLibrary,
  subscriber,
  siteSettings,
  // Objetos
  seo,
  vacancyByRole,
  dynamicRelatedPost,
  codeBlock,
];
