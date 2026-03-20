const admin = require("firebase-admin");

const getPrivateKey = () => {
  const value = process.env.FIREBASE_PRIVATE_KEY || "";
  return value.replace(/\\n/g, "\n");
};

const ensureAdminApp = () => {
  if (admin.apps.length) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin environment variables. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    ensureAdminApp();

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!idToken) {
      return res.status(401).json({ error: "Missing admin token." });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const adminDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete users." });
    }

    const targetUid = String(req.body?.uid || "").trim();
    if (!targetUid) {
      return res.status(400).json({ error: "Target uid is required." });
    }

    if (targetUid === decodedToken.uid) {
      return res.status(400).json({ error: "Admin cannot delete their own account." });
    }

    const targetDocRef = admin.firestore().collection("users").doc(targetUid);
    const targetDoc = await targetDocRef.get();
    if (!targetDoc.exists) {
      return res.status(404).json({ error: "User profile not found." });
    }

    if (targetDoc.data()?.role === "admin") {
      return res.status(400).json({ error: "Admin accounts are protected." });
    }

    await admin.auth().deleteUser(targetUid);
    await targetDocRef.delete();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("admin-delete-user error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to delete user permanently.",
    });
  }
};
