import { supabaseAdmin } from './server';

/**
 * Fetch all published blog posts for the listing page
 * @returns {Promise<Array>} List of posts
 */
export async function getAllPosts() {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('id, title, slug, excerpt, cover_image, published_at, tags')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in getAllPosts:', err);
    return [];
  }
}

/**
 * Fetch a single blog post by slug
 * @param {string} slug 
 * @returns {Promise<Object|null>} Post object or null
 */
export async function getPostBySlug(slug) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) {
    // console.error(`Error fetching post with slug "${slug}":`, error);
    return null;
  }
  return data;
}

/**
 * Fetch all compiled slugs for static generation
 * @returns {Promise<Array>} List of slugs
 */
export async function getAllPostSlugs() {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('slug')
      .eq('published', true);
  
    if (error) {
      console.error('Error fetching slugs:', error);
      return [];
    }
    return data.map(p => p.slug);
  }
