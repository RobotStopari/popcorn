export default function RandomPickFrame({ badge, icon, variant, children, footer }) {
  const variantClass = variant ? ` random-pick--${variant}` : '';

  return (
    <div className={`random-pick reveal reveal--scale${variantClass}`}>
      <div className="random-pick__frame">
        <div className="random-pick__layout">
          <div className="random-pick__aside">
            {icon && (
              <span
                className="random-pick__icon"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: icon }}
              />
            )}
            <p className="random-pick__badge">{badge}</p>
          </div>

          <div className="random-pick__main">
            {children}
          </div>
        </div>

        {footer && (
          <div className="random-pick__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
