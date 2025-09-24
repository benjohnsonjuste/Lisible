export default function PostCard({ post }) {
  return (
    <article className="bg-white rounded shadow p-4">
      <h3 className="font-bold text-lg">{post.title}</h3>
      <p className="text-sm text-gray-500">{post.views || 0} vues</p>
    </article>
  );
}
