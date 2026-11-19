
export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span>{title}</span>

        <div className={`stat-icon ${color}`}>
          {Icon && <Icon size={20} strokeWidth={1.8} />}
        </div>
      </div>

      <h2>{value ?? 0}</h2>

      <p>{description}</p>
    </div>
  );
}
