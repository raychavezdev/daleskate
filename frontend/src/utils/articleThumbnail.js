const parseContent = (content) => {
  if (Array.isArray(content)) return content;
  if (!content || typeof content !== "string") return [];

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getYouTubeVideoId = (value) => {
  if (typeof value !== "string" || !value) return "";

  try {
    const match = value.match(/https?:\/\/[^\s<>"']+/i);
    if (!match) return "";
    const url = new URL(match[0].replace(/&amp;/g, "&"));
    const host = url.hostname.toLowerCase();
    if (host === "youtu.be" || host === "www.youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
      return "";
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (["shorts", "embed", "live"].includes(segments[0])) return segments[1] || "";
    return url.searchParams.get("v") || "";
  } catch {
    return "";
  }
};

export const getArticleThumbnail = (article) => {
  if (!article) return "";
  if (article.banner) return article.banner;
  if (article.banner_mobile) return article.banner_mobile;

  const video = parseContent(article.contenido).find(
    (block) =>
      (block.tipo === "video" || block.tipo === "video_externo") &&
      (block.valor || block.preview),
  );

  if (!video) return "";
  if (video.preview) return video.preview;

  const videoId = getYouTubeVideoId(video.valor);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};
