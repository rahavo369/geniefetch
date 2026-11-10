export async function onRequestGet({ env }) {
  try {
    const [products, videos, seasons, upcoming] = await Promise.all([
      env.DB.prepare("SELECT id, serial_no, name, type, category, season, video_number, video_title, image_url, price_text, purchase_url, description FROM products WHERE active=1 ORDER BY serial_no ASC, id DESC").all(),
      env.DB.prepare("SELECT id, video_number, title, season, publish_date, status, video_url, description FROM videos WHERE status='published' ORDER BY video_number DESC").all(),
      env.DB.prepare("SELECT id, name, slug, status, image_url, description, start_date, end_date FROM seasons WHERE status IN ('active','upcoming') ORDER BY start_date ASC, id DESC").all(),
      env.DB.prepare("SELECT id, title, type, season, expected_date, image_url, status, description FROM upcoming WHERE status IN ('coming_soon','in_progress') ORDER BY expected_date ASC, id DESC").all()
    ]);
    return Response.json({products:products.results,videos:videos.results,seasons:seasons.results,upcoming:upcoming.results});
  } catch (e) { return Response.json({error:"Database is not ready. Follow the setup guide."},{status:503}); }
}