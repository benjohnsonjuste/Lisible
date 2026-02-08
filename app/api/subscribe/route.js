// app/api/subscribe/route.js
export async function POST(req) {
  const { authorEmail, followerEmail } = await req.json();
  const path = `data/users/${btoa(authorEmail)}.json`;
  
  // 1. Get current author file
  // 2. Add followerEmail to author.stats.subscribersList
  // 3. author.stats.subscribers++
  // 4. PUT back to GitHub
  
  return NextResponse.json({ success: true });
}
