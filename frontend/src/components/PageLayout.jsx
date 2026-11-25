export default function PageLayout({ eyebrow, title, description, children }) {
  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow"><span />{eyebrow}</p>
        <h1 className="page-heading">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </header>
      {children}
    </div>
  );
}
