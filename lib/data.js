export let authors = [
  { uid: "user1", fullName: "Jean Dupont", email: "jean@example.com", createdAt: Date.now() }
];

export let texts = [
  {
    id: "text1",
    title: "Mon premier poème",
    content: "Voici le contenu du poème...",
    imageUrl: "/images/texts/poeme1.jpg",
    authorId: "user1",
    authorName: "Jean Dupont",
    createdAt: Date.now(),
    views: 0,
    likesCount: 0,
    commentsCount: 0,
    likes: [],
    viewsList: [],
    comments: []
  }
];