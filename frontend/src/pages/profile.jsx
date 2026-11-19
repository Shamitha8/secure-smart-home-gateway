
export default function Profile() {
  const username = sessionStorage.getItem("username") || "User";
  const email = sessionStorage.getItem("email") || "Not available";

  return (
    <div className="profile-page">
      <h2>My Profile</h2>

      <div className="profile-card">
        <div className="profile-avatar">
          {username.charAt(0).toUpperCase()}
        </div>

        <h3>{username}</h3>
        <p>{email}</p>

        <hr />

        <p><strong>Username:</strong> {username}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Account:</strong> Active</p>
      </div>
    </div>
  );
}
