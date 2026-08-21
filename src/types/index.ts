export interface Slug {
  _type?: 'slug';
  current: string;
}

export interface SanityImageAsset {
  _ref?: string;
  _id?: string;
  _type?: string;
  url?: string;
}

export interface SanityImage {
  _type: 'image';
  asset: SanityImageAsset;
  alt?: string;
  caption?: string;
}

export interface Author {
  _id: string;
  name: string;
  slug?: string;
  image?: SanityImage;
  bio?: string | PortableTextBlock[];
}

export interface Category {
  _id: string;
  title: string;
  slug: string;
  description?: string;
}

export interface PortableTextChild {
  _key?: string;
  _type: 'span' | string;
  text: string;
  marks?: string[];
}

export interface PortableTextBlock {
  _key?: string;
  _type: 'block' | string;
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote';
  children: PortableTextChild[];
  markDefs?: Array<{
    _key: string;
    _type: string;
    href?: string;
  }>;
  listItem?: 'bullet' | 'number';
  level?: number;
}

export interface RelatedPostData {
  _id: string;
  title: string;
  slug: string;
  mainImage?: SanityImage;
  publishedAt?: string;
  excerpt?: string;
  categories?: Category[];
}

export interface DynamicRelatedPostBlock {
  _key: string;
  _type: 'dynamicRelatedPost';
  data: RelatedPostData;
}

/**
 * Interface tratada para consumo no frontend (após expansão via projeção GROQ)
 */
export interface Post {
  _id: string;
  _createdAt: string;
  _updatedAt?: string;
  _type: 'post';
  title: string;
  slug: string;
  publishedAt: string;
  enrollmentEndDate?: string;
  examDate?: string;
  isExpired?: boolean;
  statusLabel?: string;
  mainImage?: SanityImage;
  excerpt?: string;
  author?: Author;
  categories?: Category[];
  body?: PortableTextBlock[];
}
