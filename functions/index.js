const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNewPostNotification = functions.firestore
  .document("clubPosts/{postId}")
  .onCreate(async (snap, context) => {
    const post = snap.data();

    // récupérer tous les tokens
    const tokensSnap = await admin.firestore().collection("userTokens").get();
    const tokens = tokensSnap.docs.map(d => d.data().token);

    if (tokens.length > 0) {
      await admin.messaging().sendMulticast({
        tokens,
        notification: {
          title: `${post.authorName} a publié`,
          body: post.type === "text" ? post.content.slice(0, 50) : "Nouveau média disponible",
        }
      });
    }
  });
